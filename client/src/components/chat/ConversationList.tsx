import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";

export function ConversationList() {
  const { user } = useAuth();
  const { conversations, activeConversationId, setActiveConversationId } = useChat();

  const getOtherParticipant = (conversation: any) => {
    return conversation.participant1?.id === user?.id 
      ? conversation.participant2 
      : conversation.participant1;
  };

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="space-y-1 p-2">
      {conversations?.map((conversation) => {
        const otherUser = getOtherParticipant(conversation);
        const isActive = activeConversationId === conversation.id;
        const lastMessage = conversation.messages?.[conversation.messages.length - 1];

        return (
          <div
            key={conversation.id}
            onClick={() => setActiveConversationId(conversation.id)}
            className={cn(
              "p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent",
              isActive && "bg-primary/10 border-l-4 border-primary"
            )}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={otherUser?.profileImageUrl || ""} alt={otherUser?.firstName || ""} />
                  <AvatarFallback>
                    {otherUser?.firstName?.[0]}{otherUser?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {otherUser?.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground truncate">
                    {otherUser?.firstName} {otherUser?.lastName}
                  </h4>
                  {lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {formatTime(lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  {lastMessage ? (
                    <p className="text-sm text-muted-foreground truncate">
                      {lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Start a conversation
                    </p>
                  )}
                  
                  {/* Unread count placeholder */}
                  {false && (
                    <Badge variant="default" className="text-xs">
                      2
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {conversations?.length === 0 && (
        <div className="text-center text-muted-foreground p-8">
          <MessageCircle className="mx-auto mb-4" size={48} />
          <p>No conversations yet</p>
          <p className="text-sm">Start chatting with your friends!</p>
        </div>
      )}
    </div>
  );
}
