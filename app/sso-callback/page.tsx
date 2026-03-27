'use client';

import { useEffect } from 'react';
import { useClerk } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SSOCallbackInner() {
  const { handleRedirectCallback } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNative = searchParams.get('native') === 'true';

  useEffect(() => {
    handleRedirectCallback({
      afterSignInUrl: '/',
      afterSignUpUrl: '/',
    }).then(() => {
      if (isNative) {
        // Redirect to custom scheme to signal the native app
        window.location.href = 'slinkto://auth-complete';
      } else {
        router.push('/');
      }
    }).catch(() => {
      router.push('/sign-in');
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm" style={{ color: '#9ca3af' }}>Signing in…</p>
      </div>
    </div>
  );
}

export default function SSOCallback() {
  return (
    <Suspense>
      <SSOCallbackInner />
    </Suspense>
  );
}
