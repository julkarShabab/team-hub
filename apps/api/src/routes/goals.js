const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../utils/prisma');
const { authenticate, requirePermission, requireMember } = require('../middleware/auth');
const { PERMISSIONS, SOCKET_EVENTS } = require('../utils/constants');
const { emitToWorkspace } = require('../socket');

const router = express.Router();

// ─── List goals ───────────────────────────────────────────────────────────────
router.get('/workspace/:workspaceId', authenticate, requireMember, async (req, res, next) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { workspaceId: req.workspaceId },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        milestones: { orderBy: { createdAt: 'asc' } },
        _count: { select: { actionItems: true, progressUpdates: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ goals });
  } catch (err) {
    next(err);
  }
});

// ─── Create goal ──────────────────────────────────────────────────────────────
router.post(
  '/workspace/:workspaceId',
  authenticate,
  requirePermission(PERMISSIONS.CREATE_GOAL),
  [body('title').trim().notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { title, description, dueDate, status } = req.body;

      const goal = await prisma.goal.create({
        data: {
          workspaceId: req.workspaceId,
          ownerId: req.user.id,
          title,
          description,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: status || 'ON_TRACK',
        },
        include: {
          owner: { select: { id: true, name: true, avatarUrl: true } },
          milestones: true,
          _count: { select: { actionItems: true, progressUpdates: true } },
        },
      });

      emitToWorkspace(req.app.get('io'), req.workspaceId, SOCKET_EVENTS.GOAL_CREATED, goal);
      res.status(201).json({ goal });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Get single goal ──────────────────────────────────────────────────────────
router.get('/:goalId', authenticate, async (req, res, next) => {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: req.params.goalId },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        milestones: { orderBy: { createdAt: 'asc' } },
        progressUpdates: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
        actionItems: {
          include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { actionItems: true, progressUpdates: true } },
      },
    });

    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    // Verify workspace membership
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: goal.workspaceId, userId: req.user.id } },
    });
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    res.json({ goal });
  } catch (err) {
    next(err);
  }
});

// ─── Update goal ──────────────────────────────────────────────────────────────
router.put('/:goalId', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.goal.findUnique({ where: { id: req.params.goalId } });
    if (!existing) return res.status(404).json({ error: 'Goal not found' });

    // Check permission
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: existing.workspaceId, userId: req.user.id } },
    });
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    const { ROLE_PERMISSIONS } = require('../utils/constants');
    if (!ROLE_PERMISSIONS[membership.role]?.includes(PERMISSIONS.EDIT_GOAL)) {
      return res.status(403).json({ error: 'Permission denied: EDIT_GOAL' });
    }

    const { title, description, status, dueDate } = req.body;

    const goal = await prisma.goal.update({
      where: { id: req.params.goalId },
      data: {
        title,
        description,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        milestones: true,
        _count: { select: { actionItems: true, progressUpdates: true } },
      },
    });

    emitToWorkspace(req.app.get('io'), existing.workspaceId, SOCKET_EVENTS.GOAL_UPDATED, goal);
    res.json({ goal });
  } catch (err) {
    next(err);
  }
});

// ─── Delete goal ──────────────────────────────────────────────────────────────
router.delete('/:goalId', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.goal.findUnique({ where: { id: req.params.goalId } });
    if (!existing) return res.status(404).json({ error: 'Goal not found' });

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: existing.workspaceId, userId: req.user.id } },
    });
    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can delete goals' });
    }

    await prisma.goal.delete({ where: { id: req.params.goalId } });
    emitToWorkspace(req.app.get('io'), existing.workspaceId, SOCKET_EVENTS.GOAL_DELETED, { id: req.params.goalId });
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    next(err);
  }
});

// ─── Add milestone ────────────────────────────────────────────────────────────
router.post('/:goalId/milestones', authenticate, async (req, res, next) => {
  try {
    const { title, progress } = req.body;

    const goal = await prisma.goal.findUnique({ where: { id: req.params.goalId } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const milestone = await prisma.milestone.create({
      data: {
        goalId: req.params.goalId,
        title,
        progress: progress || 0,
      },
    });

    emitToWorkspace(req.app.get('io'), goal.workspaceId, SOCKET_EVENTS.MILESTONE_UPDATED, {
      goalId: req.params.goalId,
      milestone,
    });

    res.status(201).json({ milestone });
  } catch (err) {
    next(err);
  }
});

// ─── Update milestone ─────────────────────────────────────────────────────────
router.put('/:goalId/milestones/:milestoneId', authenticate, async (req, res, next) => {
  try {
    const { title, progress, completed } = req.body;

    const goal = await prisma.goal.findUnique({ where: { id: req.params.goalId } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const milestone = await prisma.milestone.update({
      where: { id: req.params.milestoneId },
      data: {
        title,
        progress: progress !== undefined ? Number(progress) : undefined,
        completed: completed !== undefined ? Boolean(completed) : undefined,
      },
    });

    emitToWorkspace(req.app.get('io'), goal.workspaceId, SOCKET_EVENTS.MILESTONE_UPDATED, {
      goalId: req.params.goalId,
      milestone,
    });

    res.json({ milestone });
  } catch (err) {
    next(err);
  }
});

// ─── Add progress update ──────────────────────────────────────────────────────
router.post('/:goalId/progress', authenticate, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content required' });
    }

    const goal = await prisma.goal.findUnique({ where: { id: req.params.goalId } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const update = await prisma.progressUpdate.create({
      data: { goalId: req.params.goalId, userId: req.user.id, content },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    emitToWorkspace(req.app.get('io'), goal.workspaceId, SOCKET_EVENTS.GOAL_UPDATED, {
      goalId: req.params.goalId,
      progressUpdate: update,
    });

    res.status(201).json({ update });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
