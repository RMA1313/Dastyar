const express = require('express');
const request = require('supertest');

jest.mock('~/server/middleware', () => ({
  requireJwtAuth: (_req, _res, next) => next(),
  checkBan: (_req, _res, next) => next(),
}));

jest.mock('~/server/middleware/roles/admin', () => (_req, _res, next) => next());

jest.mock('~/server/utils/sendEmail', () => jest.fn().mockResolvedValue());
const sendEmail = require('~/server/utils/sendEmail');

jest.mock('~/models', () => ({
  getUserById: jest.fn(),
}));
const { getUserById } = require('~/models');

const mockThreads = [];
jest.mock('~/server/models/SupportThread', () => {
  const { Types } = require('mongoose');

  const wrapThread = (thread) => ({
    ...thread,
    save: async () => {
      const idx = mockThreads.findIndex((t) => t._id.toString() === thread._id.toString());
      if (idx >= 0) {
        mockThreads[idx] = { ...thread };
      }
      return thread;
    },
  });

  return {
    findOne: jest.fn((query) => {
      const queryUser = query.user ? query.user.toString() : undefined;
      const match = mockThreads
        .filter(
          (t) =>
            (t.user?.toString?.() ?? t.user) === queryUser &&
            (!query.status || t.status === query.status),
        )
        .sort((a, b) => b.updatedAt - a.updatedAt)[0];

      const promise = Promise.resolve(match ? wrapThread(match) : null);
      promise.sort = () => ({
        lean: async () => (match ? { ...match, _id: match._id } : null),
      });
      promise.lean = async () => (match ? { ...match, _id: match._id } : null);
      return promise;
    }),
    find: jest.fn(() => ({
      populate: () => ({
        sort: () => ({
          lean: async () => mockThreads.map((t) => ({ ...t, _id: t._id })),
        }),
      }),
    })),
    create: jest.fn(async (payload) => {
      const thread = {
        _id: new Types.ObjectId(),
        status: 'open',
        lastActivityAt: payload.lastActivityAt ?? new Date(),
        updatedAt: payload.lastActivityAt ?? new Date(),
        ...payload,
        messages: payload.messages || [],
      };
      mockThreads.push(thread);
      return wrapThread(thread);
    }),
    findById: jest.fn(async (id) => {
      const found = mockThreads.find((t) => t._id.toString() === id.toString());
      return found ? wrapThread(found) : null;
    }),
    __reset: () => {
      mockThreads.splice(0, mockThreads.length);
    },
    __get: () => mockThreads,
  };
});

const SupportThread = require('~/server/models/SupportThread');
const router = require('./support');

describe('Support routes', () => {
  let app;
  let userId;

  beforeAll(async () => {
    const { Types } = require('mongoose');
    userId = new Types.ObjectId();
    app = express();
    app.use(express.json());

    app.use((req, _res, next) => {
      req.user = { id: userId.toString(), role: 'user' };
      next();
    });

    app.use('/api/support', router);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    SupportThread.__reset?.();
    getUserById.mockResolvedValue({ phone: '12345678901', referralCodeUsed: 'REFUSED' });
    process.env.SUPPORT_ADMIN_EMAIL = 'admin@example.com';
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });

  it('returns null thread when no history exists', async () => {
    const res = await request(app).get('/api/support');

    expect(res.status).toBe(200);
    expect(res.body.thread).toBeNull();
  });

  it('creates a support thread and echoes the first message', async () => {
    const res = await request(app).post('/api/support').send({ message: 'Need assistance' });

    expect(res.status).toBe(201);
    expect(res.body.thread.messages).toHaveLength(1);
    expect(res.body.thread.referralCode).toBe('REFUSED');
    expect(res.body.thread.messages[0].text).toBe('Need assistance');

    const stored = await SupportThread.findOne({ user: userId }).lean();
    expect(stored).toBeTruthy();
    expect(stored.messages[0].text).toBe('Need assistance');
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@example.com',
        subject: expect.any(String),
      }),
    );
  });

  it('rejects empty messages', async () => {
    const res = await request(app).post('/api/support').send({ message: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('returns the latest thread when it exists', async () => {
    const thread = await SupportThread.create({
      user: userId,
      messages: [{ sender: 'user', text: 'Existing help', createdAt: new Date() }],
      status: 'open',
      referralCode: 'RCODE',
      lastActivityAt: new Date(Date.now() - 1_000),
    });

    const res = await request(app).get('/api/support');

    expect(res.status).toBe(200);
    expect(res.body.thread.id).toBe(thread._id.toString());
    expect(res.body.thread.messages).toHaveLength(1);
    expect(res.body.thread.referralCode).toBe('RCODE');
  });
});
