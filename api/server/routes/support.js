const express = require('express');
const { logger } = require('@librechat/data-schemas');
const { requireJwtAuth, checkBan } = require('~/server/middleware');
const checkAdmin = require('~/server/middleware/roles/admin');
const SupportThread = require('~/server/models/SupportThread');
const { getUserById } = require('~/models');
const sendEmail = require('~/server/utils/sendEmail');

const router = express.Router();

const buildThreadResponse = (thread) => ({
  id: thread?._id?.toString(),
  status: thread?.status,
  lastActivityAt: thread?.lastActivityAt,
  messages: thread?.messages ?? [],
  referralCode: thread?.referralCode ?? null,
});

router.use(requireJwtAuth);
router.use(checkBan);

router.get('/', async (req, res) => {
  try {
    const thread = await SupportThread.findOne({ user: req.user.id }).sort({ updatedAt: -1 }).lean();
    return res.status(200).json({ thread: thread ? buildThreadResponse(thread) : null });
  } catch (error) {
    logger.error('[support] failed to fetch thread', error);
    return res.status(500).json({ message: 'مشکل در دریافت پیام‌های پشتیبانی' });
  }
});

router.post('/', async (req, res) => {
  const { message } = req.body ?? {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ message: 'متن پیام الزامی است.' });
  }

  try {
    const user = await getUserById(req.user.id, 'phone referralCodeUsed');
    const now = new Date();
    let thread = await SupportThread.findOne({ user: req.user.id, status: 'open' });

    if (!thread) {
      thread = await SupportThread.create({
        user: req.user.id,
        referralCode: user?.referralCodeUsed ?? null,
        messages: [{ sender: 'user', text: message.trim(), createdAt: now }],
        lastActivityAt: now,
      });

      const adminEmail = process.env.SUPPORT_ADMIN_EMAIL || process.env.EMAIL_FROM;
      if (adminEmail) {
        sendEmail({
          email: adminEmail,
          subject: 'گفتگو جدید پشتیبانی',
          payload: {
            name: 'Admin',
            phone: user?.phone ?? '',
            message: message.trim(),
            userId: req.user.id,
          },
          template: 'supportAlert.handlebars',
          throwError: false,
        }).catch((err) => logger.warn('[support] email notify failed', err));
      }
    } else {
      thread.messages.push({ sender: 'user', text: message.trim(), createdAt: now });
      thread.lastActivityAt = now;
      await thread.save();
    }

    return res.status(201).json({ thread: buildThreadResponse(thread) });
  } catch (error) {
    logger.error('[support] failed to post message', error);
    return res.status(500).json({ message: 'امکان ارسال پیام پشتیبانی وجود ندارد.' });
  }
});

router.get('/all', checkAdmin, async (_req, res) => {
  try {
    const threads = await SupportThread.find({})
      .populate('user', 'phone referralCode referralCodeUsed updatedAt')
      .sort({ lastActivityAt: -1 })
      .lean();

    return res.status(200).json({
      threads: threads.map((thread) => ({
        ...buildThreadResponse(thread),
        user: thread.user,
      })),
    });
  } catch (error) {
    logger.error('[support] admin list failed', error);
    return res.status(500).json({ message: 'بارگذاری گفتگوهای پشتیبانی ناموفق بود.' });
  }
});

router.post('/:id/admin-reply', checkAdmin, async (req, res) => {
  const { message } = req.body ?? {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ message: 'متن پاسخ الزامی است.' });
  }

  try {
    const thread = await SupportThread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ message: 'گفتگو پیدا نشد.' });
    }

    thread.messages.push({ sender: 'admin', text: message.trim(), createdAt: new Date() });
    thread.lastActivityAt = new Date();
    await thread.save();

    return res.status(200).json({ thread: buildThreadResponse(thread) });
  } catch (error) {
    logger.error('[support] admin reply failed', error);
    return res.status(500).json({ message: 'ثبت پاسخ ناموفق بود.' });
  }
});

module.exports = router;
