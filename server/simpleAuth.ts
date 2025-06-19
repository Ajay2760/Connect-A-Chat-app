import type { Express, RequestHandler } from "express";

// Simple in-memory session storage
const sessions = new Map<string, any>();

export async function setupAuth(app: Express) {
  // Middleware to parse session from headers
  app.use((req: any, res, next) => {
    const sessionId = req.headers['x-session-id'];
    if (sessionId && sessions.has(sessionId)) {
      req.user = sessions.get(sessionId);
    }
    next();
  });

  // Login endpoint
  app.post('/api/auth/login', (req: any, res) => {
    const { user } = req.body;
    if (user && user.uid) {
      const sessionId = `session_${Date.now()}_${Math.random()}`;
      sessions.set(sessionId, user);
      res.json({ success: true, sessionId, user });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req: any, res) => {
    const sessionId = req.headers['x-session-id'];
    if (sessionId && sessions.has(sessionId)) {
      sessions.delete(sessionId);
    }
    res.json({ success: true });
  });
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  if (req.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};