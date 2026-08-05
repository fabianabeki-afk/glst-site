import { NextRequest, NextResponse } from 'next/server';

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const CLOUDFLARE_GLOBAL_API_KEY = process.env.CLOUDFLARE_GLOBAL_API_KEY!;
const CLOUDFLARE_EMAIL = process.env.CLOUDFLARE_EMAIL!;

export async function GET(req: NextRequest) {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_GLOBAL_API_KEY) {
      return NextResponse.json({ error: 'Cloudflare credentials not configured' }, { status: 500 });
    }

    // Get existing live inputs using Global API Key
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`, {
      method: 'GET',
      headers: {
        'X-Auth-Key': CLOUDFLARE_GLOBAL_API_KEY,
        'X-Auth-Email': CLOUDFLARE_EMAIL,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.success) {
      return NextResponse.json({ error: data.errors }, { status: 400 });
    }

    // Return RTMP info for the first live input
    const liveInput = data.result?.[0];
    if (!liveInput) {
      return NextResponse.json({ error: 'No live inputs found' }, { status: 404 });
    }

    return NextResponse.json({
      rtmp: {
        url: liveInput.rtmp_url || `rtmp://live.cloudflare.com:443/live`,
        key: liveInput.rtmp_key || liveInput.uid,
      },
      whip: {
        url: liveInput.whip_url,
      },
      playback: {
        whep: liveInput.whep_url,
        hls: liveInput.hls_url,
      },
    });
  } catch (err: any) {
    console.error('Cloudflare RTMP error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_GLOBAL_API_KEY) {
      return NextResponse.json({ error: 'Cloudflare credentials not configured' }, { status: 500 });
    }

    // Create new live input with RTMP support using Global API Key
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`, {
      method: 'POST',
      headers: {
        'X-Auth-Key': CLOUDFLARE_GLOBAL_API_KEY,
        'X-Auth-Email': CLOUDFLARE_EMAIL,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meta: {
          name: `guestlist-mobile-${Date.now()}`,
        },
        recording: {
          mode: 'automatic',
        },
      }),
    });

    const data = await response.json();

    if (!data.success) {
      return NextResponse.json({ error: data.errors }, { status: 400 });
    }

    return NextResponse.json({
      id: data.result.uid,
      rtmp: {
        url: data.result.rtmp_url,
        key: data.result.rtmp_key,
      },
      whip: {
        url: data.result.whip_url,
      },
      playback: {
        whep: data.result.whep_url,
        hls: data.result.hls_url,
      },
    });
  } catch (err: any) {
    console.error('Cloudflare create live input error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
