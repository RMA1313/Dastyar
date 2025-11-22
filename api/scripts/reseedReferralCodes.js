#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
require('module-alias')({ base: path.resolve(__dirname, '..') });

const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');
const { connectDb } = require('../db');
const ReferralCode = require('../server/models/ReferralCode');
const { parseReferralCodesFromEnv, normalizeCode, DEFAULT_SEED_COUNT } = require('../server/services/ReferralCodeService');

const reseed = async () => {
  await connectDb();

  const envCodes = parseReferralCodesFromEnv();
  if (envCodes.length !== DEFAULT_SEED_COUNT) {
    throw new Error(
      `Expected ${DEFAULT_SEED_COUNT} referral codes from REFERRAL_CODES. Found ${envCodes.length}. Update .env before reseeding.`,
    );
  }

  const docs = envCodes.map((code) => ({
    code: normalizeCode(code),
    label: 'Pre-seeded code',
    isActive: true,
    maxUses: 0,
    usageCount: 0,
  }));

  await ReferralCode.deleteMany({});
  const inserted = await ReferralCode.insertMany(docs, { ordered: false });
  const count = await ReferralCode.countDocuments();

  if (count !== envCodes.length) {
    throw new Error(
      `Referral code reseed incomplete. Expected to insert ${envCodes.length}, found ${count} in collection.`,
    );
  }

  logger.info(`[Migration] Reseeded referral_codes with ${inserted.length} codes.`);
};

reseed()
  .then(() => mongoose.connection.close())
  .catch((error) => {
    logger.error('[Migration] Failed to reseed referral_codes', error);
    mongoose.connection.close().finally(() => process.exit(1));
  });
