const express = require('express');
const {
  graphTokenController,
  refreshController,
} = require('~/server/controllers/AuthController');
const {
  regenerateBackupCodes,
  disable2FA,
  confirm2FA,
  enable2FA,
  verify2FA,
} = require('~/server/controllers/TwoFactorController');
const { verify2FAWithTempToken } = require('~/server/controllers/auth/TwoFactorAuthController');
const { logoutController } = require('~/server/controllers/auth/LogoutController');
const {
  requestOtpController,
  verifyOtpController,
} = require('~/server/controllers/auth/OtpController');
const middleware = require('~/server/middleware');

const router = express.Router();

//Local
router.post('/logout', middleware.requireJwtAuth, logoutController);
router.post(
  '/otp/request',
  middleware.logHeaders,
  middleware.loginLimiter,
  middleware.checkBan,
  requestOtpController,
);
router.post(
  '/otp/verify',
  middleware.logHeaders,
  middleware.loginLimiter,
  middleware.checkBan,
  verifyOtpController,
);
router.post('/refresh', refreshController);

router.get('/2fa/enable', middleware.requireJwtAuth, enable2FA);
router.post('/2fa/verify', middleware.requireJwtAuth, verify2FA);
router.post('/2fa/verify-temp', middleware.checkBan, verify2FAWithTempToken);
router.post('/2fa/confirm', middleware.requireJwtAuth, confirm2FA);
router.post('/2fa/disable', middleware.requireJwtAuth, disable2FA);
router.post('/2fa/backup/regenerate', middleware.requireJwtAuth, regenerateBackupCodes);

router.get('/graph-token', middleware.requireJwtAuth, graphTokenController);

module.exports = router;
