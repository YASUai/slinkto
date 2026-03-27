import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Creates a short-lived Clerk sign-in token for the currently authenticated user.
 * Called from /native-callback (running in Chrome Custom Tabs) after Google OAuth.
 * The token is sent to the native app via deep link so the WebView can sign in
 * using the `ticket` strategy – no sessionStorage sharing required.
 */
export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        expires_in_seconds: 120, // valid for 2 minutes
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Clerk sign-in token error:', err);
      return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ token: data.token });
  } catch (error) {
    console.error('Error creating sign-in token:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
