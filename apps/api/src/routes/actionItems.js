const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../utils/prisma');
const { authenticate, requireMember } = require('../middleware/auth');
const { SOCKET_EVENTS } = require('@team-hub/shared');
const { emitToWorkspace } = require('../socket');

const router = express.Router();

// ─── List action items ────────────────────────────────────────────────────────
router.get('/workspace/:workspaceId', authenticate, requireMember, async (req, res, next) => {
  try {
    const { goalId, assigneeId, status, priority } = req.query;

    const where = { workspaceId: req.workspaceId };
    if (goalId) where.goalId = goalId;
    if (assigneeId) where.assigneeId = assigneeId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const items = await prisma.actionItem.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        goal: { select: { id: true, title: true } },
      },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
    });

    res.json({ items });
  } catch (err) {
    next(err);
  }
});

// ─── Create action item ───────────────────────────────────────────────────────
router.post(
  '/workspace/:workspaceId',
  authenticate,
  requireMember,
  [body('title').trim().notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { title, description, assigneeId, priority, dueDate, goalId, status } = req.body;

      const item = await prisma.actionItem.create({
        data: {
          workspaceId: req.workspaceId,
          title,
          description,
          assigneeId: assigneeId || null,
          priority: priority || 'MEDIUM',
          dueDate: dueDate ? new Date(dueDate) : null,
          goalId: goalId || null,
          status: status || 'TODO',
        },
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          goal: { select: { id: true, title: true } },
        },
      });

      emitToWorkspace(req.app.get('io'), req.workspaceId, SOCKET_EVENTS.ACTION_ITEM_CREATED, item);
      res.status(201).json({ item });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Update action item ───────────────────────────────────────────────────────
router.put('/:itemId', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.actionItem.findUnique({ where: { id: req.params.itemId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: existing.workspaceId, userId: req.user.id } },
    });
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    const { title, description, assigneeId, priority, dueDate, status, goalId } = req.body;

    const item = await prisma.actionItem.update({
      where: { id: req.params.itemId },
      data: {
        title,
        description,
        assigneeId: assigneeId !== undefined ? assigneeId : undefined,
        priority,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        status,
        goalId: goalId !== undefined ? goalId : undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        goal: { select: { id: true, title: true } },
      },
    });

    emitToWorkspace(req.app.get('io'), existing.workspaceId, SOCKET_EVENTS.ACTION_ITEM_UPDATED, item);
    res.json({ item });
  } catch (err) {
    next(err);
  }
});

// ─── Delete action item ───────────────────────────────────────────────────────
router.delete('/:itemId', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.actionItem.findUnique({ where: { id: req.params.itemId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: existing.workspaceId, userId: req.user.id } },
    });
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    // Members can only delete their own; admins can delete any
    if (membership.role !== 'ADMIN' && existing.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await prisma.actionItem.delete({ where: { id: req.params.itemId } });
    emitToWorkspace(req.app.get('io'), existing.workspaceId, SOCKET_EVENTS.ACTION_ITEM_DELETED, {
      id: req.params.itemId,
    });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
