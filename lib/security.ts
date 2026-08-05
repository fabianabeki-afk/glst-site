import { NextRequest } from 'next/server';

export interface DeviceFingerprint {
  userAgent: string;
  ip: string;
  fingerprint: string;
  timestamp: number;
}

export async function generateDeviceFingerprint(request: NextRequest): Promise<DeviceFingerprint> {
  const userAgent = request.headers.get('user-agent') || '';
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';

  // Create a fingerprint from various browser/device characteristics
  const fingerprintData = {
    userAgent,
    ip,
    accept: request.headers.get('accept') || '',
    acceptLanguage: request.headers.get('accept-language') || '',
    acceptEncoding: request.headers.get('accept-encoding') || '',
    dnt: request.headers.get('dnt') || '',
    upgradeInsecureRequests: request.headers.get('upgrade-insecure-requests') || '',
  };

  // Use Web Crypto API for Edge Runtime compatibility
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(fingerprintData));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const fingerprint = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    userAgent,
    ip,
    fingerprint,
    timestamp: Date.now(),
  };
}

export interface BehavioralPattern {
  requestCount: number;
  timeWindow: number;
  averageInterval: number;
  suspiciousPatterns: string[];
}

export class BehavioralAnalyzer {
  private requests: number[] = [];
  private readonly windowSize = 60000; // 1 minute
  private readonly maxRequestsPerWindow = 100;

  addRequest(timestamp: number) {
    this.requests.push(timestamp);
    // Clean old requests
    this.requests = this.requests.filter(t => timestamp - t < this.windowSize);
  }

  analyze(): BehavioralPattern {
    const now = Date.now();
    const recentRequests = this.requests.filter(t => now - t < this.windowSize);

    const intervals = [];
    for (let i = 1; i < recentRequests.length; i++) {
      intervals.push(recentRequests[i] - recentRequests[i - 1]);
    }

    const averageInterval = intervals.length > 0
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length
      : 0;

    const suspiciousPatterns = [];

    if (recentRequests.length > this.maxRequestsPerWindow) {
      suspiciousPatterns.push('high_request_rate');
    }

    if (averageInterval < 100) { // Less than 100ms between requests
      suspiciousPatterns.push('rapid_fire_requests');
    }

    return {
      requestCount: recentRequests.length,
      timeWindow: this.windowSize,
      averageInterval,
      suspiciousPatterns,
    };
  }

  isSuspicious(): boolean {
    const pattern = this.analyze();
    return pattern.suspiciousPatterns.length > 0;
  }
}