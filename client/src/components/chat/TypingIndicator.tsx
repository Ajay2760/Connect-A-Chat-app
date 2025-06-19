import { useEffect, useState } from "react";
import { useChat } from "@/hooks/useChat";

export function TypingIndicator() {
  const { typingUsers, activeConversationId } = useChat();
  const [dots, setDots] = useState(".");

  // Animate the dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return ".";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (!activeConversationId) return null;

  const conversationTypingUsers = typingUsers.get(activeConversationId);
  if (!conversationTypingUsers || conversationTypingUsers.size === 0) return null;

  const typingUsersList = Array.from(conversationTypingUsers);
  
  let typingText = "";
  if (typingUsersList.length === 1) {
    typingText = "Someone is typing";
  } else if (typingUsersList.length === 2) {
    typingText = "2 people are typing";
  } else {
    typingText = "Several people are typing";
  }

  return (
    <div className="px-4 py-2 text-sm text-muted-foreground italic">
      {typingText}{dots}
    </div>
  );
}