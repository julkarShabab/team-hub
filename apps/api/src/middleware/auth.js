const { verifyAccessToken } = require('../utils/jwt');
const { prisma } = require('../utils/prisma');
const { ROLE_PERMISSIONS } = require('@team-hub/shared');

// ─── Verify JWT ───────────────────────────────────────────────────────────────
async function authenticate(req, res, next) {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── Require workspace membership ────────────────────────────────────────────
async function requireMember(req, res, next) {
  try {
    const workspaceId = req.params.workspaceId || req.body.workspaceId;
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId required' });
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: req.user.id,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }

    req.membership = membership;
    req.workspaceId = workspaceId;
    next();
  } catch (err) {
    next(err);
  }
}

// ─── Advanced RBAC — check permission ────────────────────────────────────────
function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      const workspaceId =
        req.params.workspaceId ||
        req.body.workspaceId ||
        req.workspaceId;

      if (!workspaceId) {
        return res.status(400).json({ error: 'workspaceId required' });
      }

      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: req.user.id,
          },
        },
      });

      if (!membership) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      const allowed = ROLE_PERMISSIONS[membership.role] || [];
      if (!allowed.includes(permission)) {
        return res.status(403).json({
          error: `Permission denied: ${permission} requires ${getRolesWithPermission(permission).join(' or ')} role`,
        });
      }

      req.membership = membership;
      req.workspaceId = workspaceId;
      next();
    } catch (err) {
      next(err);
    }
  };
}

function getRolesWithPermission(permission) {
  return Object.entries(ROLE_PERMISSIONS)
    .filter(([, perms]) => perms.includes(permission))
    .map(([role]) => role);
}

module.exports = { authenticate, requireMember, requirePermission };
