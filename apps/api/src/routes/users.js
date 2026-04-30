const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');
const { uploadAvatar } = require('../utils/cloudinary');

const router = express.Router();

// ─── Update profile ───────────────────────────────────────────────────────────
router.put(
  '/profile',
  authenticate,
  [body('name').trim().notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { name } = req.body;
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { name },
        select: { id: true, email: true, name: true, avatarUrl: true },
      });

      res.json({ user });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Upload avatar ────────────────────────────────────────────────────────────
router.post(
  '/avatar',
  authenticate,
  uploadAvatar.single('avatar'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { avatarUrl: req.file.path },
        select: { id: true, email: true, name: true, avatarUrl: true },
      });

      res.json({ user });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
