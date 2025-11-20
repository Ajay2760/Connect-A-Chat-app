import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { socket } from "../lib/socket";

export interface SocketMessage {
  type: string;
  [key: string]: any;
}

export function useSocket() {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    function onConnect() {
      setIsConnected(true);
      console.log("Socket connected");

      // Authenticate with the server
      socket.emit('auth', { userId: user?.id });
    }

    function onDisconnect() {
      setIsConnected(false);
      console.log("Socket disconnected");
    }

    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // If already connected, authenticate immediately
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      // We don't necessarily want to disconnect on unmount if we want to keep the connection alive across pages,
      // but for now let's leave it managed by the app state or explicit disconnects.
      // socket.disconnect(); 
    };
  }, [isAuthenticated, user]);

  const sendMessage = (message: SocketMessage) => {
    if (socket.connected) {
      // For Socket.IO, we usually emit specific events, but to keep compatibility with the existing
      // message structure (type: 'typing', etc.), we can emit them as events or a generic 'message' event.
      // The server expects specific events for 'typing' and 'auth', but 'message' is handled differently?
      // Let's look at server: 
      // socket.on('typing', ...)
      // socket.on('auth', ...)
      // But for chat messages? 
      // The server has: app.post('/api/conversations/:id/messages') -> broadcastMessage
      // So chat messages are sent via HTTP POST, and received via socket event 'message'.

      // The client `sendMessage` seems to be used for typing indicators or other realtime signals?
      // In the old code: socket.send(JSON.stringify(message));
      // And server: ws.on('message', ... switch(message.type) ... case 'typing' ...)

      // So if message.type is 'typing', we should emit 'typing'.
      if (message.type === 'typing') {
        socket.emit('typing', message);
      } else {
        // Fallback or other types
        console.warn("Unknown message type for socket:", message.type);
      }
    }
  };

  const subscribe = (type: string, handler: (data: any) => void) => {
    // Map generic types to specific socket events if needed
    // The server emits: 'message', 'typing', 'userStatus', 'userList'

    const eventName = type; // In this case they match

    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  };

  return {
    isConnected,
    sendMessage,
    subscribe,
  };
}
