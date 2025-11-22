/* `useLocalStorage`
 *
 * Features:
 *  - JSON Serializing
 *  - Also value will be updated everywhere, when value updated (via `storage` event)
 */

import { useEffect, useState } from 'react';
import { safeJSON, safeStorage } from '~/utils/safeStorage';

export default function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const item = safeStorage.getItem(key);
    if (!item) {
      safeJSON.set(key, defaultValue);
    }

    setValue(safeJSON.get(key, defaultValue));

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
  }, []);

  const setValueWrap = (value: T) => {
    try {
      setValue(value);

      safeJSON.set(key, value);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new StorageEvent('storage', { key }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return [value, setValueWrap];
}
