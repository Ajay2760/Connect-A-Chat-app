import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(
    localStorage.getItem('sessionId')
  );
  const queryClient = useQueryClient();

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        // User signed out, clear session
        localStorage.removeItem('sessionId');
        setSessionId(null);
        queryClient.clear();
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  // Login mutation to create server session
  const loginMutation = useMutation({
    mutationFn: async (user: User) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.sessionId) {
        localStorage.setItem('sessionId', data.sessionId);
        setSessionId(data.sessionId);
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
    },
  });

  // Auto-login when Firebase user changes
  useEffect(() => {
    if (firebaseUser && !sessionId) {
      loginMutation.mutate(firebaseUser);
    }
  }, [firebaseUser, sessionId]);

  // Get user data from server
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !!sessionId,
    queryFn: async () => {
      const response = await fetch('/api/auth/user', {
        headers: {
          'x-session-id': sessionId || '',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
  });

  return {
    user,
    firebaseUser,
    isLoading: isLoading || loginMutation.isPending,
    isAuthenticated: !!firebaseUser && !!sessionId && !!user,
  };
}
