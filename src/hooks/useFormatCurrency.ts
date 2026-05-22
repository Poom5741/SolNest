import { useCallback } from 'react';
import type { Language } from '../types';

export function useFormatCurrency(lang: Language, decimals?: number) {
  return useCallback(
    (n: number) =>
      n.toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', {
        ...(decimals !== undefined && {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }),
      }),
    [lang, decimals]
  );
}
