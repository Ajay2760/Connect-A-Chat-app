import { Phone, Video, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";

export function ChatArea() {
  const { user } = useAuth();
  const { conversations, activeConversationId } = useChat();

  const activeConversation = conversations?.find(c => c.id === activeConversationId);
  const otherUser = activeConversation ? (
    activeConversation.participant1?.id === user?.id 
      ? activeConversation.participant2 
      : activeConversation.participant1
  ) : null;

  if (!activeConversationId || !activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Welcome to Connect</h3>
          <p className="text-sm text-muted-foreground">Select a conversation from the sidebar or start a new one to begin chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="h-16 px-6 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={otherUser?.profileImageUrl || ""} alt={otherUser?.firstName || ""} />
              <AvatarFallback>
                {otherUser?.firstName?.[0]}{otherUser?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            {otherUser?.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></div>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm">
              {otherUser?.firstName} {otherUser?.lastName}
            </h2>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${otherUser?.isOnline ? 'bg-green-500' : 'bg-muted-foreground/40'}`}></div>
              <span className="text-xs text-muted-foreground">
                {otherUser?.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <MessageList />

      {/* Message Input */}
      <MessageInput />
    </div>
  );
}
