'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NativeGoogleSignIn() {
  const router = useRouter();

  useEffect(() => {
    let listener: { remove: () => void } | null = null;

    import('@capacitor/app').then(({ App }) => {
      App.addListener('appUrlOpen', async (data: { url: string }) => {
        if (data.url.startsWith('slinkto://auth-complete')) {
          try {
            const { Browser } = await import('@capacitor/browser');
            await Browser.close();
          } catch {}

          // Extract the one-time sign-in ticket from the deep link
          const urlObj = new URL(data.url.replace('slinkto://', 'https://x.x/'));
          const ticket = urlObj.searchParams.get('ticket');

          if (ticket) {
            // Navigate WebView to the page that will consume the ticket
            window.location.href = `/native-signin?ticket=${encodeURIComponent(ticket)}`;
          } else {
            router.push('/');
            router.refresh();
          }
        }
      }).then(l => { listener = l; });
    }).catch(() => {});

    return () => { listener?.remove(); };
  }, [router]);

  async function handleGoogleSignIn() {
    try {
      const { Browser } = await import('@capacitor/browser');
      // Open Clerk's Account Portal directly in Chrome Custom Tabs.
      // The entire OAuth flow (including state management) runs inside Chrome,
      // so there is no WebView sessionStorage mismatch.
      const redirectUrl = encodeURIComponent('https://www.slnko.me/native-callback');
      await Browser.open({
        url: `https://accounts.slnko.me/sign-in?redirect_url=${redirectUrl}`,
      });
    } catch (err) {
      console.error('Sign-in error:', err);
    }
  }

  return (
    <button
      onClick={handleGoogleSignIn}
      className="btn-secondary w-full justify-center flex items-center gap-2 mt-3"
      style={{ padding: '10px 16px', borderRadius: '8px' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
    </button>
  );
}
