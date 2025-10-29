import { api } from './api';

/**
 * User type
 */
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profileImageUrl?: string;
  isOnline: boolean;
  lastSeen: Date;
}

/**
 * Login with email and password
 * Stores user in localStorage on success
 * @param email - User email
 * @param password - User password
 * @returns User object
 */
export async function login(email: string, password: string): Promise<User> {
  const response = await api.post('/api/auth/login', { email, password });
  const user = response.data.user;

  // Store user in localStorage
  localStorage.setItem('user', JSON.stringify(user));

  return user;
}

/**
 * Sign up new user
 * Stores user in localStorage on success
 * @param email - User email
 * @param password - User password
 * @param firstName - User first name
 * @param lastName - User last name
 * @returns User object
 */
export async function signup(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<User> {
  const response = await api.post('/api/auth/signup', {
    email,
    password,
    firstName,
    lastName,
  });
  const user = response.data.user;

  // Store user in localStorage
  localStorage.setItem('user', JSON.stringify(user));

  return user;
}

/**
 * Logout current user
 * Clears localStorage and calls logout endpoint
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/api/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear localStorage
    localStorage.removeItem('user');
  }
}

/**
 * Get current user from localStorage
 * @returns User object or null if not logged in
 */
export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 * Verifies token with backend and updates localStorage
 * @returns User object or null if not authenticated
 */
export async function checkAuth(): Promise<User | null> {
  try {
    const response = await api.get('/api/auth/me');
    const user = response.data.user;

    // Update localStorage with fresh data
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  } catch (error) {
    // Token invalid or expired
    localStorage.removeItem('user');
    return null;
  }
}
