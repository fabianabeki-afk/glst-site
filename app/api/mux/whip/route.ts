import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { whipUrl, sdp } = await req.json();

    if (!whipUrl || !sdp) {
      return NextResponse.json(
        { error: 'Missing whipUrl or sdp offer payload.' },
        { status: 400 }
      );
    }

    // Use the WHIP URL as-is from Mux — don't mutate the hostname
    // The Mux API returns the correct URL in liveStream.whip_url
    const targetUrl = whipUrl.trim();

    console.log(`[WHIP_PROXY_FORWARDING]: Transmitting SDP offer to ${targetUrl}`);

    // Forward the SDP offer directly to Mux using standard fetch
    // AWS Lambda/Amplify handles DNS resolution internally through its HTTP stack
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp',
        'User-Agent': 'Guestlist-Broadcaster-Studio/1.0',
      },
      body: sdp,
    });

    const responseData = await response.text();

    if (!response.ok) {
      console.error(`[MUX_WHIP_ERROR]: Status ${response.status}`, responseData);
      return NextResponse.json(
        { error: `Mux WHIP endpoint responded with status ${response.status}: ${responseData}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ answerSdp: responseData });
  } catch (err: any) {
    console.error('[MUX_WHIP_PROXY_EXCEPTION]:', err);
    return NextResponse.json(
      { error: err.message || 'WHIP Proxy Internal Server Error' },
      { status: 500 }
    );
  }
}
