import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * JWT Authentication Middleware
 * Verifies access token from httpOnly cookie
 * Attaches user data to request object if valid
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get access token from cookie
    const accessToken = req.cookies?.accessToken;

    // Check if token exists
    if (!accessToken) {
      res.status(401).json({ error: 'Access token missing' });
      return;
    }

    // Verify token
    const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key-here';

    const decoded = jwt.verify(accessToken, JWT_ACCESS_SECRET) as {
      userId: string;
      email: string;
      type: string;
    };

    // Check token type
    if (decoded.type !== 'access') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    // Attach user data to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    // Continue to next middleware
    next();
  } catch (error) {
    // Token verification failed
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
