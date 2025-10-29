import { ObjectId } from 'mongodb';
import { getDB } from '../config/db';
import { updateConversationLastMessage } from './Conversation';
import { updateGroupLastMessage } from './Group';
import { getUsersByIds } from './User';

// Message interface
export interface Message {
  _id?: ObjectId;
  conversationId?: ObjectId;
  groupId?: ObjectId;
  senderId: ObjectId;
  content?: string;
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  readBy: ObjectId[];
  reactions: Array<{ userId: ObjectId; emoji: string }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create new message
 * Automatically updates conversation/group last message
 * @param data - Message data
 * @returns Created message with populated sender data
 */
export async function createMessage(data: {
  conversationId?: string;
  groupId?: string;
  senderId: string;
  content?: string;
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}): Promise<any> {
  const db = getDB();

  // Validate: must have either conversationId OR groupId (not both, not neither)
  if ((!data.conversationId && !data.groupId) || (data.conversationId && data.groupId)) {
    throw new Error('Message must belong to either a conversation or a group');
  }

  const messageDoc: Message = {
    conversationId: data.conversationId ? new ObjectId(data.conversationId) : undefined,
    groupId: data.groupId ? new ObjectId(data.groupId) : undefined,
    senderId: new ObjectId(data.senderId),
    content: data.content,
    messageType: data.messageType,
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    fileSize: data.fileSize,
    readBy: [],
    reactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection('messages').insertOne(messageDoc);

  // Update conversation or group last message
  const messagePreview = data.content || data.fileName || 'File';
  if (data.conversationId) {
    await updateConversationLastMessage(data.conversationId, messagePreview);
  } else if (data.groupId) {
    await updateGroupLastMessage(data.groupId, messagePreview);
  }

  // Populate sender data
  const sender = await getUsersByIds([data.senderId]);

  return {
    ...messageDoc,
    _id: result.insertedId,
    sender: sender[0],
  };
}

/**
 * Get messages for a conversation
 * @param conversationId - Conversation ID
 * @param limit - Number of messages to fetch
 * @param skip - Number of messages to skip (pagination)
 * @returns Array of messages with populated sender data
 */
export async function getConversationMessages(
  conversationId: string,
  limit: number = 50,
  skip: number = 0
): Promise<any[]> {
  const db = getDB();

  const messages = await db
    .collection('messages')
    .find({ conversationId: new ObjectId(conversationId) })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray() as Message[];

  // Populate sender data
  const senderIds = [...new Set(messages.map((m) => m.senderId.toString()))];
  const senders = await getUsersByIds(senderIds);

  const messagesWithSenders = messages.map((msg) => ({
    ...msg,
    sender: senders.find((s) => s._id?.toString() === msg.senderId.toString()),
  }));

  return messagesWithSenders;
}

/**
 * Get messages for a group
 * @param groupId - Group ID
 * @param limit - Number of messages to fetch
 * @param skip - Number of messages to skip (pagination)
 * @returns Array of messages with populated sender data
 */
export async function getGroupMessages(
  groupId: string,
  limit: number = 50,
  skip: number = 0
): Promise<any[]> {
  const db = getDB();

  const messages = await db
    .collection('messages')
    .find({ groupId: new ObjectId(groupId) })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray() as Message[];

  // Populate sender data
  const senderIds = [...new Set(messages.map((m) => m.senderId.toString()))];
  const senders = await getUsersByIds(senderIds);

  const messagesWithSenders = messages.map((msg) => ({
    ...msg,
    sender: senders.find((s) => s._id?.toString() === msg.senderId.toString()),
  }));

  return messagesWithSenders;
}

/**
 * Mark single message as read by user
 * @param messageId - Message ID
 * @param userId - User ID
 * @returns Updated message
 */
export async function markMessageAsRead(messageId: string, userId: string): Promise<Message | null> {
  const db = getDB();

  const result = await db.collection('messages').findOneAndUpdate(
    { _id: new ObjectId(messageId) },
    {
      $addToSet: { readBy: new ObjectId(userId) }, // Prevents duplicates
      $set: { updatedAt: new Date() },
    },
    { returnDocument: 'after' }
  );

  return result as Message | null;
}

/**
 * Mark all conversation messages as read by user
 * @param conversationId - Conversation ID
 * @param userId - User ID
 * @returns Count of modified messages
 */
export async function markConversationMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<number> {
  const db = getDB();

  const userObjectId = new ObjectId(userId);

  const result = await db.collection('messages').updateMany(
    {
      conversationId: new ObjectId(conversationId),
      senderId: { $ne: userObjectId }, // Don't mark own messages
      readBy: { $ne: userObjectId }, // Not already read
    },
    {
      $addToSet: { readBy: userObjectId },
      $set: { updatedAt: new Date() },
    }
  );

  return result.modifiedCount;
}

/**
 * Mark all group messages as read by user
 * @param groupId - Group ID
 * @param userId - User ID
 * @returns Count of modified messages
 */
export async function markGroupMessagesAsRead(groupId: string, userId: string): Promise<number> {
  const db = getDB();

  const userObjectId = new ObjectId(userId);

  const result = await db.collection('messages').updateMany(
    {
      groupId: new ObjectId(groupId),
      senderId: { $ne: userObjectId }, // Don't mark own messages
      readBy: { $ne: userObjectId }, // Not already read
    },
    {
      $addToSet: { readBy: userObjectId },
      $set: { updatedAt: new Date() },
    }
  );

  return result.modifiedCount;
}

/**
 * Add reaction to message
 * Prevents duplicate reactions from same user with same emoji
 * @param messageId - Message ID
 * @param userId - User ID
 * @param emoji - Emoji string
 * @returns Updated message
 */
export async function addReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<Message | null> {
  const db = getDB();

  const userObjectId = new ObjectId(userId);

  // Check if user already reacted with this emoji
  const message = await db.collection('messages').findOne({ _id: new ObjectId(messageId) }) as Message | null;

  if (message) {
    const existingReaction = message.reactions.find(
      (r) => r.userId.equals(userObjectId) && r.emoji === emoji
    );

    // If already exists, return message as-is
    if (existingReaction) {
      return message;
    }
  }

  // Add new reaction
  const result = await db.collection('messages').findOneAndUpdate(
    { _id: new ObjectId(messageId) },
    {
      $push: { reactions: { userId: userObjectId, emoji } },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: 'after' }
  );

  return result as Message | null;
}

/**
 * Remove reaction from message
 * @param messageId - Message ID
 * @param userId - User ID
 * @param emoji - Emoji string
 * @returns Updated message
 */
export async function removeReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<Message | null> {
  const db = getDB();

  const userObjectId = new ObjectId(userId);

  const result = await db.collection('messages').findOneAndUpdate(
    { _id: new ObjectId(messageId) },
    {
      $pull: { reactions: { userId: userObjectId, emoji } },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: 'after' }
  );

  return result as Message | null;
}
