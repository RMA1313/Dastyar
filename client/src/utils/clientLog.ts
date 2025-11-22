import logger from './logger';

type LogMeta = Record<string, unknown> | undefined;

const logWith = (
  level: keyof typeof logger,
  tag: string,
  message: string,
  meta?: LogMeta,
) => {
  if (meta) {
    logger[level](tag, message, meta);
  } else {
    logger[level](tag, message);
  }
};

export const logOtpEvent = (action: string, meta?: LogMeta) =>
  logWith('info', 'Dastyar:OTP', action, meta);

export const logReferralEvent = (action: string, meta?: LogMeta) =>
  logWith('info', 'Dastyar:Referral', action, meta);

export const logThemeEvent = (action: string, meta?: LogMeta) =>
  logWith('info', 'Dastyar:Theme', action, meta);

export const logUiError = (action: string, meta?: LogMeta) =>
  logWith('error', 'Dastyar:UI', action, meta);

