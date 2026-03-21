'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getLinkByCode, recordClick } from '@/lib/linkService';

export default function RedirectPage() {
  const params = useParams();
  const code = params.code as string;
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'notfound'>('loading');
  const [originalUrl, setOriginalUrl] = useState('');

  useEffect(() => {
    if (!code) return;
    const link = getLinkByCode(code);
    if (!link) {
      setStatus('notfound');
      return;
    }
    recordClick(code, document.referrer || undefined);
    setOriginalUrl(link.originalUrl);
    setStatus('redirecting');
    setTimeout(() => {
      window.location.href = link.originalUrl;
    }, 800);
  }, [code]);

  if (status === 'notfound') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="glass-card p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(229,57,53,0.15)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="#E53935" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="#E53935" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Lien introuvable</h1>
          <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
            Ce lien n&apos;existe pas ou a été supprimé.
          </p>
          <a href="/" className="btn-accent block">Créer un lien</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="glass-card p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(229,57,53,0.15)' }}>
          {status === 'loading' ? (
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(229,57,53,0.3)', borderTopColor: '#E53935' }} />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <polyline points="20 6 9 17 4 12" stroke="#E53935" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <h1 className="text-xl font-bold mb-2">
          {status === 'loading' ? 'Chargement…' : 'Redirection…'}
        </h1>
        {originalUrl && (
          <p className="text-xs mt-2 truncate" style={{ color: '#6b7280' }}>
            → {originalUrl}
          </p>
        )}
        <p className="text-xs mt-4" style={{ color: '#4b5563' }}>
          Propulsé par{' '}
          <a href="/" style={{ color: '#E53935' }}>Slinkto</a>
        </p>
      </div>
    </div>
  );
}
