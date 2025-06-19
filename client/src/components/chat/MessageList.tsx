import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { TypingIndicator } from "./TypingIndicator";
import { MessageReactions } from "./MessageReactions";
import { FileMessage } from "./FileUpload";
import { formatDistanceToNow } from "date-fns";
import { Check, CheckCheck } from "lucide-react";

export function MessageList() {
  const { user } = useAuth();
  const { messages, messagesLoading, typingUsers, addReaction } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (messagesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Date separator */}
      <div className="flex items-center justify-center">
        <div className="bg-muted px-3 py-1 rounded-full">
          <span className="text-xs text-muted-foreground">Today</span>
        </div>
      </div>

      {messages?.map((message) => {
        const isOwnMessage = message.senderId === user?.id;
        
        return (
          <div
            key={message.id}
            className={`flex items-start space-x-3 animate-in slide-in-from-bottom-1 duration-300 ${
              isOwnMessage ? "justify-end" : ""
            }`}
          >
            {!isOwnMessage && (
              <Avatar className="w-8 h-8">
                <AvatarImage src={message.sender?.profileImageUrl || ""} alt={message.sender?.firstName || ""} />
                <AvatarFallback>
                  {(message.sender?.firstName?.[0] || "") + (message.sender?.lastName?.[0] || "") || "U"}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className={`flex-1 flex flex-col ${isOwnMessage ? "items-end" : ""}`}>
              <div
                className={`group px-4 py-2 rounded-2xl max-w-xs break-words ${
                  isOwnMessage
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                }`}
              >
                {message.messageType === 'image' && message.fileUrl ? (
                  <FileMessage 
                    fileName={message.fileName || 'image'} 
                    fileUrl={message.fileUrl} 
                    fileType="image/*"
                    fileSize={message.fileSize || undefined}
                  />
                ) : message.messageType === 'file' && message.fileUrl ? (
                  <FileMessage 
                    fileName={message.fileName || 'file'} 
                    fileUrl={message.fileUrl} 
                    fileType="application/*"
                    fileSize={message.fileSize || undefined}
                  />
                ) : (
                  <p>{message.content}</p>
                )}
                
                <MessageReactions
                  messageId={message.id}
                  reactions={(message.reactions as Record<string, string[]>) || {}}
                  currentUserId={user?.id || ''}
                  onReaction={addReaction}
                />
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {formatTime(typeof message.createdAt === 'string' ? message.createdAt : new Date().toISOString())}
                </span>
                {isOwnMessage && (
                  <div className="text-xs">
                    {message.isRead ? (
                      <CheckCheck className="w-3 h-3 text-primary" />
                    ) : (
                      <Check className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {isOwnMessage && (
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                <AvatarFallback>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        );
      })}

      {typingUsers.size > 0 && <TypingIndicator />}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
