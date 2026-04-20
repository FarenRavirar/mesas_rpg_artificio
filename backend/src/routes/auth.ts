import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import { logActivity } from '../services/activityLogger';

const router = Router();

const requiredEnv = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'FRONTEND_URL',
  'JWT_SECRET',
] as const;

for (const envName of requiredEnv) {
  if (!process.env[envName]) {
    throw new Error(`[auth] Variável obrigatória ausente: ${envName}`);
  }
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL as string;
const FRONTEND_URL = process.env.FRONTEND_URL as string;
const JWT_SECRET = process.env.JWT_SECRET as string;
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();

type CookieSameSite = 'lax' | 'strict' | 'none';

const resolveCookieSameSite = (): CookieSameSite => {
  if (COOKIE_SAME_SITE === 'none') return 'none';
  if (COOKIE_SAME_SITE === 'strict') return 'strict';
  return 'lax';
};

const ALLOWED_FRONTEND_ORIGINS = Array.from(
  new Set(
    [FRONTEND_URL, ...(process.env.FRONTEND_URLS?.split(',') ?? [])]
      .map((url) => url.trim())
      .filter((url) => url.length > 0)
      .map((url) => new URL(url).origin)
  )
);
const DEFAULT_FRONTEND_ORIGIN = new URL(FRONTEND_URL).origin;

const getAllowedFrontendOrigin = (candidate?: string): string | null => {
  if (!candidate) return null;

  try {
    const origin = new URL(candidate).origin;
    return ALLOWED_FRONTEND_ORIGINS.includes(origin) ? origin : null;
  } catch {
    return null;
  }
};

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL
);

router.get('/google', (req: Request, res: Response) => {
  const requestedFrontendOrigin =
    typeof req.query.frontend_redirect === 'string'
      ? getAllowedFrontendOrigin(req.query.frontend_redirect)
      : null;

  const state = jwt.sign(
    {
      nonce: crypto.randomUUID(),
      timestamp: Date.now(),
      frontendRedirectOrigin: requestedFrontendOrigin,
    },
    JWT_SECRET,
    { expiresIn: '10m' }
  );

  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent',
    state,
  });

  res.redirect(authorizeUrl);
});

router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Código de autorização não recebido.' });
  }

  if (!state || typeof state !== 'string') {
    return res.status(400).json({ error: 'State inválido.' });
  }

  let frontendRedirectOrigin: string | null = null;

  try {
    const decodedState = jwt.verify(state, JWT_SECRET) as {
      nonce: string;
      timestamp: number;
      frontendRedirectOrigin?: string | null;
    };

    frontendRedirectOrigin = getAllowedFrontendOrigin(decodedState.frontendRedirectOrigin ?? undefined);
  } catch (error) {
    console.error('[OAuth] State inválido ou expirado:', error);
    return res.status(400).json({ error: 'State inválido ou expirado.' });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userinfoRes.ok) {
      console.error('[OAuth] Falha ao buscar userinfo:', userinfoRes.status, await userinfoRes.text());
      return res.status(502).json({ error: 'Falha ao recuperar informações do Google.' });
    }

    const userInfo = await userinfoRes.json() as {
      id: string;
      email: string;
      name?: string;
      given_name?: string;
      picture?: string;
    };

    if (!userInfo.email || !userInfo.id) {
      return res.status(400).json({ error: 'Falha ao recuperar informações básicas do Google.' });
    }

    let user = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', userInfo.email)
      .executeTakeFirst();

    let isNewUser = false;

    if (!user) {
      isNewUser = true;

      await db.transaction().execute(async (trx) => {
        const newUser = await trx
          .insertInto('users')
          .values({
            google_id: userInfo.id,
            email: userInfo.email,
            role: 'player',
            refresh_token: tokens.refresh_token || null,
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        user = newUser;

        const displayName = userInfo.name || userInfo.given_name || 'Jogador Aventureiro';

        await trx
          .insertInto('profiles')
          .values({
            user_id: user.id,
            display_name: displayName,
            bio: null,
            avatar_url: userInfo.picture || null,
          })
          .execute();

        await logActivity({
          actorId: null,
          action: 'user.registered',
          entityType: 'user',
          entityId: user.id,
          entityLabel: displayName,
          targetUserId: user.id,
          summary: `${displayName} registrou-se na comunidade.`,
          metadata: {
            provider: 'google',
            email: newUser.email,
          },
        }, trx);
      });
    } else if (tokens.refresh_token) {
      user = await db
        .updateTable('users')
        .set({ refresh_token: tokens.refresh_token })
        .where('id', '=', user.id)
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    if (!user) {
      throw new Error('Erro ao finalizar autenticação.');
    }

    const profile = await db
      .selectFrom('profiles')
      .select('display_name')
      .where('user_id', '=', user.id)
      .executeTakeFirst();

    let avatarUrl = userInfo.picture || null;

    if (user.role === 'gm') {
      const gmProfile = await db
        .selectFrom('gm_profiles')
        .select('avatar_url')
        .where('user_id', '=', user.id)
        .executeTakeFirst();

      if (gmProfile?.avatar_url) {
        avatarUrl = gmProfile.avatar_url;
      }
    }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        name: profile?.display_name || userInfo.name || 'Jogador',
        avatar_url: avatarUrl,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    const redirectPath =
      isNewUser ? '/onboarding' :
      user.role === 'gm' || user.role === 'admin' ? '/painel' :
      '/';

    const isProd = process.env.NODE_ENV === 'production';
    const sameSite = resolveCookieSameSite();

    const cookieOptions = {
      httpOnly: true,
      secure: sameSite === 'none' ? true : isProd,
      sameSite,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
    };

    res.cookie('am_session', accessToken, cookieOptions);

    console.log('[OAuth] Login bem-sucedido', {
      userId: user.id,
      email: user.email,
      role: user.role,
      isNewUser,
      timestamp: new Date().toISOString(),
    });

    const redirectOrigin = frontendRedirectOrigin || DEFAULT_FRONTEND_ORIGIN;
    const redirectUrl = `${redirectOrigin.replace(/\/$/, '')}${redirectPath}`;
    new URL(redirectUrl);

    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('[OAuth] Erro na autenticação Google OAuth:', error);
    return res.status(500).json({ error: 'Erro de autenticação com provedor externo.' });
  }
});

router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = resolveCookieSameSite();

  try {
    await db
      .updateTable('users')
      .set({ refresh_token: null })
      .where('id', '=', req.user!.userId)
      .execute();

    console.log('[OAuth] Logout bem-sucedido', {
      userId: req.user!.userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[OAuth] Erro ao invalidar refresh_token:', error);
  }

  res.clearCookie('am_session', {
    httpOnly: true,
    secure: sameSite === 'none' ? true : isProd,
    sameSite,
    path: '/',
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  });

  return res.json({ success: true, message: 'Logout concluído com sucesso.' });
});

export default router;
