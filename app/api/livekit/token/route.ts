import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'APISzYs7v6TvQ2t';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '5EWetwwfeHTeY8XCCk9T8WYkGAgeb73aJRaGNzdtIG4G';
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://guestlist-tv-ei1a8q8r.livekit.cloud';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomName, identity, role } = body;

    const room = roomName || 'fabiandubz-stream';
    const userIdentity = identity || `viewer-${Date.now()}`;

    // Create token payload
    const payload = {
      iss: LIVEKIT_API_KEY,
      sub: userIdentity,
      video: {
        roomJoin: true,
        room: room,
        canPublish: role === 'broadcaster',
        canSubscribe: role !== 'broadcaster',
        canPublishData: true,
      },
    };

    // Sign the token
    const token = jwt.sign(payload, LIVEKIT_API_SECRET, {
      expiresIn: '24h',
    });

    console.log('Generated token length:', token.length);

    return NextResponse.json({
      token: token,
      url: LIVEKIT_URL,
      roomName: room,
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