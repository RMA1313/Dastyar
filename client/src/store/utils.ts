import { atom } from 'recoil';
import { safeJSON } from '~/utils/safeStorage';

// Improved helper function to create atoms with localStorage
export function atomWithLocalStorage<T>(key: string, defaultValue: T) {
  return atom<T>({
    key,
    default: defaultValue,
    effects_UNSTABLE: [
      ({ setSelf, onSet }) => {
        const savedValue = safeJSON.get<T>(key, defaultValue);
        if (savedValue !== null) {
          setSelf(savedValue);
        }

        onSet((newValue: T) => {
          safeJSON.set(key, newValue);
        });
      },
    ],
  });
}
