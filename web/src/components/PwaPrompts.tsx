'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, RefreshCw, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIos() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    ('standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

/** Install banner + SW update prompt for mobile PWA users. */
export function PwaPrompts() {
  const t = useTranslations('pwa');
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [showIosTip, setShowIosTip] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [dismissedInstall, setDismissedInstall] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBip);

    if (isIos()) {
      const key = 'autovia.pwa.iosTip';
      if (!sessionStorage.getItem(key)) setShowIosTip(true);
    }

    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.ready.then((reg) => {
        if (reg.active && !navigator.serviceWorker.controller) {
          setOfflineReady(true);
        }
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (
              worker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              setNeedRefresh(true);
            }
          });
        });
      });

      let refreshing = false;
      const onControllerChange = () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        onControllerChange,
      );

      return () => {
        window.removeEventListener('beforeinstallprompt', onBip);
        navigator.serviceWorker.removeEventListener(
          'controllerchange',
          onControllerChange,
        );
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const refresh = async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    setNeedRefresh(false);
  };

  const dismissIos = () => {
    sessionStorage.setItem('autovia.pwa.iosTip', '1');
    setShowIosTip(false);
  };

  if (needRefresh) {
    return (
      <div className="pwa-banner" role="status" aria-live="polite">
        <div className="pwa-banner__text">
          <strong>{t('updateTitle')}</strong>
          <span>{t('updateBody')}</span>
        </div>
        <div className="pwa-banner__actions">
          <button type="button" className="btn btn-primary" onClick={() => void refresh()}>
            <RefreshCw size={16} aria-hidden="true" />
            {t('updateAction')}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            aria-label={t('dismiss')}
            onClick={() => setNeedRefresh(false)}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div className="pwa-banner" role="status">
        <div className="pwa-banner__text">
          <strong>{t('offlineReadyTitle')}</strong>
          <span>{t('offlineReadyBody')}</span>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          aria-label={t('dismiss')}
          onClick={() => setOfflineReady(false)}
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  if (showIosTip && !dismissedInstall) {
    return (
      <div className="pwa-banner" role="dialog" aria-label={t('installTitle')}>
        <div className="pwa-banner__text">
          <strong>{t('installTitle')}</strong>
          <span>{t('iosInstallBody')}</span>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          aria-label={t('dismiss')}
          onClick={dismissIos}
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  if (deferred && !dismissedInstall) {
    return (
      <div className="pwa-banner" role="dialog" aria-label={t('installTitle')}>
        <div className="pwa-banner__text">
          <strong>{t('installTitle')}</strong>
          <span>{t('installBody')}</span>
        </div>
        <div className="pwa-banner__actions">
          <button type="button" className="btn btn-primary" onClick={() => void install()}>
            <Download size={16} aria-hidden="true" />
            {t('installAction')}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            aria-label={t('dismiss')}
            onClick={() => setDismissedInstall(true)}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
