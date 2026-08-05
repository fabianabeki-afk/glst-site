import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';

// Helper function to lazily retrieve and encode the secret
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return new TextEncoder().encode(secret);
};

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('JWT_SECRET is not configured');
}

export interface UserPayload extends JWTPayload {
  userId: string;
  email: string;
  role: 'dj' | 'fan';
  mfaVerified: boolean;
}

export async function createJWT(payload: UserPayload): Promise<string> {
  // Access the secret dynamically inside the function
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtSecret());
}

export async function verifyJWT(token: string): Promise<UserPayload | null> {
  try {
    // Access the secret dynamically inside the function
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as UserPayload;
  } catch {
    return null;
  }
}

export async function getUserFromCookie(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) return null;

  return await verifyJWT(token);
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}