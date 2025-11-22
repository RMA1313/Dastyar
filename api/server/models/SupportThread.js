const mongoose = require('mongoose');

const SupportMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const SupportThreadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    referralCode: {
      type: String,
      default: null,
    },
    messages: {
      type: [SupportMessageSchema],
      default: [],
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

SupportThreadSchema.index({ user: 1, status: 1 });

module.exports =
  mongoose.models.SupportThread ||
  mongoose.model('SupportThread', SupportThreadSchema, 'support_threads');
