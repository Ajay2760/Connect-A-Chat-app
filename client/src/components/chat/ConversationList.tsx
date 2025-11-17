import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const formatTime = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  };

  return (
    <div className="space-y-0.5 p-2">
      {conversations && conversations.length > 0 ? (
        conversations.map((conversation) => {
          const otherUser = getOtherParticipant(conversation);
          const isActive = activeConversationId === conversation.id;
          const lastMessage = conversation.messages?.[conversation.messages.length - 1];

          return (
            <div
              key={conversation.id}
              onClick={() => setActiveConversationId(conversation.id)}
              className={cn(
                "p-3 rounded-lg cursor-pointer transition-all",
                isActive 
                  ? "bg-primary/10 border-l-2 border-primary" 
                  : "hover:bg-accent/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={otherUser?.profileImageUrl || ""} alt={otherUser?.firstName || ""} />
                    <AvatarFallback className="text-xs">
                      {otherUser?.firstName?.[0]}{otherUser?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  {otherUser?.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm text-foreground truncate">
                      {otherUser?.firstName} {otherUser?.lastName}
                    </h4>
                    {lastMessage && (
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {formatTime(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {lastMessage ? (
                      <p className="text-xs text-muted-foreground truncate">
                        {lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Start a conversation
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm font-medium text-foreground mb-1">No conversations yet</p>
          <p className="text-xs text-muted-foreground">Start chatting with your friends!</p>
        </div>
      )}
    </div>
  );
}
