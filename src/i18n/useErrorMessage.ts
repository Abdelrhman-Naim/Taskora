import { useI18n } from './I18nProvider';
import { AppError } from '@/lib/errors';
import { MessageKey } from './en';

/**
 * Hook to translate any error into a localized, user-safe error message.
 * Never exposes raw err.message or stack trace in the UI.
 */
export function useErrorMessage(): (err: unknown) => string {
  const { t } = useI18n();

  return (err: unknown): string => {
    if (err instanceof AppError) {
      const key = `error.${err.code}` as MessageKey;
      const translated = t(key);
      if (translated !== key) {
        return translated;
      }
    }

    return t('error.unknown');
  };
}
