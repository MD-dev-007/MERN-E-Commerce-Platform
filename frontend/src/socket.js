import { io } from 'socket.io-client';

export const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000', {
  withCredentials: true,
  transports: ['polling', 'websocket'],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  path: '/socket.io/'
});

socket.on('connect', () => {
  console.log('Connected to socket server');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from socket server:', reason);
}); 