'use client';

import { SignIn } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const NativeGoogleSignIn = dynamic(() => import('@/components/NativeGoogleSignIn'), { ssr: false });

export default function SignInPage() {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    import('@capacitor/core').then(({ Capacitor }) => {
      setIsNative(Capacitor.isNativePlatform());
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <SignIn
        appearance={{
          elements: {
            // Hide Google button in native — we show our own below
            socialButtonsBlockButton__google: isNative ? { display: 'none' } : {},
            socialButtonsBlockButtonArrow__google: isNative ? { display: 'none' } : {},
          },
        }}
      />
      {isNative && <NativeGoogleSignIn />}
    </div>
  );
}
