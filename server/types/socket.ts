/**
 * Socket.IO TypeScript Event Definitions
 * Defines all client-to-server and server-to-client events
 */

/**
 * Events sent from server to client
 */
export interface ServerToClientEvents {
  // New message received
  newMessage: (data: { message: any }) => void;

  // Message reaction added or removed
  messageReaction: (data: {
    messageId: string;
    conversationId: string;
    reaction: {
      userId: string;
      emoji: string;
      action: 'add' | 'remove';
    };
  }) => void;

  // User online/offline status changed
  userStatus: (data: { userId: string; isOnline: boolean; lastSeen: Date }) => void;

  // User is typing
  typing: (data: { userId: string; conversationId: string; isTyping: boolean }) => void;

  // Message marked as read
  messageRead: (data: { messageId: string; conversationId: string; userId: string }) => void;

  // Group updated (member added/removed/group deleted)
  groupUpdate: (data: { groupId: string; action: string; data: any }) => void;
}

/**
 * Events sent from client to server
 */
export interface ClientToServerEvents {
  // Authenticate socket connection with user ID
  auth: (data: { userId: string }) => void;

  // User is typing in conversation/group
  typing: (data: { conversationId: string; isTyping: boolean }) => void;

  // User stopped typing
  stopTyping: (data: { conversationId: string }) => void;

  // User read a message
  messageRead: (data: { messageId: string; conversationId: string }) => void;
}
