import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { TypingIndicator } from "./TypingIndicator";
import { MessageReactions } from "./MessageReactions";
import { FileMessage } from "./FileUpload";
import { format } from "date-fns";
import { Check, CheckCheck } from "lucide-react";

export function MessageList() {
  const { user } = useAuth();
  const { messages, messagesLoading, typingUsers, addReaction } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'h:mm a');
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateObj.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return format(dateObj, 'MMMM d, yyyy');
    }
  };

  if (messagesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Start the conversation!</p>
        </div>
      </div>
    );
  }

  let lastDate: string | null = null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-6 space-y-4">
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === user?.id;
          const messageDate = typeof message.createdAt === 'string' ? message.createdAt : new Date().toISOString();
          const currentDate = formatDate(messageDate);
          const showDateSeparator = lastDate !== currentDate;
          if (showDateSeparator) lastDate = currentDate;
          
          return (
            <div key={message.id}>
              {showDateSeparator && (
                <div className="flex items-center justify-center my-6">
                  <div className="bg-muted/50 px-3 py-1 rounded-full">
                    <span className="text-xs text-muted-foreground font-medium">{currentDate}</span>
                  </div>
                </div>
              )}
              
              <div
                className={`flex items-start gap-2 group ${
                  isOwnMessage ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {!isOwnMessage && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={message.sender?.profileImageUrl || ""} alt={message.sender?.firstName || ""} />
                    <AvatarFallback className="text-xs">
                      {(message.sender?.firstName?.[0] || "") + (message.sender?.lastName?.[0] || "") || "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex flex-col gap-1 max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"}`}>
                  {!isOwnMessage && (
                    <span className="text-xs text-muted-foreground px-1">
                      {message.sender?.firstName} {message.sender?.lastName}
                    </span>
                  )}
                  
                  <div
                    className={`group/message rounded-2xl px-4 py-2.5 ${
                      isOwnMessage
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
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
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                    
                    <MessageReactions
                      messageId={message.id}
                      reactions={(message.reactions as Record<string, string[]>) || {}}
                      currentUserId={user?.id || ''}
                      onReaction={addReaction}
                    />
                  </div>
                  
                  <div className={`flex items-center gap-1.5 px-1 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(messageDate)}
                    </span>
                    {isOwnMessage && (
                      <div className="text-xs">
                        {message.isRead ? (
                          <CheckCheck className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {isOwnMessage && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={user?.avatar || ""} alt={user?.name || ""} />
                    <AvatarFallback className="text-xs">
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          );
        })}

        {typingUsers.size > 0 && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
