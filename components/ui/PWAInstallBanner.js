'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-banner-dismissed', '1');
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up"
      style={{
        background: 'rgba(10,22,40,0.97)',
        border: '1px solid rgba(56,163,212,0.4)',
        borderRadius: '14px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1d6fa6, #38a3d4)' }}
        >
          <span style={{ fontSize: '18px' }}>✈</span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
            Install AeroFlow
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Add to home screen for faster access and offline support
          </p>
          <button
            onClick={handleInstall}
            className="btn-primary text-xs py-2 px-4 mt-3"
          >
            <Download size={13} />
            Install App
          </button>
        </div>
        <button onClick={handleDismiss} style={{ color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
