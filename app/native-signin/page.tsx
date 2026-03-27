'use client';

/**
 * This page runs inside the WebView after the app receives a `slinkto://auth-complete?ticket=...`
 * deep link. It consumes the Clerk sign-in token (ticket) to establish a Clerk session
 * directly inside the WebView, completely bypassing the Chrome/WebView storage split.
 */

import { useSignIn, useClerk } from '@clerk/nextjs';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Suspense } from 'react';

function NativeSignInInner() {
  const { signIn, isLoaded } = useSignIn();
  const { setActive } = useClerk();
  const searchParams = useSearchParams();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (!isLoaded || !signIn || ran.current) return;
    ran.current = true;

    const ticket = searchParams.get('ticket');
    if (!ticket) {
      router.push('/');
      return;
    }

    signIn
      .create({ strategy: 'ticket', ticket })
      .then(async result => {
        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId });
          router.push('/');
        } else {
          router.push('/sign-in');
        }
      })
      .catch(err => {
        console.error('Ticket sign-in error:', err);
        router.push('/sign-in');
      });
  }, [isLoaded, signIn, setActive, searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor: '#E53935', borderTopColor: 'transparent' }}
        />
        <p className="text-sm" style={{ color: '#9ca3af' }}>Signing in…</p>
      </div>
    </div>
  );
}

export default function NativeSignIn() {
  return (
    <Suspense>
      <NativeSignInInner />
    </Suspense>
  );
}
