import { useEffect, useState } from "react";
import { guestAuth, type GuestUser } from "@/lib/guestAuth";

export function useAuth() {
  const [user, setUser] = useState<GuestUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = guestAuth.onUserChange((guestUser) => {
      setUser(guestUser);
      setIsLoading(false);
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
