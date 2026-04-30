const { SOCKET_EVENTS } = require('@team-hub/shared');
const { verifyAccessToken } = require('./utils/jwt');

// Track online users per workspace: { workspaceId: Set<userId> }
const onlineUsers = new Map();
// Track socket -> { userId, workspaceId }
const socketMap = new Map();

function initSocket(io) {
  io.use((socket, next) => {
    // Auth via cookie or query token
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      socket.userName = payload.name;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.userId})`);

    // ── Join workspace room ──────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.JOIN_WORKSPACE, (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      socketMap.set(socket.id, { userId: socket.userId, workspaceId });

      // Track online users
      if (!onlineUsers.has(workspaceId)) {
        onlineUsers.set(workspaceId, new Set());
      }
      onlineUsers.get(workspaceId).add(socket.userId);

      // Broadcast updated online list
      io.to(`workspace:${workspaceId}`).emit(
        SOCKET_EVENTS.ONLINE_MEMBERS,
        Array.from(onlineUsers.get(workspaceId))
      );

      console.log(`User ${socket.userId} joined workspace ${workspaceId}`);
    });

    // ── Leave workspace room ─────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.LEAVE_WORKSPACE, (workspaceId) => {
      handleLeave(socket, io, workspaceId);
    });

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const info = socketMap.get(socket.id);
      if (info) {
        handleLeave(socket, io, info.workspaceId);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

function handleLeave(socket, io, workspaceId) {
  socket.leave(`workspace:${workspaceId}`);
  socketMap.delete(socket.id);

  if (onlineUsers.has(workspaceId)) {
    onlineUsers.get(workspaceId).delete(socket.userId);
    io.to(`workspace:${workspaceId}`).emit(
      SOCKET_EVENTS.ONLINE_MEMBERS,
      Array.from(onlineUsers.get(workspaceId))
    );
  }
}

// Helper: emit to workspace room (used in route handlers)
function emitToWorkspace(io, workspaceId, event, data) {
  io.to(`workspace:${workspaceId}`).emit(event, data);
}

module.exports = { initSocket, emitToWorkspace };
