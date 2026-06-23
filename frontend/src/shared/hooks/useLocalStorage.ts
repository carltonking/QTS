import { useCallback, useEffect, useState } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  parse?: (raw: T) => T,
) {
  const [value, setValue] = useState<T>(() => {
    const stored = window.localStorage.getItem(key);

    if (!stored) {
      return initialValue;
    }

    try {
      const parsed = JSON.parse(stored) as T;
      return parse ? parse(parsed) : parsed;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  const remove = useCallback(() => {
    window.localStorage.removeItem(key);
    setValue(initialValue);
  }, [key, initialValue]);

  return [value, setValue, remove] as const;
}
