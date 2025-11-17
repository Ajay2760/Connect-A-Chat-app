import { useEffect, useState } from "react";
import { guestAuth, type GuestUser } from "@/lib/guestAuth";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const [user, setUser] = useState<GuestUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = guestAuth.onUserChange(async (guestUser) => {
      setUser(guestUser);
      setIsLoading(false);
      
      // Register guest user with backend when user is set
      if (guestUser) {
        try {
          await apiRequest("POST", "/api/guest/join", {
            user: {
              id: guestUser.id,
              name: guestUser.name,
              avatar: guestUser.avatar,
            },
          });
        } catch (error) {
          console.error("Failed to register guest user with backend:", error);
        }
      }
    });

    return unsubscribe;
  }, []);

  const setGuestUser = (name: string) => {
    const newUser = guestAuth.setUser(name);
    return newUser;
  };

  const logout = () => {
    guestAuth.clearUser();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    setGuestUser,
    logout,
  };
}
