import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./memStorage";
import { setupAuth, isAuthenticated } from "./noAuth";
import { insertMessageSchema, insertConversationSchema } from "@shared/schema";
import { z } from "zod";

interface SocketClient {
  ws: WebSocket;
  userId: string;
}

const connectedClients = new Map<string, SocketClient>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Guest user endpoint
  app.post('/api/guest/join', async (req, res) => {
    try {
      const { user } = req.body;
      if (!user || !user.id || !user.name) {
        return res.status(400).json({ message: "Invalid user data" });
      }

      // Store guest user
      const guestUser = await storage.upsertUser({
        id: user.id,
        email: null,
        firstName: user.name,
        lastName: null,
        profileImageUrl: user.avatar,
      });

      res.json({ success: true, user: guestUser });
    } catch (error) {
      console.error("Error joining as guest:", error);
      res.status(500).json({ message: "Failed to join chat" });
    }
  });

  // User routes
  app.get('/api/users/search', async (req: any, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }

      const users = await storage.searchUsers(q, 'guest');
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Conversation routes
  app.get('/api/conversations', async (req: any, res) => {
    try {
      // Return empty conversations for guest mode
      res.json([]);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/conversations', async (req: any, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      
      const conversation = await storage.getOrCreateConversation(
        'guest',
        validatedData.participant2Id
      );
      
      res.json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid conversation data", errors: error.errors });
      }
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Message routes
  app.get('/api/conversations/:id/messages', async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }

      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/conversations/:id/messages', async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }

      const validatedData = insertMessageSchema.parse({
        ...req.body,
        conversationId,
      });

      const message = await storage.createMessage(validatedData);
      
      // Broadcast message to connected clients
      broadcastMessage(conversationId, message, validatedData.senderId);
      
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.patch('/api/conversations/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = parseInt(req.params.id);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }

      await storage.markMessagesAsRead(conversationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Message reaction routes
  app.post('/api/messages/:id/reactions', async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const { emoji } = req.body;
      const userId = req.session?.user?.id || 'guest';

      if (isNaN(messageId) || !emoji) {
        return res.status(400).json({ message: "Invalid message ID or emoji" });
      }

      await storage.addMessageReaction(messageId, userId, emoji);
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });

  app.delete('/api/messages/:id/reactions', async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const { emoji } = req.body;
      const userId = req.session?.user?.id || 'guest';

      if (isNaN(messageId) || !emoji) {
        return res.status(400).json({ message: "Invalid message ID or emoji" });
      }

      await storage.removeMessageReaction(messageId, userId, emoji);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing reaction:", error);
      res.status(500).json({ message: "Failed to remove reaction" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'auth':
            if (message.userId) {
              connectedClients.set(message.userId, { ws, userId: message.userId });
              await storage.updateUserOnlineStatus(message.userId, true);
              broadcastUserStatus(message.userId, true);
            }
            break;
            
          case 'typing':
            broadcastTyping(message.conversationId, message.userId, message.isTyping);
            break;
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    ws.on('close', async () => {
      // Find and remove the client
      for (const [userId, client] of connectedClients.entries()) {
        if (client.ws === ws) {
          connectedClients.delete(userId);
          await storage.updateUserOnlineStatus(userId, false);
          broadcastUserStatus(userId, false);
          break;
        }
      }
    });
  });

  function broadcastMessage(conversationId: number, message: any, senderId: string) {
    const messageData = JSON.stringify({
      type: 'message',
      conversationId,
      message,
    });

    connectedClients.forEach((client, userId) => {
      if (userId !== senderId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageData);
      }
    });
  }

  function broadcastTyping(conversationId: number, userId: string, isTyping: boolean) {
    const typingData = JSON.stringify({
      type: 'typing',
      conversationId,
      userId,
      isTyping,
    });

    connectedClients.forEach((client, clientUserId) => {
      if (clientUserId !== userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(typingData);
      }
    });
  }

  function broadcastUserStatus(userId: string, isOnline: boolean) {
    const statusData = JSON.stringify({
      type: 'userStatus',
      userId,
      isOnline,
    });

    connectedClients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(statusData);
      }
    });
  }

  return httpServer;
}
