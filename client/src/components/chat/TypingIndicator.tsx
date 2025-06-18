import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function TypingIndicator() {
  return (
    <div className="flex items-start space-x-3 animate-pulse">
      <Avatar className="w-8 h-8">
        <AvatarImage src="" alt="" />
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]"></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></div>
        </div>
      </div>
    </div>
  );
}
