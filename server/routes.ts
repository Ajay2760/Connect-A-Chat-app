import type { Express } from 'express';
import type { Server as SocketIOServer } from 'socket.io';
import bcrypt from 'bcryptjs';
import { authenticateToken } from './middleware/auth';
import { upload, handleMulterError } from './middleware/upload';
import { uploadToCloudinary } from './config/cloudinary';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from './utils/jwt';
import { validateEmail, validatePassword, validateName, validateGroupName } from './utils/validators';
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserOnlineStatus,
  searchUsers,
  getUsersByIds,
} from './models/User';
import {
  createOrGetConversation,
  getConversationById,
  getUserConversations,
  getUnreadCountForConversation,
} from './models/Conversation';
import {
  createGroup,
  getGroupById,
  getUserGroups,
  addMembersToGroup,
  removeMemberFromGroup,
  deleteGroup,
  getUnreadCountForGroup,
} from './models/Group';
import {
  createMessage,
  getConversationMessages,
  getGroupMessages,
  markConversationMessagesAsRead,
  markGroupMessagesAsRead,
  addReaction,
  removeReaction,
} from './models/Message';
import type { ClientToServerEvents, ServerToClientEvents } from './types/socket';

// Map to track userId -> socket.id mappings for real-time communication
const userSockets = new Map<string, string>();

/**
 * Generate default profile image SVG (colored circle with initials)
 */
function generateDefaultAvatar(firstName: string, lastName: string): string {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="${color}"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`
  )}`;
}

/**
 * Register all API routes and Socket.IO handlers
 */
export async function registerRoutes(app: Express, io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>): Promise<void> {
  // ============================================================================
  // AUTHENTICATION ENDPOINTS (PUBLIC - no auth required)
  // ============================================================================

  /**
   * POST /api/auth/signup
   * User registration with email and password
   */
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validate inputs
      if (!email || !validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
      }

      if (!firstName || !validateName(firstName)) {
        return res.status(400).json({ error: 'First name is required' });
      }

      if (!lastName || !validateName(lastName)) {
        return res.status(400).json({ error: 'Last name is required' });
      }

      // Generate default avatar
      const profileImageUrl = generateDefaultAvatar(firstName, lastName);

      // Create user (password is hashed in model)
      const user = await createUser({
        email,
        password,
        firstName,
        lastName,
        profileImageUrl,
      });

      // Generate JWT tokens
      const accessToken = generateAccessToken(user._id!.toString(), user.email);
      const refreshToken = generateRefreshToken(user._id!.toString());

      // Set httpOnly cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.message === 'Email already registered') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Server error' });
    }
  });

  /**
   * POST /api/auth/login
   * User login with email and password
   */
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate inputs
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Find user by email (includes password hash)
      const user = await findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Compare password with hash
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT tokens
      const accessToken = generateAccessToken(user._id!.toString(), user.email);
      const refreshToken = generateRefreshToken(user._id!.toString());

      // Set httpOnly cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  /**
   * POST /api/auth/logout
   * Clear authentication cookies
   */
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token missing' });
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Get user
      const user = await findUserById(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Generate new access token
      const newAccessToken = generateAccessToken(user._id!.toString(), user.email);

      // Set new access token cookie
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.json({ success: true, message: 'Token refreshed' });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  });

  /**
   * GET /api/auth/me
   * Get current user info (requires authentication)
   */
  app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.userId;
      const user = await findUserById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ============================================================================
  // USER ENDPOINTS (PROTECTED)
  // ============================================================================

  /**
   * GET /api/users/search?q={query}
   * Search users by name or email
   */
  app.get('/api/users/search', authenticateToken, async (req, res) => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const userId = req.user!.userId;
      const users = await searchUsers(q, userId);

      res.json({ users });
    } catch (error) {
      console.error('User search error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ============================================================================
  // CONVERSATION ENDPOINTS (PROTECTED)
  // ============================================================================

  /**
   * GET /api/conversations
   * Get all user's conversations and groups
   */
  app.get('/api/conversations', authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.userId;

      // Fetch conversations and groups in parallel
      const [conversations, groups] = await Promise.all([
        getUserConversations(userId),
        getUserGroups(userId),
      ]);

      // Calculate unread counts in parallel
      const conversationsWithUnread = await Promise.all(
        conversations.map(async (conv) => {
          const unreadCount = await getUnreadCountForConversation(conv._id.toString(), userId);
          return {
            ...conv,
            type: 'dm',
            unreadCount,
          };
        })
      );

      const groupsWithUnread = await Promise.all(
        groups.map(async (group) => {
          const unreadCount = await getUnreadCountForGroup(group._id.toString(), userId);
          return {
            ...group,
            type: 'group',
            unreadCount,
          };
        })
      );

      // Combine and sort by lastMessageAt
      const allConversations = [...conversationsWithUnread, ...groupsWithUnread].sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );

      res.json({ conversations: allConversations });
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  /**
   * POST /api/conversations
   * Create or get existing DM conversation
   */
  app.post('/api/conversations', authenticateToken, async (req, res) => {
    try {
      const { participantId } = req.body;
      const userId = req.user!.userId;

      if (!participantId) {
        return res.status(400).json({ error: 'Participant ID is required' });
      }

      if (participantId === userId) {
        return res.status(400).json({ error: 'Cannot create conversation with yourself' });
      }

      // Check if participant exists
      const participant = await findUserById(participantId);
      if (!participant) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create or get conversation
      const conversation = await createOrGetConversation(userId, participantId);

      // Fetch both users' data
      const users = await getUsersByIds([userId, participantId]);

      res.status(200).json({
        conversation: {
          ...conversation,
          participant1: users.find((u) => u._id?.toString() === conversation.participant1Id.toString()),
          participant2: users.find((u) => u._id?.toString() === conversation.participant2Id.toString()),
        },
      });
    } catch (error) {
      console.error('Create conversation error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  /**
   * GET /api/conversations/:id/messages?limit=50&skip=0
   * Get messages for a conversation (DM or group)
   */
  app.get('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const skip = parseInt(req.query.skip as string) || 0;

      // Try to find as conversation first
      let messages: any[];
      let isAuthorized = false;

      const conversation = await getConversationById(id);
      if (conversation) {
        // Verify user is a participant
        if (
          conversation.participant1Id.toString() === userId ||
          conversation.participant2Id.toString() === userId
        ) {
          isAuthorized = true;
          messages = await getConversationMessages(id, limit, skip);
        }
      } else {
        // Try as group
        const group = await getGroupById(id);
        if (group) {
          // Verify user is a member
          if (group.memberIds.some((memberId) => memberId.toString() === userId)) {
            isAuthorized = true;
            messages = await getGroupMessages(id, limit, skip);
          }
        }
      }

      if (!isAuthorized) {
        return res.status(403).json({ error: 'Not authorized to view this conversation' });
      }

      if (!conversation && !await getGroupById(id)) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      res.json({
        messages: messages!.reverse(), // Reverse to show oldest first
        hasMore: messages!.length === limit,
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  /**
   * POST /api/conversations/:id/messages
   * Send message to conversation or group
   */
  app.post('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const { content, messageType = 'text' } = req.body;

      // Validate content for text messages
      if (messageType === 'text' && !content) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      // Determine if conversation or group
      let isConversation = false;
      let isGroup = false;
      let recipientIds: string[] = [];

      const conversation = await getConversationById(id);
      if (conversation) {
        // Verify user is a participant
        if (
          conversation.participant1Id.toString() !== userId &&
          conversation.participant2Id.toString() !== userId
        ) {
          return res.status(403).json({ error: 'Not authorized' });
        }
        isConversation = true;
        // Get the other participant
        recipientIds = [
          conversation.participant1Id.toString() === userId
            ? conversation.participant2Id.toString()
            : conversation.participant1Id.toString(),
        ];
      } else {
        const group = await getGroupById(id);
        if (group) {
          // Verify user is a member
          if (!group.memberIds.some((memberId) => memberId.toString() === userId)) {
            return res.status(403).json({ error: 'Not authorized' });
          }
          isGroup = true;
          // Get all group members except sender
          recipientIds = group.memberIds
            .filter((memberId) => memberId.toString() !== userId)
            .map((memberId) => memberId.toString());
        }
      }

      if (!isConversation && !isGroup) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Create message
      const message = await createMessage({
        conversationId: isConversation ? id : undefined,
        groupId: isGroup ? id : undefined,
        senderId: userId,
        content,
        messageType,
      });

      // Broadcast message to recipients via Socket.IO
      recipientIds.forEach((recipientId) => {
        const socketId = userSockets.get(recipientId);
        if (socketId) {
          io.to(socketId).emit('newMessage', { message });
        }
      });

      res.status(201).json({ message });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  /**
   * PATCH /api/conversations/:id/read
   * Mark all messages in conversation/group as read
   */
  app.patch('/api/conversations/:id/read', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      // Determine if conversation or group
      const conversation = await getConversationById(id);
      let markedCount = 0;

      if (conversation) {
        // Verify user is a participant
        if (
          conversation.participant1Id.toString() !== userId &&
          conversation.participant2Id.toString() !== userId
        ) {
          return res.status(403).json({ error: 'Not authorized' });
        }
        markedCount = await markConversationMessagesAsRead(id, userId);
      } else {
        const group = await getGroupById(id);
        if (group) {
          // Verify user is a member
          if (!group.memberIds.some((memberId) => memberId.toString() === userId)) {
            return res.status(403).json({ error: 'Not authorized' });
          }
          markedCount = await markGroupMessagesAsRead(id, userId);
        } else {
          return res.status(404).json({ error: 'Conversation not found' });
        }
      }

      res.json({ success: true, markedCount });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ============================================================================
  // GROUP ENDPOINTS (PROTECTED)
  // ============================================================================

  /**
   * POST /api/groups
   * Create new group
   */
  app.post('/api/groups', authenticateToken, async (req, res) => {
    try {
      const { name, memberIds = [], avatarUrl } = req.body;
      const creatorId = req.user!.userId;

      // Validate group name
      if (!name || !validateGroupName(name)) {
        return res.status(400).json({ error: 'Group name must be 1-100 characters' });
      }

      // Verify all member IDs exist
      if (memberIds.length > 0) {
        const members = await getUsersByIds(memberIds);
        if (members.length !== memberIds.length) {
          return res.status(400).json({ error: 'One or more user IDs are invalid' });
        }
      }

      // Create group
      const group = await createGroup({
        name,
        creatorId,
        memberIds,
        avatarUrl,
      });

      // Fetch populated member data
      const members = await getUsersByIds(group.memberIds.map((id) => id.toString()));

      res.status(201).json({
        group: {
          ...group,
          members,
        },
      });
    } catch (error) {
      console.error('Create group error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  /**
   * POST /api/groups/:id/members
   * Add members to group
   */
  app.post('/api/groups/:id/members', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { memberIds } = req.body;
      const userId = req.user!.userId;

      const group = await getGroupById(id);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Verify user is a member
      if (!group.memberIds.some((memberId) => memberId.toString() === userId)) {
        return res.status(403).json({ error: 'Only group members can add others' });
      }

      // Verify all new member IDs exist
      if (memberIds && memberIds.length > 0) {
        const members = await getUsersByIds(memberIds);
        if (members.length !== memberIds.length) {
          return res.status(400).json({ error: 'One or more user IDs are invalid' });
        }
      }

      // Add members
      const updatedGroup = await addMembersToGroup(id, memberIds);

      // Notify new members via Socket.IO
      memberIds.forEach((memberId: string) => {
        const socketId = userSockets.get(memberId);
        if (socketId) {
          io.to(socketId).emit('groupUpdate', {
            groupId: id,
            action: 'memberAdded',
            data: { group: updatedGroup },
          });
        }
      });

      res.json({ group: updatedGroup });
    } catch (error) {
      console.error('Add group members error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  /**
   * DELETE /api/groups/:id/members/:memberId
   * Remove member from group (or leave group)
   */
  app.delete('/api/groups/:id/members/:memberId', authenticateToken, async (req, res) => {
    try {
      const { id, memberId } = req.params;
      const userId = req.user!.userId;

      const group = await getGroupById(id);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Verify user is a member
      if (!group.memberIds.some((m) => m.toString() === userId)) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // If removing self, allow (leave group)
      // If removing others, must be creator
      if (memberId !== userId && group.creatorId.toString() !== userId) {
        return res.status(403).json({ error: 'Only group creator can remove members' });
      }

      // Remove member
      await removeMemberFromGroup(id, memberId);

      res.json({ success: true, message: 'Member removed' });
    } catch (error: any) {
      console.error('Remove group member error:', error);
      if (error.message === 'Creator cannot be removed') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Server error' });
    }
  });

  /**
   * DELETE /api/groups/:id
   * Delete group (creator only)
   */
  app.delete('/api/groups/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await deleteGroup(id, userId);

      res.json({ success: true, message: 'Group deleted' });
    } catch (error: any) {
      console.error('Delete group error:', error);
      if (error.message === 'Only group creator can delete the group') {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === 'Group not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ============================================================================
  // MESSAGE ENDPOINTS (PROTECTED)
  // ============================================================================

  /**
   * POST /api/messages/:id/reactions
   * Add reaction to message
   */
  app.post('/api/messages/:id/reactions', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { emoji } = req.body;
      const userId = req.user!.userId;

      if (!emoji) {
        return res.status(400).json({ error: 'Emoji is required' });
      }

      const message = await addReaction(id, userId, emoji);

      res.json({ message });
    } catch (error) {
      console.error('Add reaction error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  /**
   * DELETE /api/messages/:id/reactions
   * Remove reaction from message
   */
  app.delete('/api/messages/:id/reactions', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { emoji } = req.body;
      const userId = req.user!.userId;

      if (!emoji) {
        return res.status(400).json({ error: 'Emoji is required' });
      }

      const message = await removeReaction(id, userId, emoji);

      res.json({ message });
    } catch (error) {
      console.error('Remove reaction error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ============================================================================
  // FILE UPLOAD ENDPOINT (PROTECTED)
  // ============================================================================

  /**
   * POST /api/upload
   * Upload file to Cloudinary
   */
  app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      // Upload to Cloudinary
      const { url, publicId } = await uploadToCloudinary(req.file.buffer, req.file.originalname);

      res.json({
        success: true,
        url,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  });

  // Multer error handler
  app.use(handleMulterError);

  // ============================================================================
  // SOCKET.IO EVENT HANDLERS
  // ============================================================================

  io.on('connection', (socket) => {
    console.log('Socket.IO client connected:', socket.id);

    let userId: string | null = null;

    /**
     * 'auth' event - Authenticate socket connection with user ID
     */
    socket.on('auth', async (data) => {
      try {
        userId = data.userId;
        userSockets.set(userId, socket.id);

        // Update user online status
        await updateUserOnlineStatus(userId, true);

        // Broadcast to all other users that this user is online
        socket.broadcast.emit('userStatus', {
          userId,
          isOnline: true,
          lastSeen: new Date(),
        });

        console.log(`User ${userId} authenticated on socket ${socket.id}`);
      } catch (error) {
        console.error('Socket auth error:', error);
      }
    });

    /**
     * 'typing' event - User is typing in conversation/group
     */
    socket.on('typing', async (data) => {
      try {
        if (!userId) return;

        const { conversationId, isTyping } = data;

        // Find recipients
        let recipientIds: string[] = [];

        const conversation = await getConversationById(conversationId);
        if (conversation) {
          recipientIds = [
            conversation.participant1Id.toString() === userId
              ? conversation.participant2Id.toString()
              : conversation.participant1Id.toString(),
          ];
        } else {
          const group = await getGroupById(conversationId);
          if (group) {
            recipientIds = group.memberIds
              .filter((memberId) => memberId.toString() !== userId)
              .map((memberId) => memberId.toString());
          }
        }

        // Emit typing event to recipients
        recipientIds.forEach((recipientId) => {
          const recipientSocketId = userSockets.get(recipientId);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('typing', {
              userId,
              conversationId,
              isTyping,
            });
          }
        });
      } catch (error) {
        console.error('Socket typing error:', error);
      }
    });

    /**
     * 'stopTyping' event - User stopped typing
     */
    socket.on('stopTyping', async (data) => {
      try {
        if (!userId) return;

        const { conversationId } = data;

        // Find recipients (same logic as typing)
        let recipientIds: string[] = [];

        const conversation = await getConversationById(conversationId);
        if (conversation) {
          recipientIds = [
            conversation.participant1Id.toString() === userId
              ? conversation.participant2Id.toString()
              : conversation.participant1Id.toString(),
          ];
        } else {
          const group = await getGroupById(conversationId);
          if (group) {
            recipientIds = group.memberIds
              .filter((memberId) => memberId.toString() !== userId)
              .map((memberId) => memberId.toString());
          }
        }

        // Emit typing event with isTyping false
        recipientIds.forEach((recipientId) => {
          const recipientSocketId = userSockets.get(recipientId);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('typing', {
              userId,
              conversationId,
              isTyping: false,
            });
          }
        });
      } catch (error) {
        console.error('Socket stop typing error:', error);
      }
    });

    /**
     * 'messageRead' event - User read a message
     */
    socket.on('messageRead', async (data) => {
      try {
        if (!userId) return;

        const { messageId, conversationId } = data;

        // Could implement read receipts here
        // For now, marking as read is handled via REST API

        console.log(`User ${userId} read message ${messageId} in conversation ${conversationId}`);
      } catch (error) {
        console.error('Socket message read error:', error);
      }
    });

    /**
     * 'disconnect' event - Socket disconnected
     */
    socket.on('disconnect', async () => {
      try {
        if (userId) {
          userSockets.delete(userId);
          await updateUserOnlineStatus(userId, false);

          socket.broadcast.emit('userStatus', {
            userId,
            isOnline: false,
            lastSeen: new Date(),
          });

          console.log(`User ${userId} disconnected from socket ${socket.id}`);
        }
      } catch (error) {
        console.error('Socket disconnect error:', error);
      }
    });
  });

  console.log('All routes and Socket.IO handlers registered successfully');
}
