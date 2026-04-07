import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { UserRole } from '../db/types';

const router = Router();

// Configuração fixa vinda do .env
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/callback';

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL
);

// Rota 1: Redireciona usuário para o Consent Screen do Google
router.get('/google', (req: Request, res: Response) => {
  // Gerar state assinado para prevenir CSRF
  const state = jwt.sign(
    { nonce: Math.random().toString(36).substring(7), timestamp: Date.now() },
    process.env.JWT_SECRET as string,
    { expiresIn: '10m' }
  );

  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    prompt: 'consent',
    state
  });
  
  res.redirect(authorizeUrl);
});

// Rota 2: Google Callback
router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Código de autorização não recebido.' });
  }

  // Validar state para prevenir CSRF
  if (!state || typeof state !== 'string') {
    return res.status(400).json({ error: 'State inválido.' });
  }

  try {
    jwt.verify(state, process.env.JWT_SECRET as string);
  } catch (error) {
    console.error('[OAuth] State inválido ou expirado:', error);
    return res.status(400).json({ error: 'State inválido ou expirado.' });
  }

  try {
    // 1. Trocar code por tokens
    const { tokens } = await oauth2Client.getToken(code);

    // 2. Buscar perfil do usuário no Google via endpoint de userinfo
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

    // 3. Upsert no Banco de Dados
    // Pesquisa se usuário já existe
    let user = await db.selectFrom('users')
      .selectAll()
      .where('email', '=', userInfo.email)
      .executeTakeFirst();
    
    let isNewUser = false;

    if (!user) {
      isNewUser = true;

      // Inicia Transação para criar User e Profile
      await db.transaction().execute(async (trx) => {
        // Insere em users
        const newUser = await trx.insertInto('users')
          .values({
            google_id: userInfo.id as string,
            email: userInfo.email as string,
            role: 'player', // Todos os novos usuários começam como player
            refresh_token: tokens.refresh_token || null,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
          
        user = newUser;

        // Insere em profiles
        await trx.insertInto('profiles')
          .values({
            user_id: user.id as string,
            display_name: userInfo.name || userInfo.given_name || 'Jogador Aventureiro',
            bio: null,
            avatar_url: userInfo.picture || null, // Salvar avatar do Google
          })
          .execute();
      });
    } else {
      // Atualiza refresh token se existir um novo
      if (tokens.refresh_token) {
        user = await db.updateTable('users')
          .set({ refresh_token: tokens.refresh_token })
          .where('id', '=', user.id as string)
          .returningAll()
          .executeTakeFirstOrThrow();
      }
    }

    if (!user) {
      throw new Error("Erro catastrófico ao gerar usuário.");
    }

    // 3.5 Buscar informações extras de perfil para o FrontEnd
    const profile = await db.selectFrom('profiles')
      .select('display_name')
      .where('user_id', '=', user.id as string)
      .executeTakeFirst();

    let avatarUrl = userInfo.picture || null;
    if (user.role === 'gm') {
      const gmProfile = await db.selectFrom('gm_profiles')
        .select('avatar_url')
        .where('user_id', '=', user.id as string)
        .executeTakeFirst();
      if (gmProfile && gmProfile.avatar_url) {
        avatarUrl = gmProfile.avatar_url;
      }
    }

    // 4. Gerar JWT de Sessão (Access Token)
    const jwtPayload: object = {
      userId: user.id as string,
      role: user.role,
      name: profile?.display_name || userInfo.name || 'Jogador',
      avatar_url: avatarUrl
    };

    const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET as string, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any
    });

    // Enviar token via postMessage para evitar vazamento por histórico/logs
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Retornar página HTML que envia token via postMessage
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Autenticação</title></head>
      <body>
        <script>
          window.opener.postMessage(
            { type: 'AUTH_SUCCESS', token: '${accessToken}', isNew: ${isNewUser} },
            '${frontendUrl}'
          );
          window.close();
        </script>
        <p>Autenticação concluída. Esta janela será fechada automaticamente.</p>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Erro na autenticação Google OAuth:', error);
    res.status(500).json({ error: 'Erro de autenticação com provedor externo.' });
  }
});

// Rota 3: Logout
router.post('/logout', async (req: Request, res: Response) => {
  // Apenas precisamos instruir o front a deletar o token.
  // Pode-se implementar logica de apagar o refresh_token do banco se necessario.
  res.json({ success: true, message: 'Logout concluído com sucesso.' });
});

export default router;
