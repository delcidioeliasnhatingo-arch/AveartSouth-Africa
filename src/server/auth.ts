import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { db } from './db.ts';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'store_manager' | 'customer';
  phone?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserSession;
  sessionToken?: string;
}

// Generate secure session token valid for 7 days
export function createSession(userId: string): string {
  const token = 'aveart_' + crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const createdAt = new Date().toISOString();

  const insertSession = db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `);
  insertSession.run(token, userId, expiresAt, createdAt);

  return token;
}

// Authenticate session token from Authorization: Bearer <token> or cookie
export function authenticateToken(token: string): UserSession | null {
  if (!token) return null;

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.phone, s.expires_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `);

  const user = stmt.get(token, now) as (UserSession & { expires_at: string }) | undefined;
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
  };
}

export function revokeSession(token: string): void {
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  stmt.run(token);
}

// Optional Auth Middleware: attaches user if token exists and is valid
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-session-token']) {
    token = String(req.headers['x-session-token']).trim();
  }

  if (token) {
    const user = authenticateToken(token);
    if (user) {
      req.user = user;
      req.sessionToken = token;
    }
  }

  next();
}

// Mandatory Auth Middleware
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be signed in to access this resource.',
      });
    }
    next();
  });
}

// Role-based Authorization Guard
export function requireRole(...allowedRoles: Array<'admin' | 'store_manager' | 'customer'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}.`,
        });
      }
      next();
    });
  };
}
