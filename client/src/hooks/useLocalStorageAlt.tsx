/* `useLocalStorage`
 *
 * Features:
 *  - JSON Serializing
 *  - Also value will be updated everywhere, when value updated (via `storage` event)
 */

import { useEffect, useState, useCallback } from 'react';
import { safeJSON, safeStorage } from '~/utils/safeStorage';

export default function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  globalSetState?: (value: T) => void,
  storageCondition?: (value: T, rawCurrentValue?: string | null) => boolean,
): [T, (value: T) => void] {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const item = safeStorage.getItem(key);

    if (!item && !storageCondition) {
      safeJSON.set(key, defaultValue);
    } else if (!item && storageCondition && storageCondition(defaultValue)) {
      safeJSON.set(key, defaultValue);
    }

    const initialValue = item && item !== 'undefined' ? safeJSON.get(key, defaultValue) : defaultValue;
    setValue(initialValue);
    if (globalSetState) {
      globalSetState(initialValue);
    }

    function handler(e: StorageEvent) {
      if (e.key !== key) {
        return;
      }

      setValue(safeJSON.get(key, defaultValue));
    }

    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('storage', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, globalSetState]);

  const setValueWrap = useCallback(
    (value: T) => {
      try {
        setValue(value);
        const storeLocal = () => {
          safeJSON.set(key, value);
          window?.dispatchEvent(new StorageEvent('storage', { key }));
        };
        if (!storageCondition) {
          storeLocal();
        } else if (storageCondition(value, localStorage.getItem(key))) {
          storeLocal();
        }
        globalSetState?.(value);
      } catch (e) {
        console.error(e);
      }
    },
    [key, globalSetState, storageCondition],
  );

  return [value, setValueWrap];
}
