import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In production, fetch from your database
    // For now, return the active stream
    const streams = [
      {
        id: '6622b373b6e857c4d3bf3954ca9e17be',
        djName: 'DJ Fabian',
        hlsUrl: 'https://customer-xfdlafmmuylrdexv.cloudflarestream.com/6622b373b6e857c4d3bf3954ca9e17be/manifest/video.m3u8',
        whipUrl: 'https://customer-xfdlafmmuylrdexv.cloudflarestream.com/16e9a735588b6d6d098fab4a36adb4dbk6622b373b6e857c4d3bf3954ca9e17be/webRTC/publish',
        isLive: true,
        startedAt: new Date().toISOString(),
        viewerCount: 0
      }
    ];

    return NextResponse.json({ streams });
  } catch (error) {
    console.error('Error fetching streams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streams' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { djName, userId } = body;

    // In production:
    // 1. Create Cloudflare Live Input via API
    // 2. Store in database with user_id
    // 3. Return WHIP URL to iOS app
    // 4. Return HLS URL for web playback

    // For demo, return existing stream credentials
    const stream = {
      id: '6622b373b6e857c4d3bf3954ca9e17be',
      uid: '6622b373b6e857c4d3bf3954ca9e17be',
      djName: djName || 'DJ',
      whip: 'https://customer-xfdlafmmuylrdexv.cloudflarestream.com/16e9a735588b6d6d098fab4a36adb4dbk6622b373b6e857c4d3bf3954ca9e17be/webRTC/publish',
      hls: 'https://customer-xfdlafmmuylrdexv.cloudflarestream.com/6622b373b6e857c4d3bf3954ca9e17be/manifest/video.m3u8',
      isLive: true
    };

    return NextResponse.json(stream);
  } catch (error) {
    console.error('Error creating stream:', error);
    return NextResponse.json(
      { error: 'Failed to create stream' },
      { status: 500 }
    );
  }
}