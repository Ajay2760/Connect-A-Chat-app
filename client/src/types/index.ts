/**
 * Frontend type definitions for chat application
 * Using MongoDB _id format (string) instead of numeric IDs
 */

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profileImageUrl?: string;
  isOnline: boolean;
  lastSeen: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Conversation {
  _id: string;
  type: 'dm'; // Direct message conversation
  participant1Id: string;
  participant2Id: string;
  participant1?: User;
  participant2?: User;
  lastMessage: string;
  lastMessageAt: Date | string;
  unreadCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Group {
  _id: string;
  type: 'group'; // Group conversation
  name: string;
  avatarUrl?: string;
  creatorId: string;
  memberIds: string[];
  members?: User[];
  lastMessage: string;
  lastMessageAt: Date | string;
  unreadCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Union type for conversation list
export type ConversationOrGroup = Conversation | Group;

export interface Message {
  _id: string;
  conversationId?: string;
  groupId?: string;
  senderId: string;
  sender?: User;
  content?: string;
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  readBy: string[];
  reactions: Array<{
    userId: string;
    emoji: string;
  }>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

// Socket.IO event types
export interface SocketTypingEvent {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}

export interface SocketUserStatusEvent {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface SocketNewMessageEvent {
  message: Message;
}

export interface SocketGroupUpdateEvent {
  groupId: string;
  action: 'memberAdded' | 'memberRemoved' | 'groupDeleted';
  data: any;
}
