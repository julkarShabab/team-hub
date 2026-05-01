'use client';
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '../lib/constants';
import useGoalStore from '../store/goalStore';
import useActionItemStore from '../store/actionItemStore';

let socketInstance = null;

export function getSocket() {
  return socketInstance;
}

export function useSocket(workspaceId) {
  const socketRef = useRef(null);

  const onGoalCreated = useGoalStore((s) => s.onGoalCreated);
  const onGoalUpdated = useGoalStore((s) => s.onGoalUpdated);
  const onGoalDeleted = useGoalStore((s) => s.onGoalDeleted);
  const onItemCreated = useActionItemStore((s) => s.onItemCreated);
  const onItemUpdated = useActionItemStore((s) => s.onItemUpdated);
  const onItemDeleted = useActionItemStore((s) => s.onItemDeleted);

  useEffect(() => {
    if (!workspaceId) return;

    const token = typeof window !== 'undefined' ? window.__accessToken : null;
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

    const socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketInstance = socket;
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit(SOCKET_EVENTS.JOIN_WORKSPACE, workspaceId);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    // Goals
    socket.on(SOCKET_EVENTS.GOAL_CREATED, onGoalCreated);
    socket.on(SOCKET_EVENTS.GOAL_UPDATED, onGoalUpdated);
    socket.on(SOCKET_EVENTS.GOAL_DELETED, onGoalDeleted);

    // Action items
    socket.on(SOCKET_EVENTS.ACTION_ITEM_CREATED, onItemCreated);
    socket.on(SOCKET_EVENTS.ACTION_ITEM_UPDATED, onItemUpdated);
    socket.on(SOCKET_EVENTS.ACTION_ITEM_DELETED, onItemDeleted);

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_WORKSPACE, workspaceId);
      socket.disconnect();
      socketInstance = null;
    };
  }, [workspaceId]);

  return socketRef.current;
}
