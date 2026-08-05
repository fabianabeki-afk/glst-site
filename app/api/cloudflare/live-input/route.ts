import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const CLOUDFLARE_GLOBAL_API_KEY = process.env.CLOUDFLARE_GLOBAL_API_KEY!;
const CLOUDFLARE_EMAIL = process.env.CLOUDFLARE_EMAIL!;

// Supabase client for stream tracking
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Max concurrent streams
const MAX_CONCURRENT_STREAMS = 20;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { djName, eventName, djId } = body;

    // Check concurrent stream limit
    const { count: activeCount } = await supabase
      .from('streams')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'live');

    if (activeCount && activeCount >= MAX_CONCURRENT_STREAMS) {
      return NextResponse.json(
        { error: 'Maximum concurrent streams reached. Please try again later.' },
        { status: 429 }
      );
    }

    // Get DJ tier from profile
    let tier = 'new';
    if (djId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', djId)
        .single();
      
      if (profile?.tier) {
        tier = profile.tier;
      }
    }

    // Create a live input using Global API Key authentication
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`,
      {
        method: 'POST',
        headers: {
          'X-Auth-Key': CLOUDFLARE_GLOBAL_API_KEY,
          'X-Auth-Email': CLOUDFLARE_EMAIL,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta: {
            name: `${djName} - ${eventName}`,
            djName,
            eventName,
          },
          recording: {
            mode: 'automatic',
          },
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Failed to create live input');
    }

    const liveInput = data.result;
    const hlsUrl = `https://customer-xfdlafmmuylrdexv.cloudflarestream.com/${liveInput.uid}/manifest/video.m3u8?protocol=llhls`;

    // Save stream to database
    const { data: stream, error: dbError } = await supabase
      .from('streams')
      .insert({
        dj_id: djId,
        dj_name: djName,
        event_name: eventName,
        cloudflare_uid: liveInput.uid,
        hls_url: hlsUrl,
        whep_url: liveInput.webRTCPlayback?.url,
        status: 'live',
        tier,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[STREAM_DB_ERROR]:', dbError);
    }

    return NextResponse.json({
      success: true,
      liveInput: {
        uid: liveInput.uid,
        whipUrl: liveInput.webRTC?.url,
        whepUrl: liveInput.webRTCPlayback?.url,
        hlsUrl,
        rtmpUrl: liveInput.rtmps?.url,
        streamKey: liveInput.rtmps?.streamKey,
        created: liveInput.created,
      },
      stream: stream || null,
    });

  } catch (error: any) {
    console.error('[CLOUDFLARE_LIVE_INPUT_ERROR]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create live input' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({ error: 'UID required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${uid}`,
      {
        headers: {
          'X-Auth-Key': CLOUDFLARE_GLOBAL_API_KEY,
          'X-Auth-Email': CLOUDFLARE_EMAIL,
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
