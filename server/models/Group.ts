import { ObjectId } from 'mongodb';
import { getDB } from '../config/db';
import { getUsersByIds } from './User';

// Group interface
export interface Group {
  _id?: ObjectId;
  name: string;
  avatarUrl?: string;
  creatorId: ObjectId;
  memberIds: ObjectId[];
  lastMessageAt: Date;
  lastMessage: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create new group
 * @param data - Group data
 * @returns Created group document
 */
export async function createGroup(data: {
  name: string;
  creatorId: string;
  memberIds: string[];
  avatarUrl?: string;
}): Promise<Group> {
  const db = getDB();

  const creatorObjectId = new ObjectId(data.creatorId);
  const memberObjectIds = data.memberIds.map((id) => new ObjectId(id));

  // Ensure creator is included in members
  if (!memberObjectIds.some((id) => id.equals(creatorObjectId))) {
    memberObjectIds.push(creatorObjectId);
  }

  const groupDoc: Group = {
    name: data.name,
    avatarUrl: data.avatarUrl,
    creatorId: creatorObjectId,
    memberIds: memberObjectIds,
    lastMessageAt: new Date(),
    lastMessage: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection('groups').insertOne(groupDoc);

  return {
    ...groupDoc,
    _id: result.insertedId,
  };
}

/**
 * Get group by ID
 * @param groupId - Group ID
 * @returns Group document or null
 */
export async function getGroupById(groupId: string): Promise<Group | null> {
  const db = getDB();
  const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) }) as Group | null;
  return group;
}

/**
 * Get all groups for a user
 * Includes populated member data
 * @param userId - User ID
 * @returns Array of groups with member data
 */
export async function getUserGroups(userId: string): Promise<any[]> {
  const db = getDB();
  const userObjectId = new ObjectId(userId);

  // Find all groups where user is a member
  const groups = await db
    .collection('groups')
    .find({ memberIds: userObjectId })
    .sort({ lastMessageAt: -1 })
    .toArray() as Group[];

  // Populate member data
  const groupsWithMembers = await Promise.all(
    groups.map(async (group) => {
      const memberIds = group.memberIds.map((id) => id.toString());
      const members = await getUsersByIds(memberIds);

      return {
        ...group,
        members,
      };
    })
  );

  return groupsWithMembers;
}

/**
 * Add members to group
 * @param groupId - Group ID
 * @param newMemberIds - Array of new member IDs
 * @returns Updated group
 */
export async function addMembersToGroup(
  groupId: string,
  newMemberIds: string[]
): Promise<Group | null> {
  const db = getDB();

  const memberObjectIds = newMemberIds.map((id) => new ObjectId(id));

  const result = await db.collection('groups').findOneAndUpdate(
    { _id: new ObjectId(groupId) },
    {
      $addToSet: { memberIds: { $each: memberObjectIds } }, // Prevents duplicates
      $set: { updatedAt: new Date() },
    },
    { returnDocument: 'after' }
  );

  return result as Group | null;
}

/**
 * Remove member from group
 * Cannot remove the creator
 * @param groupId - Group ID
 * @param memberIdToRemove - Member ID to remove
 * @returns Updated group
 */
export async function removeMemberFromGroup(
  groupId: string,
  memberIdToRemove: string
): Promise<Group | null> {
  const db = getDB();

  const memberObjectId = new ObjectId(memberIdToRemove);

  // Check if member is the creator
  const group = await getGroupById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  if (group.creatorId.equals(memberObjectId)) {
    throw new Error('Creator cannot be removed');
  }

  const result = await db.collection('groups').findOneAndUpdate(
    { _id: new ObjectId(groupId) },
    {
      $pull: { memberIds: memberObjectId },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: 'after' }
  );

  return result as Group | null;
}

/**
 * Update group's last message
 * @param groupId - Group ID
 * @param messagePreview - Message preview text (max 100 chars)
 * @returns Updated group
 */
export async function updateGroupLastMessage(
  groupId: string,
  messagePreview: string
): Promise<Group | null> {
  const db = getDB();

  // Truncate message preview to 100 characters
  const truncatedPreview = messagePreview.substring(0, 100);

  const result = await db.collection('groups').findOneAndUpdate(
    { _id: new ObjectId(groupId) },
    {
      $set: {
        lastMessage: truncatedPreview,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  return result as Group | null;
}

/**
 * Delete group
 * Only creator can delete
 * Also deletes all group messages
 * @param groupId - Group ID
 * @param requestingUserId - User requesting deletion
 * @returns Success flag
 */
export async function deleteGroup(groupId: string, requestingUserId: string): Promise<boolean> {
  const db = getDB();

  const group = await getGroupById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  // Check if requesting user is the creator
  if (!group.creatorId.equals(new ObjectId(requestingUserId))) {
    throw new Error('Only group creator can delete the group');
  }

  // Delete group
  await db.collection('groups').deleteOne({ _id: new ObjectId(groupId) });

  // Delete all group messages
  await db.collection('messages').deleteMany({ groupId: new ObjectId(groupId) });

  return true;
}

/**
 * Get unread message count for a group
 * @param groupId - Group ID
 * @param userId - User ID
 * @returns Number of unread messages
 */
export async function getUnreadCountForGroup(groupId: string, userId: string): Promise<number> {
  const db = getDB();

  const count = await db.collection('messages').countDocuments({
    groupId: new ObjectId(groupId),
    senderId: { $ne: new ObjectId(userId) }, // Not sent by current user
    readBy: { $ne: new ObjectId(userId) }, // Not read by current user
  });

  return count;
}
