import { NextResponse } from 'next/server';

export async function GET() {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  return NextResponse.json({
    status: 'Environment Diagnostics',
    nodeEnv: process.env.NODE_ENV,
    hasTokenId: !!tokenId,
    tokenIdLength: tokenId ? tokenId.length : 0,
    tokenIdFirstFour: tokenId ? tokenId.substring(0, 4) : 'NONE',
    hasTokenSecret: !!tokenSecret,
    tokenSecretLength: tokenSecret ? tokenSecret.length : 0,
  });
}