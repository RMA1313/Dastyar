const mongoose = require('mongoose');

const ReferralCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    label: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    maxUses: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  { timestamps: true },
);

ReferralCodeSchema.index({ code: 1 });

module.exports =
  mongoose.models.ReferralCode || mongoose.model('ReferralCode', ReferralCodeSchema, 'referral_codes');
