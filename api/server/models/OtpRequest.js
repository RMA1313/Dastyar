const mongoose = require('mongoose');

const OtpRequestSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['login', 'register'],
      required: true,
    },
    codeHash: {
      type: String,
      required: true,
      select: false,
    },
    referralCode: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    consumed: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

OtpRequestSchema.index({ phone: 1, purpose: 1 }, { unique: true });
OtpRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports =
  mongoose.models.OtpRequest || mongoose.model('OtpRequest', OtpRequestSchema, 'otp_requests');
