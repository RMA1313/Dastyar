import { atomFamily, atomWithStorage, createJSONStorage } from 'jotai/utils';
import { Constants, LocalStorageKeys } from 'librechat-data-provider';
import { createSafeStorageAdapter } from '~/utils/safeStorage';

const safeStorage = createJSONStorage(() => createSafeStorageAdapter());

/**
 * Creates a storage atom for MCP values per conversation
 * Uses atomFamily to create unique atoms for each conversation ID
 */
export const mcpValuesAtomFamily = atomFamily((conversationId: string | null) => {
  const key = conversationId ?? Constants.NEW_CONVO;
  const storageKey = `${LocalStorageKeys.LAST_MCP_}${key}`;

  return atomWithStorage<string[]>(storageKey, [], safeStorage, { getOnInit: true });
});

/**
 * Global storage atom for MCP pinned state (shared across all conversations)
 */
export const mcpPinnedAtom = atomWithStorage<boolean>(LocalStorageKeys.PIN_MCP_, true, safeStorage, {
  getOnInit: true,
});
