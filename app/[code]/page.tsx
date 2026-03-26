import { redirect } from 'next/navigation';
import { dbGet, dbRecordClick } from '@/lib/db';

// Pas de cache — chaque requête doit aller chercher le lien en temps réel
export const dynamic = 'force-dynamic';

export default async function RedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const link = await dbGet(code);

  if (link) {
    await dbRecordClick(code);
    redirect(link.originalUrl);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="glass-card p-8 max-w-sm w-full text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(229,57,53,0.15)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line x1="18" y1="6" x2="6" y2="18" stroke="#E53935" strokeWidth="2" strokeLinecap="round" />
            <line x1="6" y1="6" x2="18" y2="18" stroke="#E53935" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-xl font-bold mb-2">Lien introuvable</h1>
        <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
          Ce lien n&apos;existe pas ou a été supprimé.
        </p>
        <a href="/" className="btn-accent block">
          Créer un lien
        </a>
      </div>
    </div>
  );
}
