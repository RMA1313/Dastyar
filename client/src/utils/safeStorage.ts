import { LocalStorageKeys } from 'librechat-data-provider';

const STORAGE_VERSION_KEY = 'app:storage-version';
export const STORAGE_VERSION = '2';
const MAX_ENTRY_LENGTH = 120_000;

const isQuotaError = (error: unknown) =>
  error instanceof DOMException &&
  (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014);

const debug = (message: string, meta?: Record<string, unknown>) => {
  // Minimal debug helper to avoid noisy console logs
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[storage] ${message}`, meta);
  }
};

export const safeStorage = {
  getItem(key: string) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`[storage] read failed for ${key}`, error);
      return null;
    }
  },
  setItem(key: string, value: string) {
    if (value?.length > MAX_ENTRY_LENGTH) {
      console.warn(`[storage] value too large for ${key}, skipping write`);
      return false;
    }

    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (isQuotaError(error)) {
        console.warn(`[storage] quota exceeded for ${key}, clearing that key`, error);
        try {
          localStorage.removeItem(key);
        } catch (removeError) {
          console.warn(`[storage] failed to clear key after quota error: ${key}`, removeError);
        }
      } else {
        console.warn(`[storage] write failed for ${key}`, error);
      }
      return false;
    }
  },
  removeItem(key: string) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`[storage] remove failed for ${key}`, error);
      return false;
    }
  },
};

export const safeJSON = {
  get<T>(key: string, fallback: T): T {
    const raw = safeStorage.getItem(key);
    if (raw == null) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(raw) as T;
      return parsed ?? fallback;
    } catch (error) {
      console.warn(`[storage] corrupted JSON for ${key}, resetting`, error);
      safeStorage.removeItem(key);
      return fallback;
    }
  },
  set<T>(key: string, value: T) {
    return safeStorage.setItem(key, JSON.stringify(value));
  },
};

export const ensureStorageVersion = () => {
  try {
    const currentVersion = safeStorage.getItem(STORAGE_VERSION_KEY);
    if (currentVersion === STORAGE_VERSION) {
      return;
    }

    const keys = Object.keys(localStorage);
    const resettablePrefixes = [
      LocalStorageKeys.LAST_MCP_,
      LocalStorageKeys.LAST_CODE_TOGGLE_,
      LocalStorageKeys.TEXT_DRAFT,
      LocalStorageKeys.ASST_ID_PREFIX,
      LocalStorageKeys.AGENT_ID_PREFIX,
      LocalStorageKeys.LAST_CONVO_SETUP,
    ];
    const resettableSingles = [
      LocalStorageKeys.LAST_SPEC,
      LocalStorageKeys.LAST_TOOLS,
      LocalStorageKeys.LAST_MODEL,
      LocalStorageKeys.FILES_TO_DELETE,
    ];

    keys.forEach((key) => {
      if (resettableSingles.includes(key) || resettablePrefixes.some((prefix) => key.startsWith(prefix))) {
        safeStorage.removeItem(key);
      }
    });

    safeStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
    debug('storage version updated', { from: currentVersion, to: STORAGE_VERSION });
  } catch (error) {
    console.warn('[storage] version check failed', error);
  }
};

export const createSafeStorageAdapter = () => ({
  getItem: (key: string) => safeStorage.getItem(key),
  setItem: (key: string, value: string) => safeStorage.setItem(key, value),
  removeItem: (key: string) => safeStorage.removeItem(key),
});

export const installStorageGuards = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  // Avoid double patching in Fast Refresh
  if ((window as unknown as { __storageGuardInstalled?: boolean }).__storageGuardInstalled) {
    return;
  }
  (window as unknown as { __storageGuardInstalled?: boolean }).__storageGuardInstalled = true;

  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.setItem = function setItemPatched(key: string, value: string) {
    if (value?.length > MAX_ENTRY_LENGTH) {
      console.warn(`[storage] value too large for ${key}, skipping write`);
      return;
    }
    try {
      originalSetItem.call(this, key, value);
    } catch (error) {
      if (isQuotaError(error)) {
        console.warn(`[storage] quota exceeded for ${key}, clearing that key`, error);
        try {
          originalRemoveItem.call(this, key);
        } catch (removeError) {
          console.warn(`[storage] failed to clear key after quota error: ${key}`, removeError);
        }
      } else {
        console.warn(`[storage] write failed for ${key}`, error);
      }
    }
  };

  Storage.prototype.removeItem = function removeItemPatched(key: string) {
    try {
      originalRemoveItem.call(this, key);
    } catch (error) {
      console.warn(`[storage] remove failed for ${key}`, error);
    }
  };
};
