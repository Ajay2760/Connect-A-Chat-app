import { Phone, Video, Info } from "lucide-react";
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
        <div className="text-center text-muted-foreground">
          <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Welcome to Connect</h3>
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={otherUser?.profileImageUrl || ""} alt={otherUser?.firstName || ""} />
              <AvatarFallback>
                {otherUser?.firstName?.[0]}{otherUser?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-foreground">
                {otherUser?.firstName} {otherUser?.lastName}
              </h2>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${otherUser?.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-muted-foreground">
                  {otherUser?.isOnline ? 'Online' : 'Last seen recently'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Info className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageList />

      {/* Message Input */}
      <MessageInput />
    </div>
  );
}
