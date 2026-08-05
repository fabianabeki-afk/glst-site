import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add CSP headers allowing Stripe, LiveKit, Cloudflare Stream, Supabase, and Google Fonts
  const csp = "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' blob: data: https://customer-xfdlafmmuylrdexv.cloudflarestream.com; " +
    "media-src 'self' blob: https://customer-xfdlafmmuylrdexv.cloudflarestream.com; " +
    "connect-src 'self' https://api.stripe.com https://www.guestlist.tv https://customer-xfdlafmmuylrdexv.cloudflarestream.com https://*.livekit.cloud wss://*.livekit.cloud https://zcldklsqbhkguuyiyyjd.supabase.co wss://zcldklsqbhkguuyiyyjd.supabase.co; " +
    "frame-src https://js.stripe.com https://customer-xfdlafmmuylrdexv.cloudflarestream.com;";
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

export const config = {
  matcher: '/:path*',
};