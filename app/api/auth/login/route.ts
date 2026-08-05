import { NextRequest, NextResponse } from 'next/server';
import { createJWT, setAuthCookie } from '@/lib/auth';
import { generateMFASecret } from '@/lib/mfa';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual user authentication against your database
    // For now, this is a mock implementation
    const mockUser = {
      userId: 'user-123',
      email,
      role: email.includes('dj') ? 'dj' : 'fan' as 'dj' | 'fan',
    };

    // Check if user has MFA enabled
    const hasMFA = true; // TODO: Check from database

    if (hasMFA) {
      // Generate MFA challenge
      const mfaSecret = generateMFASecret(email);

      // TODO: Store MFA secret temporarily in session/database
      // For now, return it (in production, use secure session)

      return NextResponse.json({
        requiresMFA: true,
        mfaSecret: mfaSecret.otpauth_url,
        tempToken: 'temp-session-token', // TODO: Use secure session
      });
    }

    // No MFA required, create JWT
    const token = await createJWT({
      ...mockUser,
      mfaVerified: false,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: mockUser,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}