import type { Express, RequestHandler } from "express";

// Simple middleware that doesn't require authentication
export async function setupAuth(app: Express) {
  // No authentication setup needed for guest system
  console.log('Guest mode - no authentication required');
}

// Middleware that always allows access
export const isAuthenticated: RequestHandler = (req, res, next) => {
  // Allow all requests in guest mode
  next();
};