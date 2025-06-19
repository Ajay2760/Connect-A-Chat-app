import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Smile } from "lucide-react";

interface MessageReactionsProps {
  messageId: number;
  reactions: Record<string, string[]>;
  currentUserId: string;
  onReaction: (messageId: number, emoji: string) => void;
}

const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🔥"];

export function MessageReactions({ messageId, reactions, currentUserId, onReaction }: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleReaction = (emoji: string) => {
    onReaction(messageId, emoji);
    setShowEmojiPicker(false);
  };

  const reactionEntries = Object.entries(reactions || {});
  const hasReactions = reactionEntries.length > 0;

  return (
    <div className="flex items-center gap-1 mt-1 flex-wrap">
      {/* Display existing reactions */}
      {hasReactions && reactionEntries.map(([emoji, userIds]) => {
        const count = userIds.length;
        const userReacted = userIds.includes(currentUserId);
        
        return (
          <Button
            key={emoji}
            variant={userReacted ? "secondary" : "ghost"}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => handleReaction(emoji)}
          >
            <span className="mr-1">{emoji}</span>
            <span>{count}</span>
          </Button>
        );
      })}

      {/* Add reaction button */}
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="grid grid-cols-4 gap-1">
            {commonEmojis.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-accent"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}