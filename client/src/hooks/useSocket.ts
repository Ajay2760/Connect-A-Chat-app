import { useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";

export interface SocketMessage {
  type: string;
  [key: string]: any;
}

export function useSocket() {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const messageHandlers = useRef<Map<string, (data: any) => void>>(new Map());

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      // Authenticate with the server
      socket.send(JSON.stringify({
        type: 'auth',
        userId: user.id,
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handler = messageHandlers.current.get(data.type);
        if (handler) {
          handler(data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [isAuthenticated, user]);

  const sendMessage = (message: SocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  const subscribe = (type: string, handler: (data: any) => void) => {
    messageHandlers.current.set(type, handler);
    
    return () => {
      messageHandlers.current.delete(type);
    };
  };

  return {
    isConnected,
    sendMessage,
    subscribe,
  };
}
