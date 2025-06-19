import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useSocket } from "./useSocket";
import { useAuth } from "./useAuth";
import type { Conversation, Message, MessageWithSender, User } from "@shared/schema";

export function useChat() {
  const { user } = useAuth();
  const { sendMessage: sendSocketMessage, subscribe } = useSocket();
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<number, Set<string>>>(new Map());

  // Get conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  // Get messages for active conversation
  const { data: messages, isLoading: messagesLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/conversations", activeConversationId, "messages"],
    enabled: !!activeConversationId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { 
      conversationId: number; 
      content: string; 
      messageType?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
    }) => {
      const response = await apiRequest("POST", `/api/conversations/${data.conversationId}/messages`, {
        content: data.content,
        messageType: data.messageType || "text",
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", activeConversationId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (participantId: string) => {
      const response = await apiRequest("POST", "/api/conversations", {
        participant2Id: participantId,
      });
      return response.json();
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setActiveConversationId(newConversation.id);
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      await apiRequest("PATCH", `/api/conversations/${conversationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  // Handle incoming messages
  useEffect(() => {
    const unsubscribeMessage = subscribe("message", (data) => {
      const { conversationId } = data;
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    });

    const unsubscribeTyping = subscribe("typing", (data) => {
      const { conversationId, userId, isTyping } = data;
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (!newMap.has(conversationId)) {
          newMap.set(conversationId, new Set());
        }
        const usersSet = newMap.get(conversationId)!;
        if (isTyping) {
          usersSet.add(userId);
        } else {
          usersSet.delete(userId);
        }
        return newMap;
      });
    });

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
    };
  }, [subscribe, queryClient]);

  const sendMessage = useCallback((content: string, fileData?: {
    messageType: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
  }) => {
    if (!activeConversationId) return;
    sendMessageMutation.mutate({
      conversationId: activeConversationId,
      content,
      messageType: fileData?.messageType || "text",
      fileUrl: fileData?.fileUrl,
      fileName: fileData?.fileName,
      fileSize: fileData?.fileSize,
    });
  }, [activeConversationId, sendMessageMutation]);

  const startConversation = useCallback((participantId: string) => {
    createConversationMutation.mutate(participantId);
  }, [createConversationMutation]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!activeConversationId) return;
    sendSocketMessage({
      type: "typing",
      conversationId: activeConversationId,
      userId: user?.id,
      isTyping,
    });
  }, [activeConversationId, sendSocketMessage, user?.id]);

  const markAsRead = useCallback((conversationId: number) => {
    markAsReadMutation.mutate(conversationId);
  }, [markAsReadMutation]);

  const addReaction = useCallback(async (messageId: number, emoji: string) => {
    try {
      await apiRequest("POST", `/api/messages/${messageId}/reactions`, { emoji });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", activeConversationId, "messages"] });
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  }, [activeConversationId, queryClient]);

  return {
    conversations,
    conversationsLoading,
    messages,
    messagesLoading,
    activeConversationId,
    setActiveConversationId,
    sendMessage,
    startConversation,
    sendTypingIndicator,
    markAsRead,
    addReaction,
    typingUsers: typingUsers.get(activeConversationId || 0) || new Set(),
    isLoading: sendMessageMutation.isPending || createConversationMutation.isPending,
  };
}
