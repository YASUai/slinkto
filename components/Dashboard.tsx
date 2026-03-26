'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  getShortUrl,
  getDisplayUrl,
  getTotalClicks,
  getClicksPerDay,
  getRelativeDate,
} from '@/lib/linkService';
import { ShortLink } from '@/lib/types';
import WeekChart from './WeekChart';

export default function Dashboard() {
  const [url, setUrl] = useState('');
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [generated, setGenerated] = useState<ShortLink | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadLinks = useCallback(async () => {
    try {
      const res = await fetch('/api/links');
      if (res.ok) setLinks(await res.json());
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  async function generateQR(shortUrl: string) {
    try {
      const dataUrl = await QRCode.toDataURL(shortUrl, {
        width: 200, margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrDataUrl(dataUrl);
    } catch { setQrDataUrl(''); }
  }

  function isValidUrl(value: string): boolean {
    try {
      const u = new URL(value);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch { return false; }
  }

  async function handleShorten() {
    setError('');
    const trimmed = url.trim();
    if (!trimmed) { setError('Entrez une URL'); return; }
    const withProtocol = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    if (!isValidUrl(withProtocol)) { setError('URL invalide'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalUrl: withProtocol }),
      });
      if (!res.ok) throw new Error();
      const link: ShortLink = await res.json();
      setGenerated(link);
      await generateQR(getShortUrl(link.shortCode));
      await loadLinks();
      setUrl('');
    } catch {
      setError('Erreur lors de la création du lien');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!generated) return;
    navigator.clipboard.writeText(getShortUrl(generated.shortCode));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete(shortCode: string) {
    await fetch(`/api/links/${shortCode}`, { method: 'DELETE' });
    if (generated?.shortCode === shortCode) setGenerated(null);
    await loadLinks();
  }

  const totalClicks = getTotalClicks(links);
  const weekData = getClicksPerDay(links, 7);
  const recentLinks = links.slice(0, 5);

  return (
    <div className="relative min-h-screen w-full">
      {/* Background glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(circle at 80% 20%, rgba(229,57,53,0.12) 0%, transparent 60%)' }} />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(circle at 20% 80%, rgba(255,107,107,0.08) 0%, transparent 60%)' }} />

      {/* Mobile container */}
      <div className="relative z-10 max-w-sm mx-auto px-4 py-8 pb-16">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
                stroke="#E53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
                stroke="#E53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1 className="text-2xl font-bold tracking-tight">Slinkto</h1>
          </div>
          <div className="h-px w-16 mx-auto mt-2"
            style={{ background: 'linear-gradient(90deg, transparent, #E53935, transparent)' }} />
        </div>

        {/* Input card */}
        <div className="glass-card p-5 mb-4">
          <label className="block text-xs font-medium mb-2" style={{ color: '#9ca3af' }}>
            RACCOURCIR UN LIEN
          </label>
          <div className="flex flex-col gap-3">
            <input
              className="glass-input"
              type="url"
              placeholder="https://votre-url-longue.com/..."
              value={url}
              onChange={e => { setUrl(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleShorten()}
            />
            {error && <p className="text-xs" style={{ color: '#FF6B6B' }}>{error}</p>}
            <button className="btn-accent" onClick={handleShorten} disabled={loading}>
              {loading ? 'Génération…' : 'RACCOURCIR'}
            </button>
          </div>
        </div>

        {/* Result card */}
        {generated && (
          <div className="glass-card p-5 mb-4">
            <div className="flex items-start gap-4">
              {qrDataUrl && (
                <div className="rounded-lg overflow-hidden flex-shrink-0"
                  style={{ background: 'white', padding: '6px' }}>
                  <img src={qrDataUrl} alt="QR Code" width={80} height={80} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>Lien raccourci</p>
                <p className="font-bold text-sm truncate" style={{ color: '#E53935' }}>
                  {getDisplayUrl(generated.shortCode)}
                </p>
                <p className="text-xs truncate mt-1" style={{ color: '#6b7280' }}>
                  {generated.originalUrl.length > 40
                    ? generated.originalUrl.slice(0, 40) + '…'
                    : generated.originalUrl}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-secondary flex-1 justify-center" onClick={handleCopy}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                {copied ? 'Copié !' : 'Copier'}
              </button>
              <button className="btn-secondary flex-1 justify-center"
                onClick={() => navigator.share?.({ url: getShortUrl(generated.shortCode), title: 'Slinkto' })}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Partager
              </button>
            </div>
          </div>
        )}

        {/* Stats + Chart */}
        {links.length > 0 && (
          <div className="glass-card p-5 mb-4">
            <p className="text-xs font-medium mb-4" style={{ color: '#9ca3af' }}>STATISTIQUES</p>
            <WeekChart data={weekData} />
            <div className="flex gap-3 mt-4">
              <div className="flex-1 text-center p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xl font-bold">{totalClicks}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Clics</p>
              </div>
              <div className="flex-1 text-center p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xl font-bold">{links.length}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Liens</p>
              </div>
              <div className="flex-1 text-center p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xl font-bold">
                  {links.length > 0 ? Math.round(totalClicks / links.length * 10) / 10 : 0}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Moy/lien</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent links */}
        {recentLinks.length > 0 && (
          <div className="glass-card p-5">
            <p className="text-xs font-medium mb-4" style={{ color: '#9ca3af' }}>LIENS RÉCENTS</p>
            <div className="flex flex-col gap-3">
              {recentLinks.map(link => (
                <div key={link.id} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(229,57,53,0.15)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
                        stroke="#E53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
                        stroke="#E53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#E53935' }}>
                      {getDisplayUrl(link.shortCode)}
                    </p>
                    <p className="text-xs truncate" style={{ color: '#6b7280' }}>
                      {link.originalUrl.length > 35
                        ? link.originalUrl.slice(0, 35) + '…'
                        : link.originalUrl}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{link.clicks.length}</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>{getRelativeDate(link.createdAt)}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(link.shortCode)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded"
                      style={{ color: '#6b7280' }}
                      title="Supprimer">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {links.length === 0 && !generated && (
          <div className="text-center py-12" style={{ color: '#4b5563' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3 opacity-40">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm">Raccourcissez votre premier lien</p>
          </div>
        )}
      </div>
    </div>
  );
}
