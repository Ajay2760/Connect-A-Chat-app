import {
  users,
  conversations,
  messages,
  type User,
  type UpsertUser,
  type Conversation,
  type ConversationWithUsers,
  type Message,
  type MessageWithSender,
  type InsertConversation,
  type InsertMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, or, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
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
  
  // Search operations
  searchUsers(query: string, currentUserId: string): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({
        isOnline,
        lastSeen: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async getConversations(userId: string): Promise<ConversationWithUsers[]> {
    // First get all conversations for the user
    const userConversations = await db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

    const result: ConversationWithUsers[] = [];

    for (const conversation of userConversations) {
      // Get participant details
      const [participant1] = await db
        .select()
        .from(users)
        .where(eq(users.id, conversation.participant1Id));

      const [participant2] = await db
        .select()
        .from(users)
        .where(eq(users.id, conversation.participant2Id));

      // Get latest messages for this conversation
      const latestMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversation.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      result.push({
        ...conversation,
        participant1: participant1 || {} as User,
        participant2: participant2 || {} as User,
        messages: latestMessages,
      });
    }

    return result;
  }

  async getOrCreateConversation(participant1Id: string, participant2Id: string): Promise<Conversation> {
    // Check if conversation already exists
    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(
            eq(conversations.participant1Id, participant1Id),
            eq(conversations.participant2Id, participant2Id)
          ),
          and(
            eq(conversations.participant1Id, participant2Id),
            eq(conversations.participant2Id, participant1Id)
          )
        )
      );

    if (existing) {
      return existing;
    }

    // Create new conversation
    const [newConversation] = await db
      .insert(conversations)
      .values({
        participant1Id,
        participant2Id,
      })
      .returning();

    return newConversation;
  }

  async getMessages(conversationId: number): Promise<MessageWithSender[]> {
    const result = await db
      .select()
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    return result.map(row => ({
      ...row.messages!,
      sender: row.users!,
    }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();

    // Update conversation's lastMessageAt
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));

    return newMessage;
  }

  async markMessagesAsRead(conversationId: number, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.senderId, userId)
        )
      );
  }

  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(
        and(
          or(
            eq(users.firstName, query),
            eq(users.lastName, query),
            eq(users.email, query)
          ),
          eq(users.id, currentUserId)
        )
      )
      .limit(10);

    return result;
  }
}

export const storage = new DatabaseStorage();
