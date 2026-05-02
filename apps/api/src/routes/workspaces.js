const express = require("express");
const { body, validationResult } = require("express-validator");
const { prisma } = require("../utils/prisma");
const {
  authenticate,
  requireMember,
  requirePermission,
} = require("../middleware/auth");
const { sendInvitationEmail } = require("../utils/email");
const { PERMISSIONS } = require("../utils/constants");

const router = express.Router();

// ─── List my workspaces ───────────────────────────────────────────────────────
router.get("/", authenticate, async (req, res, next) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.user.id },
      include: {
        workspace: {
          include: {
            _count: { select: { members: true, goals: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const workspaces = memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));

    res.json({ workspaces });
  } catch (err) {
    next(err);
  }
});

// ─── Create workspace ─────────────────────────────────────────────────────────
router.post(
  "/",
  authenticate,
  [body("name").trim().notEmpty(), body("accentColor").optional().isHexColor()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { name, description, accentColor } = req.body;

      const workspace = await prisma.workspace.create({
        data: {
          name,
          description,
          accentColor: accentColor || "#6366f1",
          members: {
            create: { userId: req.user.id, role: "ADMIN" },
          },
        },
        include: {
          _count: { select: { members: true, goals: true } },
        },
      });

      res.status(201).json({ workspace: { ...workspace, role: "ADMIN" } });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Get single workspace ─────────────────────────────────────────────────────
router.get(
  "/:workspaceId",
  authenticate,
  requireMember,
  async (req, res, next) => {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id: req.workspaceId },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
          },
          _count: {
            select: { goals: true, actionItems: true, announcements: true },
          },
        },
      });

      res.json({ workspace: { ...workspace, role: req.membership.role } });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Update workspace ─────────────────────────────────────────────────────────
router.put(
  "/:workspaceId",
  authenticate,
  requirePermission(PERMISSIONS.EDIT_WORKSPACE),
  async (req, res, next) => {
    try {
      const { name, description, accentColor } = req.body;
      const workspace = await prisma.workspace.update({
        where: { id: req.workspaceId },
        data: { name, description, accentColor },
      });
      res.json({ workspace });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Invite member ────────────────────────────────────────────────────────────
router.post(
  "/:workspaceId/invite",
  authenticate,
  requirePermission(PERMISSIONS.INVITE_MEMBER),
  [body("email").isEmail().normalizeEmail()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { email, role = "MEMBER" } = req.body;

      // Check if user already a member
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        const isMember = await prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: req.workspaceId,
              userId: existing.id,
            },
          },
        });
        if (isMember) {
          return res.status(409).json({ error: "User is already a member" });
        }

        // Add directly if user exists
        const membership = await prisma.workspaceMember.create({
          data: { workspaceId: req.workspaceId, userId: existing.id, role },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        });

        try {
          const workspace = await prisma.workspace.findUnique({
            where: { id: req.workspaceId },
          });
          await sendInvitationEmail({
            toEmail: email,
            workspaceName: workspace.name,
            inviterName: req.user.name,
            role,
          });
        } catch (emailErr) {
          console.error("Email send failed:", emailErr.message);
        }

        return res.json({ member: membership });
      }

      // Create invitation
      const invitation = await prisma.invitation.create({
        data: {
          workspaceId: req.workspaceId,
          email,
          role,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      res.json({ invitation, message: "Invitation created" });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Update member role ───────────────────────────────────────────────────────
router.put(
  "/:workspaceId/members/:userId/role",
  authenticate,
  requirePermission(PERMISSIONS.CHANGE_ROLE),
  async (req, res, next) => {
    try {
      const { role } = req.body;
      if (!["ADMIN", "MEMBER"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const membership = await prisma.workspaceMember.update({
        where: {
          workspaceId_userId: {
            workspaceId: req.workspaceId,
            userId: req.params.userId,
          },
        },
        data: { role },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      res.json({ member: membership });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Remove member ────────────────────────────────────────────────────────────
router.delete(
  "/:workspaceId/members/:userId",
  authenticate,
  requirePermission(PERMISSIONS.REMOVE_MEMBER),
  async (req, res, next) => {
    try {
      await prisma.workspaceMember.delete({
        where: {
          workspaceId_userId: {
            workspaceId: req.workspaceId,
            userId: req.params.userId,
          },
        },
      });

      res.json({ message: "Member removed" });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Export workspace CSV ─────────────────────────────────────────────────────
router.get(
  "/:workspaceId/export",
  authenticate,
  requirePermission(PERMISSIONS.EXPORT_DATA),
  async (req, res, next) => {
    try {
      const [goals, actionItems] = await Promise.all([
        prisma.goal.findMany({
          where: { workspaceId: req.workspaceId },
          include: { owner: { select: { name: true } } },
        }),
        prisma.actionItem.findMany({
          where: { workspaceId: req.workspaceId },
          include: { assignee: { select: { name: true } } },
        }),
      ]);

      const goalsCSV = [
        "Type,Title,Owner,Status,Due Date",
        ...goals.map(
          (g) =>
            `Goal,"${g.title}","${g.owner.name}",${g.status},${g.dueDate ? g.dueDate.toISOString().split("T")[0] : ""}`,
        ),
        ...actionItems.map(
          (a) =>
            `ActionItem,"${a.title}","${a.assignee?.name || "Unassigned"}",${a.status},${a.dueDate ? a.dueDate.toISOString().split("T")[0] : ""}`,
        ),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=workspace-export.csv",
      );
      res.send(goalsCSV);
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
