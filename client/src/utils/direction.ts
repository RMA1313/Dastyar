const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
const ltrRegex = /[A-Za-z]/;

export type TextDirection = 'rtl' | 'ltr';

/**
 * Detects text direction based on the presence of RTL characters (Arabic/Persian)
 * or the first detected Latin character.
 */
export const detectTextDirection = (text: string): TextDirection => {
  if (!text) {
    return 'ltr';
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 'ltr';
  }

  if (rtlRegex.test(trimmed)) {
    return 'rtl';
  }

  const firstStrong = trimmed.match(/[A-Za-z\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/)?.[0];
  if (firstStrong && ltrRegex.test(firstStrong)) {
    return 'ltr';
  }

  return 'ltr';
};
