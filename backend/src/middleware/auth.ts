import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../db/types';

export interface AuthDecoded {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Extender o objeto Request do Express para incluir o user tipado
declare global {
  namespace Express {
    interface Request {
      user?: AuthDecoded;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // CORREÇÃO A01: Validar JWT_SECRET existe antes de usar
  if (!process.env.JWT_SECRET) {
    console.error('[authMiddleware] JWT_SECRET não configurado');
    return res.status(500).json({ error: 'Configuração de autenticação inválida.' });
  }

  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieToken = req.cookies?.am_session ?? null;

  // Prioridade: Bearer token (APIs) → Cookie (web app)
  const token = bearerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as AuthDecoded;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

export const requireRole = (roles: UserRole | UserRole[]) => {
  const rolesArr = Array.isArray(roles) ? roles : [roles];
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    if (!rolesArr.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado para o seu perfil.' });
    }

    next();
  };
};

// Middleware específico para rotas admin
export const requireAdmin = [
  authMiddleware,
  requireRole('admin')
];
