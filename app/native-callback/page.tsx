'use client';

/**
 * This page runs inside Chrome Custom Tabs after the user has signed in
 * via Clerk's Account Portal. At this point the Clerk session lives in Chrome.
 *
 * We ask our server to mint a short-lived Clerk sign-in token tied to the
 * current user, then we deep-link back to the app with that token so the
 * WebView can consume it and establish its own Clerk session.
 */

import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';

export default function NativeCallback() {
  // Clerk v7 compatible – useAuth() may or may not expose `isLoaded`
  const auth = useAuth() as { userId?: string | null; isLoaded?: boolean };
  const ran = useRef(false);

  useEffect(() => {
    // If isLoaded is available (older API), wait for it; otherwise rely on userId being defined
    if (auth.isLoaded === false || ran.current) return;
    ran.current = true;

    if (!auth.userId) {
      // Not signed in – send the app back without a ticket
      window.location.href = 'slinkto://auth-complete';
      return;
    }

    // Create a one-time sign-in token on the server
    fetch('/api/auth/native-token', { method: 'POST' })
      .then(r => r.json())
      .then(({ token }) => {
        if (token) {
          window.location.href = `slinkto://auth-complete?ticket=${encodeURIComponent(token)}`;
        } else {
          window.location.href = 'slinkto://auth-complete';
        }
      })
      .catch(() => {
        window.location.href = 'slinkto://auth-complete';
      });
  }, [auth.isLoaded, auth.userId]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor: '#E53935', borderTopColor: 'transparent' }}
        />
        <p className="text-sm" style={{ color: '#9ca3af' }}>Completing sign-in…</p>
      </div>
    </div>
  );
}
