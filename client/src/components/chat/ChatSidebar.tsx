import { MessageCircle, Search, LogOut, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ConversationList } from "./ConversationList";
import { UserSearchDialog } from "./UserSearchDialog";
import { AvailableUsersList } from "./AvailableUsersList";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ChatSidebar() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="w-80 bg-background border-r border-border/40 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-sm">
              <MessageCircle className="text-primary-foreground" size={18} />
            </div>
            <h1 className="text-lg font-bold text-foreground">Connect</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <UserSearchDialog />
            <ThemeToggle />
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-9 h-9 bg-muted/50 border-border/50"
          />
        </div>
      </div>

      {/* User Profile */}
      <div className="px-4 py-3 border-b border-border/40 bg-muted/30">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={user?.avatar || ""} alt={user?.name || ""} />
            <AvatarFallback className="text-xs">
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-foreground truncate">
              {user?.name || 'Guest User'}
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs for Conversations and Available Users */}
      <Tabs defaultValue="conversations" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-3 border-b border-border/40">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="conversations" className="text-xs">
              <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
              Chats
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              People
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="conversations" className="flex-1 overflow-hidden m-0">
          <div className="h-full overflow-y-auto">
            <ConversationList />
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="flex-1 overflow-hidden m-0">
          <div className="h-full overflow-y-auto">
            <AvailableUsersList />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
