import { io, Socket } from 'socket.io-client';

/**
 * Socket.IO server URL from environment variable
 */
const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5001';

/**
 * Socket.IO client instance
 * Configured with autoConnect: false to allow manual connection control
 */
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false, // Don't connect automatically
  withCredentials: true, // Include cookies
});

// Log connection events for debugging
socket.on('connect', () => {
  console.log('Socket.IO connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Socket.IO disconnected');
});

socket.on('connect_error', (error) => {
  console.error('Socket.IO connection error:', error);
});
