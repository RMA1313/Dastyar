const express = require('express');
const { logger } = require('@librechat/data-schemas');
const { requireJwtAuth, checkBan } = require('~/server/middleware');
const checkAdmin = require('~/server/middleware/roles/admin');
const {
  listReferralCodes,
  upsertReferralCode,
  updateReferralCode,
  ensureReferralCodesSeeded,
} = require('~/server/services/ReferralCodeService');

const router = express.Router();

router.use(requireJwtAuth);
router.use(checkBan);
router.use(checkAdmin);

router.get('/', async (_req, res) => {
  try {
    await ensureReferralCodesSeeded();
    const codes = await listReferralCodes();
    return res.status(200).json({ codes });
  } catch (error) {
    logger.error('[referrals] list error', error);
    return res.status(500).json({ message: 'Failed to load referral codes' });
  }
});

router.post('/seed', async (req, res) => {
  try {
    const force = ['true', '1', 'yes'].includes(
      String(req.body?.force ?? req.query?.force ?? '').toLowerCase(),
    );
    await ensureReferralCodesSeeded({ force });
    const codes = await listReferralCodes();
    return res.status(201).json({ codes, seeded: true, force });
  } catch (error) {
    logger.error('[referrals] seed error', error);
    return res.status(500).json({ message: 'Failed to seed referral codes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { code, label, isActive, maxUses } = req.body ?? {};
    const payload = await upsertReferralCode({ code, label, isActive, maxUses });
    return res.status(201).json({ code: payload });
  } catch (error) {
    logger.error('[referrals] create error', error);
    return res.status(400).json({ message: error.message || 'Unable to save referral code' });
  }
});

router.patch('/:code', async (req, res) => {
  try {
    const updated = await updateReferralCode(req.params.code, req.body ?? {});
    if (!updated) {
      return res.status(404).json({ message: 'Referral code not found' });
    }
    return res.status(200).json({ code: updated });
  } catch (error) {
    logger.error('[referrals] update error', error);
    return res.status(400).json({ message: error.message || 'Unable to update referral code' });
  }
});

module.exports = router;
