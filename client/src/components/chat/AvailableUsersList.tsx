import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { Users, UserPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@shared/schema";

export function AvailableUsersList() {
  const { user: currentUser } = useAuth();
  const { startConversation, conversations, setActiveConversationId } = useChat();
  const { subscribe } = useSocket();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all users (or search if query exists)
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users", searchQuery, currentUser?.id],
    enabled: !!currentUser,
    queryFn: async () => {
      const url = new URL("/api/users", window.location.origin);
      if (searchQuery) {
        url.searchParams.set("q", searchQuery);
      }
      url.searchParams.set("userId", currentUser!.id);
      const response = await fetch(url.toString(), {
        credentials: "include",
        headers: {
          "x-user-id": currentUser!.id,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  // Listen for real-time user list updates from WebSocket
  useEffect(() => {
    const unsubscribe = subscribe("userList", (data: { users: User[] }) => {
      if (data.users && Array.isArray(data.users)) {
        // Filter out current user and apply search if needed
        let filteredUsers = data.users.filter(u => u.id !== currentUser?.id);
        
        if (searchQuery) {
          const searchTerm = searchQuery.toLowerCase();
          filteredUsers = filteredUsers.filter(user =>
            user.firstName?.toLowerCase().includes(searchTerm) ||
            user.lastName?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm)
          );
        }
        
        // Update the query cache with the new user list
        queryClient.setQueryData(
          ["/api/users", searchQuery, currentUser?.id],
          filteredUsers
        );
      }
    });

    return unsubscribe;
  }, [subscribe, queryClient, currentUser?.id, searchQuery]);

  // Also listen for individual user status changes
  useEffect(() => {
    const unsubscribe = subscribe("userStatus", (data: { userId: string; isOnline: boolean }) => {
      // Invalidate query to refetch with updated online status
      queryClient.invalidateQueries({ queryKey: ["/api/users", searchQuery, currentUser?.id] });
    });

    return unsubscribe;
  }, [subscribe, queryClient, currentUser?.id, searchQuery]);

  const handleStartConversation = async (user: User) => {
    // Check if conversation already exists
    const existingConversation = conversations?.find(
      (conv) =>
        (conv.participant1?.id === user.id && conv.participant2?.id === currentUser?.id) ||
        (conv.participant2?.id === user.id && conv.participant1?.id === currentUser?.id)
    );

    if (existingConversation) {
      // Switch to existing conversation
      setActiveConversationId(existingConversation.id);
      return;
    }

    await startConversation(user.id);
  };

  const hasConversation = (userId: string) => {
    return conversations?.some(
      (conv) =>
        (conv.participant1?.id === userId && conv.participant2?.id === currentUser?.id) ||
        (conv.participant2?.id === userId && conv.participant1?.id === currentUser?.id)
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-sm font-medium text-foreground mb-1">No users found</p>
        <p className="text-xs text-muted-foreground">Try searching for friends to connect with</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-3 border-b border-border/40">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-border/50"
          />
        </div>
      </div>
      
      {/* Users List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {users.map((user) => {
        const hasExistingConv = hasConversation(user.id);
        
        return (
          <div
            key={user.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
          >
            <div className="relative">
              <Avatar className="w-11 h-11">
                <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || ""} />
                <AvatarFallback className="text-xs">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              {user.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-foreground truncate">
                  {user.firstName} {user.lastName}
                </h4>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-muted-foreground/40'}`}></div>
                <span className="text-xs text-muted-foreground">
                  {user.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            
            {!hasExistingConv && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleStartConversation(user)}
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Start conversation"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}

