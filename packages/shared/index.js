// ─── Roles ───────────────────────────────────────────────────────────────────
const ROLES = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
};

// ─── Permissions (Advanced RBAC) ─────────────────────────────────────────────
const PERMISSIONS = {
  // Goals
  CREATE_GOAL: 'CREATE_GOAL',
  EDIT_GOAL: 'EDIT_GOAL',
  DELETE_GOAL: 'DELETE_GOAL',
  // Announcements
  POST_ANNOUNCEMENT: 'POST_ANNOUNCEMENT',
  PIN_ANNOUNCEMENT: 'PIN_ANNOUNCEMENT',
  DELETE_ANNOUNCEMENT: 'DELETE_ANNOUNCEMENT',
  // Members
  INVITE_MEMBER: 'INVITE_MEMBER',
  REMOVE_MEMBER: 'REMOVE_MEMBER',
  CHANGE_ROLE: 'CHANGE_ROLE',
  // Action Items
  CREATE_ACTION_ITEM: 'CREATE_ACTION_ITEM',
  EDIT_ANY_ACTION_ITEM: 'EDIT_ANY_ACTION_ITEM',
  DELETE_ANY_ACTION_ITEM: 'DELETE_ANY_ACTION_ITEM',
  // Workspace
  EDIT_WORKSPACE: 'EDIT_WORKSPACE',
  DELETE_WORKSPACE: 'DELETE_WORKSPACE',
  EXPORT_DATA: 'EXPORT_DATA',
};

// ─── Permission Matrix ────────────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MEMBER]: [
    PERMISSIONS.CREATE_GOAL,
    PERMISSIONS.EDIT_GOAL,
    PERMISSIONS.CREATE_ACTION_ITEM,
    PERMISSIONS.EXPORT_DATA,
  ],
};

// ─── Socket Events ────────────────────────────────────────────────────────────
const SOCKET_EVENTS = {
  // Connection
  JOIN_WORKSPACE: 'join_workspace',
  LEAVE_WORKSPACE: 'leave_workspace',
  // Online presence
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  ONLINE_MEMBERS: 'online_members',
  // Goals
  GOAL_CREATED: 'goal_created',
  GOAL_UPDATED: 'goal_updated',
  GOAL_DELETED: 'goal_deleted',
  // Action Items
  ACTION_ITEM_CREATED: 'action_item_created',
  ACTION_ITEM_UPDATED: 'action_item_updated',
  ACTION_ITEM_DELETED: 'action_item_deleted',
  // Announcements
  ANNOUNCEMENT_CREATED: 'announcement_created',
  ANNOUNCEMENT_UPDATED: 'announcement_updated',
  ANNOUNCEMENT_DELETED: 'announcement_deleted',
  REACTION_ADDED: 'reaction_added',
  COMMENT_ADDED: 'comment_added',
  // Notifications
  NOTIFICATION: 'notification',
  // Milestone
  MILESTONE_UPDATED: 'milestone_updated',
};

// ─── Action Item Status / Priority ───────────────────────────────────────────
const ACTION_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
};

const PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
};

const GOAL_STATUS = {
  ON_TRACK: 'ON_TRACK',
  AT_RISK: 'AT_RISK',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  SOCKET_EVENTS,
  ACTION_STATUS,
  PRIORITY,
  GOAL_STATUS,
};
