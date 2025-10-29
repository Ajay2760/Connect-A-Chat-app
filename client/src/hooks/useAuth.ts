import { useEffect, useState } from "react";
import { getCurrentUser, checkAuth, login as authLogin, signup as authSignup, logout as authLogout, type User } from "@/lib/auth";

/**
 * Authentication hook for JWT-based auth
 * Manages user state and authentication operations
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const initAuth = async () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        // Verify token is still valid
        const verifiedUser = await checkAuth();
        setUser(verifiedUser);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await authLogin(email, password);
      setUser(user);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign up new user
   */
  const signup = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await authSignup(email, password, firstName, lastName);
      setUser(user);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Signup failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout current user
   */
  const logout = async () => {
    try {
      await authLogout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Clear user anyway
      setUser(null);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    signup,
    logout,
  };
}
