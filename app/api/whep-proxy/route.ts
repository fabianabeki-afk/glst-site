import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    
    // Extract WHEP URL from request
    const url = req.headers.get('x-whep-url');
    if (!url) {
      return NextResponse.json({ error: 'Missing x-whep-url header' }, { status: 400 });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `WHEP failed: ${response.status}` },
        { status: response.status }
      );
    }

    const answerSdp = await response.text();
    return new NextResponse(answerSdp, {
      headers: { 'Content-Type': 'application/sdp' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
