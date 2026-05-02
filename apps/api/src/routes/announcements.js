const express = require("express");
const { body, validationResult } = require("express-validator");
const { prisma } = require("../utils/prisma");
const {
  authenticate,
  requireMember,
  requirePermission,
} = require("../middleware/auth");
const { PERMISSIONS, SOCKET_EVENTS } = require("../utils/constants");
const { emitToWorkspace } = require("../socket");
const { sendMentionEmail } = require("../utils/email");

const router = express.Router();

// ─── List announcements ───────────────────────────────────────────────────────
router.get(
  "/workspace/:workspaceId",
  authenticate,
  requireMember,
  async (req, res, next) => {
    try {
      const announcements = await prisma.announcement.findMany({
        where: { workspaceId: req.workspaceId },
        include: {
          reactions: true,
          comments: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { reactions: true, comments: true } },
        },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      });

      // Attach author name (stored as authorId)
      const withAuthors = await Promise.all(
        announcements.map(async (a) => {
          const author = await prisma.user.findUnique({
            where: { id: a.authorId },
            select: { id: true, name: true, avatarUrl: true },
          });
          return { ...a, author };
        }),
      );

      res.json({ announcements: withAuthors });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Create announcement ──────────────────────────────────────────────────────
router.post(
  "/workspace/:workspaceId",
  authenticate,
  requirePermission(PERMISSIONS.POST_ANNOUNCEMENT),
  [body("title").trim().notEmpty(), body("content").trim().notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { title, content } = req.body;

      const announcement = await prisma.announcement.create({
        data: {
          workspaceId: req.workspaceId,
          authorId: req.user.id,
          title,
          content,
        },
        include: { reactions: true, comments: true },
      });

      const full = { ...announcement, author: req.user };
      emitToWorkspace(
        req.app.get("io"),
        req.workspaceId,
        SOCKET_EVENTS.ANNOUNCEMENT_CREATED,
        full,
      );
      res.status(201).json({ announcement: full });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Pin / unpin ──────────────────────────────────────────────────────────────
router.put("/:announcementId/pin", authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.announcement.findUnique({
      where: { id: req.params.announcementId },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: existing.workspaceId,
          userId: req.user.id,
        },
      },
    });
    if (!membership || membership.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Only admins can pin announcements" });
    }

    const announcement = await prisma.announcement.update({
      where: { id: req.params.announcementId },
      data: { pinned: !existing.pinned },
    });

    emitToWorkspace(
      req.app.get("io"),
      existing.workspaceId,
      SOCKET_EVENTS.ANNOUNCEMENT_UPDATED,
      announcement,
    );
    res.json({ announcement });
  } catch (err) {
    next(err);
  }
});

// ─── Delete announcement ──────────────────────────────────────────────────────
router.delete("/:announcementId", authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.announcement.findUnique({
      where: { id: req.params.announcementId },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: existing.workspaceId,
          userId: req.user.id,
        },
      },
    });
    const canDelete =
      membership?.role === "ADMIN" || existing.authorId === req.user.id;
    if (!canDelete) return res.status(403).json({ error: "Permission denied" });

    await prisma.announcement.delete({
      where: { id: req.params.announcementId },
    });
    emitToWorkspace(
      req.app.get("io"),
      existing.workspaceId,
      SOCKET_EVENTS.ANNOUNCEMENT_DELETED,
      {
        id: req.params.announcementId,
      },
    );
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
});

// ─── React ────────────────────────────────────────────────────────────────────
router.post("/:announcementId/react", authenticate, async (req, res, next) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ error: "Emoji required" });

    const existing = await prisma.announcement.findUnique({
      where: { id: req.params.announcementId },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });

    // Toggle reaction
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        announcementId_userId_emoji: {
          announcementId: req.params.announcementId,
          userId: req.user.id,
          emoji,
        },
      },
    });

    let reaction;
    if (existingReaction) {
      await prisma.reaction.delete({ where: { id: existingReaction.id } });
      reaction = null;
    } else {
      reaction = await prisma.reaction.create({
        data: {
          announcementId: req.params.announcementId,
          userId: req.user.id,
          emoji,
        },
      });
    }

    const reactions = await prisma.reaction.findMany({
      where: { announcementId: req.params.announcementId },
    });

    emitToWorkspace(
      req.app.get("io"),
      existing.workspaceId,
      SOCKET_EVENTS.REACTION_ADDED,
      {
        announcementId: req.params.announcementId,
        reactions,
      },
    );

    res.json({ reactions });
  } catch (err) {
    next(err);
  }
});

// ─── Comment ──────────────────────────────────────────────────────────────────
router.post(
  "/:announcementId/comments",
  authenticate,
  async (req, res, next) => {
    try {
      const { content } = req.body;
      if (!content?.trim())
        return res.status(400).json({ error: "Content required" });

      const existing = await prisma.announcement.findUnique({
        where: { id: req.params.announcementId },
      });
      if (!existing) return res.status(404).json({ error: "Not found" });

      const comment = await prisma.comment.create({
        data: {
          announcementId: req.params.announcementId,
          userId: req.user.id,
          content,
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      // Handle @mentions
      const mentions = content.match(/@(\w+)/g) || [];
      for (const mention of mentions) {
        const name = mention.slice(1);
        const mentioned = await prisma.user.findFirst({
          where: { name: { contains: name } },
        });
        if (mentioned && mentioned.id !== req.user.id) {
          await prisma.notification.create({
            data: {
              userId: mentioned.id,
              type: "MENTION",
              message: `${req.user.name} mentioned you in a comment`,
              link: `/announcements/${req.params.announcementId}`,
            },
          });

          req.app
            .get("io")
            .to(`user:${mentioned.id}`)
            .emit(SOCKET_EVENTS.NOTIFICATION, {
              type: "MENTION",
              message: `${req.user.name} mentioned you in a comment`,
            });

          // Send mention email
          try {
            await sendMentionEmail({
              toEmail: mentioned.email,
              mentionedByName: req.user.name,
              workspaceName: existing.workspaceId,
              comment: content,
            });
          } catch (emailErr) {
            console.error("Mention email failed:", emailErr.message);
          }
        }
      }

      emitToWorkspace(
        req.app.get("io"),
        existing.workspaceId,
        SOCKET_EVENTS.COMMENT_ADDED,
        {
          announcementId: req.params.announcementId,
          comment,
        },
      );

      res.status(201).json({ comment });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
