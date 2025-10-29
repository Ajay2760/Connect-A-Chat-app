import { MongoClient, Db } from 'mongodb';

// MongoDB connection string from environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat_app';

// MongoDB client instance
let client: MongoClient;
let db: Db;

/**
 * Connect to MongoDB database
 * Creates indexes on first connection for optimal query performance
 */
export async function connectDB(): Promise<void> {
  try {
    console.log('Connecting to MongoDB...');

    // Create MongoDB client
    client = new MongoClient(MONGODB_URI);

    // Connect to MongoDB
    await client.connect();

    // Get database instance
    db = client.db();

    console.log('✅ MongoDB connected successfully');

    // Create indexes for optimal performance
    await createIndexes();

    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1); // Exit if database connection fails
  }
}

/**
 * Create database indexes for optimal query performance
 */
async function createIndexes(): Promise<void> {
  try {
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ isOnline: 1 });

    // Conversations collection indexes
    await db.collection('conversations').createIndex(
      { participant1Id: 1, participant2Id: 1 },
      { unique: true }
    );
    await db.collection('conversations').createIndex({ lastMessageAt: -1 });

    // Groups collection indexes
    await db.collection('groups').createIndex({ memberIds: 1 });
    await db.collection('groups').createIndex({ lastMessageAt: -1 });

    // Messages collection indexes
    await db.collection('messages').createIndex({ conversationId: 1, createdAt: -1 });
    await db.collection('messages').createIndex({ groupId: 1, createdAt: -1 });
    await db.collection('messages').createIndex({ senderId: 1 });

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
    // Don't exit on index creation error, just log it
  }
}

/**
 * Get database instance
 * @returns MongoDB database instance
 */
export function getDB(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return db;
}

/**
 * Close database connection
 */
export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
}
