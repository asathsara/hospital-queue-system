import { createContext, useContext } from 'react';
import { io } from 'socket.io-client';

export const socket = io(import.meta.env.VITE_SOCKET_URL);
export const SocketContext = createContext(null);

// Custom hook
export const useSocket = () => useContext(SocketContext);
