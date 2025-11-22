const axios = require('axios');
const { logger } = require('@librechat/data-schemas');

const KAVENEGAR_BASE = 'https://api.kavenegar.com/v1';

const getConfig = () => {
  const apiKey = process.env.KAVENEGAR_API_KEY;
  const template = process.env.KAVENEGAR_TEMPLATE;
  if (!apiKey || !template) {
    throw new Error('Kavenegar API key or template is not configured');
  }

  return { apiKey, template };
};

const sendVerifyLookup = async ({ receptor, token, token2, token3 }) => {
  const { apiKey, template } = getConfig();

  const url = `${KAVENEGAR_BASE}/${apiKey}/verify/lookup.json`;
  try {
    await axios.post(url, null, {
      params: {
        receptor,
        token,
        token2,
        token3,
        template,
      },
      timeout: 5000,
    });
    logger.info(`[Kavenegar] OTP sent to ${receptor} using template ${template}`);
    return { success: true };
  } catch (error) {
    logger.error('[Kavenegar] Failed to send OTP', error?.response?.data || error?.message || error);
    throw new Error('Failed to dispatch OTP via SMS provider');
  }
};

module.exports = {
  sendVerifyLookup,
};
