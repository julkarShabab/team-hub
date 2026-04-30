const express = require('express');
const { prisma } = require('../utils/prisma');
const { authenticate, requireMember } = require('../middleware/auth');

const analyticsRouter = express.Router();
const notificationsRouter = express.Router();

// ─── Analytics ────────────────────────────────────────────────────────────────
analyticsRouter.get('/workspace/:workspaceId', authenticate, requireMember, async (req, res, next) => {
  try {
    const wid = req.workspaceId;
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalGoals,
      completedGoals,
      overdueGoals,
      totalItems,
      completedItemsThisWeek,
      overdueItems,
      goalsByStatus,
      recentActivity,
    ] = await Promise.all([
      prisma.goal.count({ where: { workspaceId: wid } }),
      prisma.goal.count({ where: { workspaceId: wid, status: 'COMPLETED' } }),
      prisma.goal.count({
        where: { workspaceId: wid, dueDate: { lt: now }, status: { not: 'COMPLETED' } },
      }),
      prisma.actionItem.count({ where: { workspaceId: wid } }),
      prisma.actionItem.count({
        where: { workspaceId: wid, status: 'DONE', updatedAt: { gte: weekAgo } },
      }),
      prisma.actionItem.count({
        where: { workspaceId: wid, dueDate: { lt: now }, status: { not: 'DONE' } },
      }),
      prisma.goal.groupBy({
        by: ['status'],
        where: { workspaceId: wid },
        _count: true,
      }),
      prisma.progressUpdate.findMany({
        where: { goal: { workspaceId: wid } },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          goal: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    res.json({
      stats: {
        totalGoals,
        completedGoals,
        overdueGoals,
        totalItems,
        completedItemsThisWeek,
        overdueItems,
      },
      goalsByStatus: goalsByStatus.map((g) => ({ status: g.status, count: g._count })),
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Notifications ────────────────────────────────────────────────────────────
notificationsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.put('/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    next(err);
  }
});

module.exports = { analyticsRoutes: analyticsRouter, notificationsRoutes: notificationsRouter };
