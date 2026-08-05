import { NextRequest, NextResponse } from 'next/server';
import { createJWT, setAuthCookie } from '@/lib/auth';
import { verifyMFAToken } from '@/lib/mfa';

export async function POST(request: NextRequest) {
  try {
    const { tempToken, mfaToken, mfaSecret } = await request.json();

    if (!tempToken || !mfaToken || !mfaSecret) {
      return NextResponse.json(
        { error: 'Missing MFA verification data' },
        { status: 400 }
      );
    }

    // TODO: Retrieve user data from temp session
    // For now, mock user data
    const user = {
      userId: 'user-123',
      email: 'user@example.com',
      role: 'fan' as 'dj' | 'fan',
    };

    // Verify MFA token
    const isValid = verifyMFAToken(mfaSecret, mfaToken);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid MFA token' },
        { status: 401 }
      );
    }

    // Create JWT with MFA verified
    const token = await createJWT({
      ...user,
      mfaVerified: true,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: { ...user, mfaVerified: true },
    });

  } catch (error) {
    console.error('MFA verification error:', error);
    return NextResponse.json(
      { error: 'MFA verification failed' },
      { status: 500 }
    );
  }
}