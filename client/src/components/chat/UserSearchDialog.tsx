import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

export function UserSearchDialog() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { startConversation } = useChat();
  const { user: currentUser } = useAuth();

  const { data: searchResults, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/search", searchQuery, currentUser?.id],
    enabled: !!searchQuery && searchQuery.length > 2 && !!currentUser,
    queryFn: async () => {
      const url = new URL("/api/users/search", window.location.origin);
      url.searchParams.set("q", searchQuery);
      url.searchParams.set("userId", currentUser!.id);
      const response = await fetch(url.toString(), {
        credentials: "include",
        headers: {
          "x-user-id": currentUser!.id,
        },
      });
      if (!response.ok) throw new Error("Failed to search users");
      return response.json();
    },
  });

  const handleStartConversation = async (user: User) => {
    await startConversation(user.id);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {isLoading && (
            <div className="text-center py-4 text-muted-foreground">
              Searching...
            </div>
          )}
          
          {searchResults && searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleStartConversation(user)}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || ""} />
                    <AvatarFallback>
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">
                      {user.firstName} {user.lastName}
                    </h4>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  {user.isOnline && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {searchQuery.length > 2 && searchResults && searchResults.length === 0 && !isLoading && (
            <div className="text-center py-4 text-muted-foreground">
              No users found
            </div>
          )}
          
          {searchQuery.length <= 2 && (
            <div className="text-center py-4 text-muted-foreground">
              Type at least 3 characters to search
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}