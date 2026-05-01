const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Team Hub API',
      version: '1.0.0',
      description: `
## Team Hub — Collaborative Workspace API

### Advanced Features
- **Optimistic UI** — Frontend actions reflect instantly before server confirmation
- **Advanced RBAC** — Permission matrix controlling access by role (Admin/Member)

### Demo Accounts
| Email | Password | Role |
|-------|----------|------|
| alice@demo.com | Demo1234! | Admin |
| bob@demo.com | Demo1234! | Member |
| carol@demo.com | Demo1234! | Member |
      `,
    },
    servers: [
      {
        url: 'https://team-hub-production-6ffe.up.railway.app',
        description: 'Production',
      },
      {
        url: 'http://localhost:4000',
        description: 'Development',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Register, login, logout, token refresh' },
      { name: 'Users', description: 'Profile and avatar management' },
      { name: 'Workspaces', description: 'Workspace CRUD and member management' },
      { name: 'Goals', description: 'Goals, milestones, progress updates' },
      { name: 'Action Items', description: 'Kanban tasks with assignees and priorities' },
      { name: 'Announcements', description: 'Team announcements with reactions and comments' },
      { name: 'Notifications', description: 'In-app notifications' },
      { name: 'Analytics', description: 'Workspace statistics and chart data' },
    ],
    paths: {
      '/api/health': {
        get: {
          tags: ['Auth'],
          summary: 'Health check',
          responses: { 200: { description: 'API is running' } },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'Jane Smith' },
                    email: { type: 'string', example: 'jane@example.com' },
                    password: { type: 'string', example: 'password123' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'User created' },
            409: { description: 'Email already registered' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'alice@demo.com' },
                    password: { type: 'string', example: 'Demo1234!' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          responses: {
            200: { description: 'New token issued' },
            401: { description: 'Refresh token expired' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout and clear cookies',
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: 'Logged out' } },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user',
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: 'Current user data' } },
        },
      },
      '/api/users/profile': {
        put: {
          tags: ['Users'],
          summary: 'Update display name',
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { name: { type: 'string', example: 'Alice Johnson' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Profile updated' } },
        },
      },
      '/api/users/avatar': {
        post: {
          tags: ['Users'],
          summary: 'Upload avatar image',
          security: [{ cookieAuth: [] }],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: { avatar: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Avatar uploaded' } },
        },
      },
      '/api/workspaces': {
        get: {
          tags: ['Workspaces'],
          summary: 'List my workspaces',
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: 'List of workspaces' } },
        },
        post: {
          tags: ['Workspaces'],
          summary: 'Create workspace',
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Engineering Team' },
                    description: { type: 'string' },
                    accentColor: { type: 'string', example: '#6366f1' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Workspace created' } },
        },
      },
      '/api/workspaces/{workspaceId}': {
        get: {
          tags: ['Workspaces'],
          summary: 'Get workspace with members',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Workspace details' } },
        },
        put: {
          tags: ['Workspaces'],
          summary: 'Update workspace (Admin only)',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Updated' }, 403: { description: 'Admin only' } },
        },
      },
      '/api/workspaces/{workspaceId}/invite': {
        post: {
          tags: ['Workspaces'],
          summary: 'Invite member by email (Admin only)',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', example: 'newmember@example.com' },
                    role: { type: 'string', enum: ['ADMIN', 'MEMBER'], default: 'MEMBER' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Member added' }, 403: { description: 'Admin only' } },
        },
      },
      '/api/workspaces/{workspaceId}/members/{userId}/role': {
        put: {
          tags: ['Workspaces'],
          summary: 'Change member role (Admin only)',
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { role: { type: 'string', enum: ['ADMIN', 'MEMBER'] } },
                },
              },
            },
          },
          responses: { 200: { description: 'Role updated' } },
        },
      },
      '/api/workspaces/{workspaceId}/members/{userId}': {
        delete: {
          tags: ['Workspaces'],
          summary: 'Remove member (Admin only)',
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Member removed' } },
        },
      },
      '/api/workspaces/{workspaceId}/export': {
        get: {
          tags: ['Workspaces'],
          summary: 'Export workspace data as CSV',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'CSV download' } },
        },
      },
      '/api/goals/workspace/{workspaceId}': {
        get: {
          tags: ['Goals'],
          summary: 'List goals in workspace',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Goals list' } },
        },
        post: {
          tags: ['Goals'],
          summary: 'Create goal (requires CREATE_GOAL permission)',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string', example: 'Launch v2.0' },
                    description: { type: 'string' },
                    status: { type: 'string', enum: ['ON_TRACK', 'AT_RISK', 'COMPLETED', 'CANCELLED'] },
                    dueDate: { type: 'string', format: 'date' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Goal created' }, 403: { description: 'Permission denied' } },
        },
      },
      '/api/goals/{goalId}': {
        get: {
          tags: ['Goals'],
          summary: 'Get goal details',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'goalId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Goal with milestones and updates' } },
        },
        put: {
          tags: ['Goals'],
          summary: 'Update goal (requires EDIT_GOAL)',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'goalId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Goal updated' } },
        },
        delete: {
          tags: ['Goals'],
          summary: 'Delete goal (Admin only)',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'goalId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Goal deleted' } },
        },
      },
      '/api/goals/{goalId}/milestones': {
        post: {
          tags: ['Goals'],
          summary: 'Add milestone',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'goalId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string', example: 'Design approved' },
                    progress: { type: 'integer', minimum: 0, maximum: 100 },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Milestone added' } },
        },
      },
      '/api/goals/{goalId}/milestones/{milestoneId}': {
        put: {
          tags: ['Goals'],
          summary: 'Update milestone progress',
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'goalId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'milestoneId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    progress: { type: 'integer', minimum: 0, maximum: 100 },
                    completed: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Milestone updated' } },
        },
      },
      '/api/goals/{goalId}/progress': {
        post: {
          tags: ['Goals'],
          summary: 'Post progress update',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'goalId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['content'],
                  properties: { content: { type: 'string', example: 'Completed backend API' } },
                },
              },
            },
          },
          responses: { 201: { description: 'Update posted' } },
        },
      },
      '/api/action-items/workspace/{workspaceId}': {
        get: {
          tags: ['Action Items'],
          summary: 'List action items with filters',
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'] } },
            { name: 'priority', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] } },
            { name: 'assigneeId', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Action items list' } },
        },
        post: {
          tags: ['Action Items'],
          summary: 'Create action item',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string', example: 'Write unit tests' },
                    status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'], default: 'TODO' },
                    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
                    assigneeId: { type: 'string' },
                    goalId: { type: 'string' },
                    dueDate: { type: 'string', format: 'date' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Item created' } },
        },
      },
      '/api/action-items/{itemId}': {
        put: {
          tags: ['Action Items'],
          summary: 'Update action item (used for Kanban drag-drop)',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Item updated' } },
        },
        delete: {
          tags: ['Action Items'],
          summary: 'Delete action item',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Item deleted' } },
        },
      },
      '/api/announcements/workspace/{workspaceId}': {
        get: {
          tags: ['Announcements'],
          summary: 'List announcements (pinned first)',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Announcements with reactions and comments' } },
        },
        post: {
          tags: ['Announcements'],
          summary: 'Post announcement (Admin only)',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'content'],
                  properties: {
                    title: { type: 'string', example: 'Q2 Planning Complete' },
                    content: { type: 'string', example: 'Great work everyone!' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Announcement posted' }, 403: { description: 'Admin only' } },
        },
      },
      '/api/announcements/{announcementId}/pin': {
        put: {
          tags: ['Announcements'],
          summary: 'Toggle pin (Admin only)',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'announcementId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Pin toggled' } },
        },
      },
      '/api/announcements/{announcementId}/react': {
        post: {
          tags: ['Announcements'],
          summary: 'Toggle emoji reaction',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'announcementId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['emoji'],
                  properties: { emoji: { type: 'string', example: '👍' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Reaction toggled' } },
        },
      },
      '/api/announcements/{announcementId}/comments': {
        post: {
          tags: ['Announcements'],
          summary: 'Post comment (@mention supported)',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'announcementId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['content'],
                  properties: { content: { type: 'string', example: 'Great update @Alice!' } },
                },
              },
            },
          },
          responses: { 201: { description: 'Comment posted' } },
        },
      },
      '/api/analytics/workspace/{workspaceId}': {
        get: {
          tags: ['Analytics'],
          summary: 'Get workspace stats and chart data',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Stats, goalsByStatus, recentActivity' } },
        },
      },
      '/api/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Get my notifications',
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: 'Notifications list' } },
        },
      },
      '/api/notifications/read-all': {
        put: {
          tags: ['Notifications'],
          summary: 'Mark all as read',
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: 'All marked read' } },
        },
      },
      '/api/notifications/{id}/read': {
        put: {
          tags: ['Notifications'],
          summary: 'Mark one as read',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Marked read' } },
        },
      },
    },
  },
  apis: [],
};

const specs = swaggerJsdoc(options);
module.exports = specs;