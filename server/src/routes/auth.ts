import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db, UserRecord } from '../store/memoryDb';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'nexus-os-secure-system-secret-2026';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Middleware to authenticate user from token or cookie
export const authenticateUser = (req: Request, res: Response, next: () => void): any => {
  let token = req.cookies?.nexus_token;
  const authHeader = req.headers.authorization;
  if (!token && authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = authHeader;
    }
  }

  if (!token && req.query?.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = db.users.find((u) => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Session expired or user not found' });
    }
    (req as any).user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
};

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const { email, password, displayName } = parsed.data;
    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: UserRecord = {
      id: `usr_${Date.now()}`,
      email,
      passwordHash,
      displayName,
      avatar: 'user',
      role: 'user',
      createdAt: Date.now(),
    };

    db.users.push(newUser);
    db.saveUsers();

    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isHttps,
      sameSite: (isHttps ? 'none' : 'lax') as 'none' | 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('nexus_token', token, cookieOptions);

    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({ user: safeUser, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const { email, password } = parsed.data;
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isHttps,
      sameSite: (isHttps ? 'none' : 'lax') as 'none' | 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('nexus_token', token, cookieOptions);

    const { passwordHash: _, ...safeUser } = user;
    return res.json({ user: safeUser, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/auth/me - Authenticated user profile and session token
authRouter.get('/me', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
  res.cookie('nexus_token', token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: (isHttps ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const { passwordHash: _, ...safeUser } = user;
  return res.json({ user: safeUser, token });
});

// POST /api/auth/guest - Issue guest session token
authRouter.post('/guest', (req: Request, res: Response) => {
  let guestUser = db.users.find((u) => u.id === 'usr_guest');
  if (!guestUser) {
    guestUser = {
      id: 'usr_guest',
      email: 'guest@nexusos.internal',
      passwordHash: '',
      displayName: 'Guest Operator',
      avatar: 'user',
      role: 'guest',
      createdAt: Date.now(),
    };
    db.users.push(guestUser);
    db.saveUsers();
  }

  const token = jwt.sign({ userId: guestUser.id }, JWT_SECRET, { expiresIn: '7d' });
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
  res.cookie('nexus_token', token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: (isHttps ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const { passwordHash: _, ...safeUser } = guestUser;
  return res.json({ user: safeUser, token });
});

// POST /api/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
  res.clearCookie('nexus_token', {
    httpOnly: true,
    secure: isHttps,
    sameSite: (isHttps ? 'none' : 'lax') as 'none' | 'lax',
  });
  return res.json({ success: true, message: 'Logged out successfully' });
});

