import { createContext, useContext } from 'react';

// Shared Socket.IO connection.
//   socket           → the connected socket, or null when not connected / not logged in
//   connectSocket()  → (re)connects using the current login session, resolves with the socket or null
//   disconnectSocket()
export const SocketContext = createContext({
  socket: null,
  connectSocket: async () => null,
  disconnectSocket: () => {},
});

export const useSocket = () => useContext(SocketContext);
