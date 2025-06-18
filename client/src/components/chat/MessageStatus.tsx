import { Check, CheckCheck, Clock } from "lucide-react";

interface MessageStatusProps {
  isRead: boolean;
  isDelivered: boolean;
  timestamp: string;
}

export function MessageStatus({ isRead, isDelivered, timestamp }: MessageStatusProps) {
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex items-center space-x-2 mt-1">
      <span className="text-xs text-muted-foreground">
        {formatTime(timestamp)}
      </span>
      <div className="text-xs">
        {isRead ? (
          <CheckCheck className="w-3 h-3 text-primary" />
        ) : isDelivered ? (
          <Check className="w-3 h-3 text-muted-foreground" />
        ) : (
          <Clock className="w-3 h-3 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}