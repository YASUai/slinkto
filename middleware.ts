import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routes publiques : page de redirection + sign-in/up + debug + native OAuth
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/native-callback(.*)',  // Chrome Custom Tabs post-OAuth page
  '/native-signin(.*)',    // WebView ticket-consumption page
  '/api/debug(.*)',
  '/:code',          // redirection publique
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)','/(api|trpc)(.*)'],
};
