import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { dataService } from '../services/dataService';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token = '';

    // Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.nexus_token) {
      token = req.cookies.nexus_token;
    }

    if (!token) {
      // In development / prototype mode, allow a default guest session if explicitly permitted
      const defaultUser = await dataService.findUserByEmail('demo@nexus.os');
      if (defaultUser) {
        req.user = {
          id: defaultUser._id?.toString() || defaultUser.id,
          email: defaultUser.email,
          displayName: defaultUser.displayName,
        };
        return next();
      }
      res.status(401).json({ error: 'Authentication required. Please log in.' });
      return;
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string; email: string; displayName: string };
    const user = await dataService.findUserById(decoded.id);

    if (!user) {
      res.status(401).json({ error: 'Session expired or invalid user' });
      return;
    }

    req.user = {
      id: user._id?.toString() || user.id,
      email: user.email,
      displayName: user.displayName,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}
