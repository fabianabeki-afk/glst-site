import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'APISzYs7v6TvQ2t';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '5EWetwwfeHTeY8XCCk9T8WYkGAgeb73aJRaGNzdtIG4G';
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://guestlist-tv-ei1a8q8r.livekit.cloud';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomName, identity, role } = body;

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: identity || `viewer-${Date.now()}`,
      name: 'Viewer',
    });

    if (role === 'broadcaster') {
      // Broadcaster token (for iOS)
      token.addGrant({
        roomJoin: true,
        room: roomName || 'fabiandubz-stream',
        canPublish: true,
        canSubscribe: false,
        canPublishData: true,
      });
    } else {
      // Viewer token (for web app)
      token.addGrant({
        roomJoin: true,
        room: roomName || 'fabiandubz-stream',
        canPublish: false,
        canSubscribe: true,
        canPublishData: false,
      });
    }

    const jwt = token.toJwt();

    return NextResponse.json({
      token: jwt,
      url: LIVEKIT_URL,
      roomName: roomName || 'fabiandubz-stream',
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    url: LIVEKIT_URL,
    message: 'Use POST to generate tokens. Set role: "broadcaster" or "viewer"',
  });
}
