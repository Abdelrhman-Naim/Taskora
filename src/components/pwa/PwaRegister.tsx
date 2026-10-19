'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './PwaRegister.module.css';

function subscribeOnlineStatus(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function PwaRegister(): React.ReactElement | null {
  const { t } = useI18n();
  const isOffline = useSyncExternalStore(
    subscribeOnlineStatus,
    () => !navigator.onLine,
    () => false
  );

  useEffect(() => {
    // Service Worker registration in production (P-513)
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((err) => console.warn('PWA service worker registration failed:', err));
      });
    }
  }, []);

  if (!isOffline) return null;

  return (
    <div className={styles.offlineBanner} role="status" aria-live="polite">
      <span>{t('error.network') || 'You are currently offline. Check your internet connection.'}</span>
    </div>
  );
}
