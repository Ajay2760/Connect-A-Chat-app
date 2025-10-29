import { ObjectId } from 'mongodb';
import { getDB } from '../config/db';
import { getUsersByIds } from './User';

// Conversation interface
export interface Conversation {
  _id?: ObjectId;
  participant1Id: ObjectId;
  participant2Id: ObjectId;
  lastMessageAt: Date;
  lastMessage: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create or get existing conversation between two users
 * Ensures consistent participant ordering (smaller ID first)
 * @param participant1Id - First participant ID
 * @param participant2Id - Second participant ID
 * @returns Conversation document
 */
export async function createOrGetConversation(
  participant1Id: string,
  participant2Id: string
): Promise<Conversation> {
  const db = getDB();

  const id1 = new ObjectId(participant1Id);
  const id2 = new ObjectId(participant2Id);

  // Sort IDs to ensure consistent ordering
  const [smallerId, largerId] = id1.toString() < id2.toString() ? [id1, id2] : [id2, id1];

  // Try to find existing conversation
  let conversation = await db.collection('conversations').findOne({
    $or: [
      { participant1Id: smallerId, participant2Id: largerId },
      { participant1Id: largerId, participant2Id: smallerId },
    ],
  }) as Conversation | null;

  // If not found, create new conversation
  if (!conversation) {
    const newConversation: Conversation = {
      participant1Id: smallerId,
      participant2Id: largerId,
      lastMessageAt: new Date(),
      lastMessage: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('conversations').insertOne(newConversation);
    conversation = {
      ...newConversation,
      _id: result.insertedId,
    };
  }

  return conversation;
}

/**
 * Get conversation by ID
 * @param conversationId - Conversation ID
 * @returns Conversation document or null
 */
export async function getConversationById(conversationId: string): Promise<Conversation | null> {
  const db = getDB();
  const conversation = await db
    .collection('conversations')
    .findOne({ _id: new ObjectId(conversationId) }) as Conversation | null;
  return conversation;
}

/**
 * Get all conversations for a user
 * Includes populated participant data
 * @param userId - User ID
 * @returns Array of conversations with participant data
 */
export async function getUserConversations(userId: string): Promise<any[]> {
  const db = getDB();
  const userObjectId = new ObjectId(userId);

  // Find all conversations where user is a participant
  const conversations = await db
    .collection('conversations')
    .find({
      $or: [{ participant1Id: userObjectId }, { participant2Id: userObjectId }],
    })
    .sort({ lastMessageAt: -1 })
    .toArray() as Conversation[];

  // Populate participant data
  const conversationsWithUsers = await Promise.all(
    conversations.map(async (conv) => {
      const participantIds = [conv.participant1Id.toString(), conv.participant2Id.toString()];
      const users = await getUsersByIds(participantIds);

      return {
        ...conv,
        participant1: users.find((u) => u._id?.toString() === conv.participant1Id.toString()),
        participant2: users.find((u) => u._id?.toString() === conv.participant2Id.toString()),
      };
    })
  );

  return conversationsWithUsers;
}

/**
 * Update conversation's last message
 * @param conversationId - Conversation ID
 * @param messagePreview - Message preview text (max 100 chars)
 * @returns Updated conversation
 */
export async function updateConversationLastMessage(
  conversationId: string,
  messagePreview: string
): Promise<Conversation | null> {
  const db = getDB();

  // Truncate message preview to 100 characters
  const truncatedPreview = messagePreview.substring(0, 100);

  const result = await db.collection('conversations').findOneAndUpdate(
    { _id: new ObjectId(conversationId) },
    {
      $set: {
        lastMessage: truncatedPreview,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  return result as Conversation | null;
}

/**
 * Get unread message count for a conversation
 * @param conversationId - Conversation ID
 * @param userId - User ID
 * @returns Number of unread messages
 */
export async function getUnreadCountForConversation(
  conversationId: string,
  userId: string
): Promise<number> {
  const db = getDB();

  const count = await db.collection('messages').countDocuments({
    conversationId: new ObjectId(conversationId),
    senderId: { $ne: new ObjectId(userId) }, // Not sent by current user
    readBy: { $ne: new ObjectId(userId) }, // Not read by current user
  });

  return count;
}
