import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getDB } from '../config/db';

// User interface
export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profileImageUrl?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create new user
 * Hashes password with bcrypt before storing
 * @param data - User data
 * @returns Created user (without password)
 */
export async function createUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}): Promise<Omit<User, 'password'>> {
  const db = getDB();

  // Check if email already exists
  const existingUser = await db.collection('users').findOne({ email: data.email });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash password with bcrypt (10 salt rounds)
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Compute full name
  const fullName = `${data.firstName} ${data.lastName}`;

  // Create user document
  const userDoc: User = {
    email: data.email,
    password: hashedPassword,
    firstName: data.firstName,
    lastName: data.lastName,
    fullName,
    profileImageUrl: data.profileImageUrl,
    isOnline: false,
    lastSeen: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Insert into database
  const result = await db.collection('users').insertOne(userDoc);

  // Return user without password
  const { password, ...userWithoutPassword } = userDoc;
  return {
    ...userWithoutPassword,
    _id: result.insertedId,
  };
}

/**
 * Find user by email
 * Returns user WITH password hash (for authentication)
 * @param email - User email
 * @returns User document or null
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const db = getDB();
  const user = await db.collection('users').findOne({ email }) as User | null;
  return user;
}

/**
 * Find user by ID
 * Returns user WITHOUT password
 * @param userId - User ID
 * @returns User document or null
 */
export async function findUserById(userId: string): Promise<Omit<User, 'password'> | null> {
  const db = getDB();
  const user = await db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { password: 0 } } // Exclude password field
  ) as Omit<User, 'password'> | null;
  return user;
}

/**
 * Update user online status
 * @param userId - User ID
 * @param isOnline - Online status
 * @returns Updated user
 */
export async function updateUserOnlineStatus(
  userId: string,
  isOnline: boolean
): Promise<Omit<User, 'password'> | null> {
  const db = getDB();

  const result = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(userId) },
    {
      $set: {
        isOnline,
        lastSeen: new Date(),
        updatedAt: new Date(),
      },
    },
    {
      returnDocument: 'after',
      projection: { password: 0 }, // Exclude password
    }
  );

  return result as Omit<User, 'password'> | null;
}

/**
 * Search users by name or email
 * Excludes current user from results
 * @param query - Search query
 * @param currentUserId - Current user ID to exclude
 * @returns Array of users (without passwords)
 */
export async function searchUsers(
  query: string,
  currentUserId: string
): Promise<Omit<User, 'password'>[]> {
  const db = getDB();

  const users = await db
    .collection('users')
    .find(
      {
        $and: [
          {
            $or: [
              { fullName: { $regex: query, $options: 'i' } },
              { email: { $regex: query, $options: 'i' } },
            ],
          },
          { _id: { $ne: new ObjectId(currentUserId) } }, // Exclude current user
        ],
      },
      { projection: { password: 0 } } // Exclude password
    )
    .sort({ fullName: 1 })
    .limit(20)
    .toArray() as Omit<User, 'password'>[];

  return users;
}

/**
 * Get users by IDs
 * Used for fetching group members
 * @param userIds - Array of user IDs
 * @returns Array of users (without passwords)
 */
export async function getUsersByIds(userIds: string[]): Promise<Omit<User, 'password'>[]> {
  const db = getDB();

  const objectIds = userIds.map((id) => new ObjectId(id));

  const users = await db
    .collection('users')
    .find(
      { _id: { $in: objectIds } },
      { projection: { password: 0 } } // Exclude password
    )
    .toArray() as Omit<User, 'password'>[];

  return users;
}
