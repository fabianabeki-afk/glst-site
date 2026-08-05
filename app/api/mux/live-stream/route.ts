import { NextResponse } from 'next/server';

export async function POST() {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    console.error("[MUX_CONFIG_ERROR]: Credentials missing.");
    return NextResponse.json(
      { error: 'Mux API credentials missing on server.' },
      { status: 500 }
    );
  }

  try {
    const authHeader = Buffer.from(`${tokenId.trim()}:${tokenSecret.trim()}`).toString('base64');

    // Create a universal live stream object supporting WebRTC WHIP, RTMP/RTMPS, and SRT
    const response = await fetch('https://api.mux.com/video/v1/live-streams', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playback_policy: ['public'],
        new_asset_settings: { playback_policy: ['public'] },
        latency_mode: 'low',
        reduced_latency: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[MUX_API_REJECTED]:', data);
      return NextResponse.json(
        { error: data.error?.messages?.[0] || 'Mux rejected live stream creation' },
        { status: response.status }
      );
    }

    const liveStream = data.data;
    const streamKey = liveStream.stream_key;
    const playbackId = liveStream.playback_ids?.[0]?.id;

    // Build the WHIP endpoint for browser WebRTC ingestion
    // Mux returns whip_url on some accounts/plans; fall back to standard pattern
    const whipUrl = liveStream.whip_url || `https://global-whip.mux.com/v1/whip/${streamKey}`;

    return NextResponse.json({
      success: true,
      // 1. WebRTC WHIP protocol (Guestlist Camera, In-Browser Continuity Camera, Mobile Web)
      whipUrl,
      // 2. RTMP / RTMPS protocols (DSLRs, Action Cams, OBS Studio, Hardware Encoders)
      rtmpUrl: 'rtmp://global-live.mux.com:5222/app',
      rtmpsUrl: 'rtmps://global-live.mux.com:443/app',
      // 3. Playback CDN HLS output (.m3u8 for all web/mobile viewers)
      playbackUrl: `https://stream.mux.com/${playbackId}.m3u8`,
      playbackId,
      streamKey,
    });
  } catch (err: any) {
    console.error('[MUX_ROUTE_EXCEPTION]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}