import {
  type User,
  type UpsertUser,
  type Conversation,
  type ConversationWithUsers,
  type Message,
  type MessageWithSender,
  type InsertMessage,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void>;
  
  // Conversation operations
  getConversations(userId: string): Promise<ConversationWithUsers[]>;
  getOrCreateConversation(participant1Id: string, participant2Id: string): Promise<Conversation>;
  
  // Message operations
  getMessages(conversationId: number): Promise<MessageWithSender[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: number, userId: string): Promise<void>;
  addMessageReaction(messageId: number, userId: string, emoji: string): Promise<void>;
  removeMessageReaction(messageId: number, userId: string, emoji: string): Promise<void>;
  
  // Search operations
  searchUsers(query: string, currentUserId: string): Promise<User[]>;
}

export class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private conversations = new Map<number, Conversation>();
  private messages = new Map<number, Message>();
  private nextConversationId = 1;
  private nextMessageId = 1;

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    const user: User = {
      id: userData.id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      isOnline: userData.isOnline || false,
      lastSeen: userData.lastSeen || new Date(),
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      user.updatedAt = new Date();
      this.users.set(id, user);
    }
  }

  async getConversations(userId: string): Promise<ConversationWithUsers[]> {
    const userConversations = Array.from(this.conversations.values())
      .filter(conv => conv.participant1Id === userId || conv.participant2Id === userId)
      .sort((a, b) => {
        const aTime = a.lastMessageAt?.getTime() || 0;
        const bTime = b.lastMessageAt?.getTime() || 0;
        return bTime - aTime;
      });

    const result: ConversationWithUsers[] = [];

    for (const conversation of userConversations) {
      const participant1 = this.users.get(conversation.participant1Id);
      const participant2 = this.users.get(conversation.participant2Id);
      
      const conversationMessages = Array.from(this.messages.values())
        .filter(msg => msg.conversationId === conversation.id)
        .sort((a, b) => {
          const aTime = a.createdAt?.getTime() || 0;
          const bTime = b.createdAt?.getTime() || 0;
          return bTime - aTime;
        })
        .slice(0, 1);

      result.push({
        ...conversation,
        participant1: participant1 || {} as User,
        participant2: participant2 || {} as User,
        messages: conversationMessages,
      });
    }

    return result;
  }

  async getOrCreateConversation(participant1Id: string, participant2Id: string): Promise<Conversation> {
    // Check if conversation already exists
    const existing = Array.from(this.conversations.values()).find(conv =>
      (conv.participant1Id === participant1Id && conv.participant2Id === participant2Id) ||
      (conv.participant1Id === participant2Id && conv.participant2Id === participant1Id)
    );

    if (existing) {
      return existing;
    }

    // Create new conversation
    const newConversation: Conversation = {
      id: this.nextConversationId++,
      participant1Id,
      participant2Id,
      createdAt: new Date(),
      lastMessageAt: null,
    };

    this.conversations.set(newConversation.id, newConversation);
    return newConversation;
  }

  async getMessages(conversationId: number): Promise<MessageWithSender[]> {
    const conversationMessages = Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return conversationMessages.map(message => ({
      ...message,
      sender: this.users.get(message.senderId) || {} as User,
    }));
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const message: Message = {
      id: this.nextMessageId++,
      conversationId: messageData.conversationId || 0,
      senderId: messageData.senderId,
      content: messageData.content,
      messageType: messageData.messageType || null,
      fileUrl: messageData.fileUrl || null,
      fileName: messageData.fileName || null,
      fileSize: messageData.fileSize || null,
      isRead: false,
      reactions: {},
      createdAt: new Date(),
    };

    this.messages.set(message.id, message);

    // Update conversation's lastMessageAt
    if (messageData.conversationId) {
      const conversation = this.conversations.get(messageData.conversationId);
      if (conversation) {
        conversation.lastMessageAt = new Date();
        this.conversations.set(conversation.id, conversation);
      }
    }

    return message;
  }

  async markMessagesAsRead(conversationId: number, userId: string): Promise<void> {
    Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId && msg.senderId !== userId)
      .forEach(msg => {
        msg.isRead = true;
        this.messages.set(msg.id, msg);
      });
  }

  async addMessageReaction(messageId: number, userId: string, emoji: string): Promise<void> {
    const message = this.messages.get(messageId);
    if (!message) return;

    const reactions = message.reactions as Record<string, string[]> || {};

    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    // Remove user from this emoji if already reacted
    reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
    
    // Add user to this emoji
    reactions[emoji].push(userId);

    // Clean up empty reactions
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }

    message.reactions = reactions;
  }

  async removeMessageReaction(messageId: number, userId: string, emoji: string): Promise<void> {
    const message = this.messages.get(messageId);
    if (!message) return;

    const reactions = message.reactions as Record<string, string[]> || {};
    if (!reactions[emoji]) return;

    reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
    
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }

    message.reactions = reactions;
  }

  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    const searchTerm = query.toLowerCase();
    const allUsers = Array.from(this.users.values())
      .filter(user => user.id !== currentUserId);
    
    if (!query || query.trim() === '') {
      // Return all users if no search query
      return allUsers;
    }
    
    // Filter by search term
    return allUsers
      .filter(user => 
        user.firstName?.toLowerCase().includes(searchTerm) ||
        user.lastName?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm)
      )
      .slice(0, 50);
  }
}

export const storage = new MemoryStorage();