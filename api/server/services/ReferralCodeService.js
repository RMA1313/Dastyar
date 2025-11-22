const crypto = require('crypto');
const { logger } = require('@librechat/data-schemas');
const ReferralCode = require('~/server/models/ReferralCode');

const DEFAULT_SEED_COUNT = 110;
const REFERRAL_CODES_RESEED_FLAG =
  ['true', '1', 'yes'].includes(String(process.env.REFERRAL_CODES_FORCE_RESEED || '').toLowerCase());

const normalizeCode = (code = '') => String(code || '').trim().replace(/[^a-z0-9]/gi, '').toUpperCase();

const buildSignature = (codes = []) =>
  crypto.createHash('sha256').update(JSON.stringify([...codes].sort())).digest('hex');

const parseReferralCodesFromEnv = () => {
  const raw = process.env.REFERRAL_CODES;
  if (!raw) {
    throw new Error('REFERRAL_CODES is required and must be a JSON array of referral codes.');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error('REFERRAL_CODES must be valid JSON (e.g. ["CODE1","CODE2"]).');
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('REFERRAL_CODES must be a non-empty JSON array of referral codes.');
  }

  const cleaned = parsed.map(normalizeCode).filter(Boolean);
  const unique = [...new Set(cleaned)];

  if (unique.length === 0) {
    throw new Error('REFERRAL_CODES contains no valid codes after normalization.');
  }

  if (unique.length !== DEFAULT_SEED_COUNT) {
    logger.warn(
      `[ReferralCodeService] Expected ${DEFAULT_SEED_COUNT} referral codes, found ${unique.length}. Proceeding with available codes.`,
    );
  }

  return unique;
};

let seeded = false;
let lastSeedSignature = null;
let seedPromise = null;

const hasInvalidStoredCodes = (existingRaw = [], normalized = []) =>
  existingRaw.some((code, idx) => {
    const cleaned = normalized[idx];
    return !cleaned || code !== cleaned;
  });

const shouldReseed = ({
  envCodes,
  envSignature,
  existingCodes,
  existingRawCodes,
  forceReseed,
}) => {
  if (forceReseed) {
    return true;
  }
  if (existingCodes.length !== envCodes.length) {
    return true;
  }
  if (hasInvalidStoredCodes(existingRawCodes, existingCodes)) {
    return true;
  }
  const existingSignature = buildSignature(existingCodes);
  return envSignature !== existingSignature;
};

const seedCodes = async (codes) => {
  await ReferralCode.deleteMany({});
  const docs = codes.map((code) => ({
    code,
    label: 'Pre-seeded code',
    isActive: true,
    maxUses: 0,
    usageCount: 0,
  }));

  await ReferralCode.insertMany(docs, { ordered: false });
  return docs.length;
};

async function ensureReferralCodesSeeded(options = {}) {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    const envCodes = parseReferralCodesFromEnv();
    const envSignature = buildSignature(envCodes);
    const forceReseed = options.force === true || REFERRAL_CODES_RESEED_FLAG;

    if (seeded && !forceReseed && lastSeedSignature === envSignature) {
      return;
    }

    const existing = await ReferralCode.find({}, { code: 1, isActive: 1 }).lean();
    const existingRawCodes = existing.map((doc) => doc.code ?? '');
    const existingCodes = existingRawCodes.map((code) => normalizeCode(code));

    if (
      !shouldReseed({
        envCodes,
        envSignature,
        existingCodes,
        existingRawCodes,
        forceReseed,
      })
    ) {
      seeded = true;
      lastSeedSignature = envSignature;
      return;
    }

    const insertedCount = await seedCodes(envCodes);
    seeded = true;
    lastSeedSignature = envSignature;
    logger.info(
      `[ReferralCodeService] Seeded ${insertedCount} referral codes from env (forceReseed=${forceReseed}).`,
    );
  })();

  try {
    await seedPromise;
  } finally {
    seedPromise = null;
  }
}

async function validateReferralCode(code) {
  const normalized = normalizeCode(code);
  if (!normalized) {
    return null;
  }
  await ensureReferralCodesSeeded();
  const record = await ReferralCode.findOne({ code: normalized })
    .collation({ locale: 'en', strength: 2 })
    .lean();
  if (!record) {
    return null;
  }

  const { isActive, maxUses, usageCount } = record;
  if (!isActive) {
    return null;
  }

  if (maxUses > 0 && usageCount >= maxUses) {
    return null;
  }

  return record;
}

async function recordReferralUsage(code) {
  const normalized = normalizeCode(code);
  if (!normalized) {
    return null;
  }
  return ReferralCode.findOneAndUpdate(
    { code: normalized },
    { $inc: { usageCount: 1 } },
    { new: true, collation: { locale: 'en', strength: 2 } },
  ).lean();
}

async function listReferralCodes() {
  await ensureReferralCodesSeeded();
  return ReferralCode.find().sort({ createdAt: -1 }).lean();
}

async function upsertReferralCode(payload) {
  const { code, label, isActive, maxUses } = payload;
  const normalized = normalizeCode(code);
  if (!normalized) {
    throw new Error('Referral code is required');
  }
  return ReferralCode.findOneAndUpdate(
    { code: normalized },
    {
      $set: {
        code: normalized,
        label: label ?? '',
        isActive: typeof isActive === 'boolean' ? isActive : true,
        maxUses: typeof maxUses === 'number' ? maxUses : 0,
      },
    },
    { upsert: true, new: true, collation: { locale: 'en', strength: 2 } },
  ).lean();
}

async function updateReferralCode(code, payload) {
  const normalized = normalizeCode(code);
  return ReferralCode.findOneAndUpdate(
    { code: normalized },
    {
      $set: {
        ...(payload.label !== undefined ? { label: payload.label } : {}),
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
        ...(payload.maxUses !== undefined ? { maxUses: payload.maxUses } : {}),
        ...(payload.metadata ? { metadata: payload.metadata } : {}),
      },
    },
    { new: true, collation: { locale: 'en', strength: 2 } },
  ).lean();
}

module.exports = {
  ensureReferralCodesSeeded,
  validateReferralCode,
  recordReferralUsage,
  listReferralCodes,
  upsertReferralCode,
  updateReferralCode,
  normalizeCode,
  parseReferralCodesFromEnv,
  buildSignature,
  DEFAULT_SEED_COUNT,
  REFERRAL_CODES_RESEED_FLAG,
};
