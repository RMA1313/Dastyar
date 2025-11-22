import { LocalStorageKeys, TConversation, isUUID } from 'librechat-data-provider';
import { safeJSON, safeStorage } from './safeStorage';

export function getLocalStorageItems() {
  const lastSelectedModel = safeJSON.get<Record<string, string | undefined> | null>(
    LocalStorageKeys.LAST_MODEL,
    {},
  );
  const lastSelectedTools = safeJSON.get<string[] | null>(LocalStorageKeys.LAST_TOOLS, []);
  const lastConversationSetup = safeJSON.get<Partial<TConversation> | null>(
    `${LocalStorageKeys.LAST_CONVO_SETUP}_0`,
    {},
  );

  return {
    lastSelectedModel,
    lastSelectedTools,
    lastConversationSetup,
  };
}

export function clearLocalStorage(skipFirst?: boolean) {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (skipFirst === true && key.endsWith('0')) {
        return;
      }
      if (
        key.startsWith(LocalStorageKeys.LAST_MCP_) ||
        key.startsWith(LocalStorageKeys.LAST_CODE_TOGGLE_) ||
        key.startsWith(LocalStorageKeys.ASST_ID_PREFIX) ||
        key.startsWith(LocalStorageKeys.AGENT_ID_PREFIX) ||
        key.startsWith(LocalStorageKeys.LAST_CONVO_SETUP) ||
        key === LocalStorageKeys.LAST_SPEC ||
        key === LocalStorageKeys.LAST_TOOLS ||
        key === LocalStorageKeys.LAST_MODEL ||
        key === LocalStorageKeys.FILES_TO_DELETE
      ) {
        safeStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('[storage] clearLocalStorage failed', error);
  }
}

export function clearConversationStorage(conversationId?: string | null) {
  if (!conversationId) {
    return;
  }
  if (!isUUID.safeParse(conversationId)?.success) {
    console.warn(
      `Conversation ID ${conversationId} is not a valid UUID. Skipping local storage cleanup.`,
    );
    return;
  }
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.includes(conversationId)) {
        safeStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('[storage] clearConversationStorage failed', error);
  }
}
export function clearAllConversationStorage() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (
        key.startsWith(LocalStorageKeys.LAST_MCP_) ||
        key.startsWith(LocalStorageKeys.LAST_CODE_TOGGLE_) ||
        key.startsWith(LocalStorageKeys.TEXT_DRAFT) ||
        key.startsWith(LocalStorageKeys.ASST_ID_PREFIX) ||
        key.startsWith(LocalStorageKeys.AGENT_ID_PREFIX) ||
        key.startsWith(LocalStorageKeys.LAST_CONVO_SETUP)
      ) {
        safeStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('[storage] clearAllConversationStorage failed', error);
  }
}
