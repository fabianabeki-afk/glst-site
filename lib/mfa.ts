import speakeasy from 'speakeasy';

export interface MFASecret {
  secret: string;
  otpauth_url: string;
}

export function generateMFASecret(email: string): MFASecret {
  const secret = speakeasy.generateSecret({
    name: `GLST Platform (${email})`,
    issuer: 'GLST',
  });

  return {
    secret: secret.base32,
    otpauth_url: secret.otpauth_url!,
  };
}

export function verifyMFAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time windows (30 seconds each)
  });
}

export function generateMFAToken(secret: string): string {
  return speakeasy.totp({
    secret,
    encoding: 'base32',
  });
}