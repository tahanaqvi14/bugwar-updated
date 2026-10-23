import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import { SocketContext } from './SocketContext';

const CONNECT_TIMEOUT_MS = 20000; // Render's free tier can take a while to wake up

// Owns the single game connection for the whole app.
// It connects when the app loads (so refreshing a page keeps you connected) and again right after login.
// The server only accepts the connection when the login session cookie is valid.
const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  const clear = useCallback((target) => {
    if (socketRef.current !== target) return;
    socketRef.current = null;
    setSocket(null);
  }, []);

  const disconnectSocket = useCallback(() => {
    const current = socketRef.current;
    socketRef.current = null;
    setSocket(null);
    current?.disconnect();
  }, []);

  const connectSocket = useCallback(({ force = false } = {}) => {
    const existing = socketRef.current;
    if (existing && existing.connected && !force) return Promise.resolve(existing);
    existing?.disconnect();

    const newSocket = io(API_URL, { withCredentials: true, transports: ['websocket'] });
    socketRef.current = newSocket;

    // The server refused us (not logged in / session expired): stop for good.
    newSocket.on('connect_error', (error) => {
      if (error?.message === 'Not authenticated') {
        newSocket.disconnect();
        clear(newSocket);
      }
    });
    // The server closed the connection on purpose (e.g. logout in another tab)
    newSocket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') clear(newSocket);
    });

    return new Promise((resolve) => {
      const finish = (result) => {
        clearTimeout(timer);
        newSocket.off('connect', onConnect);
        newSocket.off('connect_error', onError);
        resolve(result);
      };
      const onConnect = () => {
        if (socketRef.current === newSocket) setSocket(newSocket);
        finish(newSocket);
      };
      const onError = (error) => {
        // Network errors are retried automatically by Socket.IO; only give up when the login was refused
        if (error?.message === 'Not authenticated') finish(null);
      };
      const timer = setTimeout(() => {
        newSocket.disconnect();
        clear(newSocket);
        finish(null);
      }, CONNECT_TIMEOUT_MS);

      newSocket.on('connect', onConnect);
      newSocket.on('connect_error', onError);
    });
  }, [clear]);

  // Reconnect automatically after a page refresh if the user is still logged in
  useEffect(() => {
    connectSocket();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [connectSocket]);

  const value = useMemo(
    () => ({ socket, connectSocket, disconnectSocket }),
    [socket, connectSocket, disconnectSocket]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export default SocketProvider;
