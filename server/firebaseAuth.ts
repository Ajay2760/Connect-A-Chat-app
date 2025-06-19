import type { Express, RequestHandler } from "express";
import session from "express-session";

interface FirebaseUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

declare global {
  namespace Express {
    interface Session {
      user?: FirebaseUser;
    }
  }
}

export async function setupAuth(app: Express) {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'firebase-chat-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  }));

  // Simple login endpoint that stores user data in session
  app.post('/api/auth/login', (req, res) => {
    const { user } = req.body;
    if (user && user.uid) {
      req.session.user = user;
      res.json({ success: true, user });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ message: 'Logout failed' });
      } else {
        res.json({ success: true });
      }
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};