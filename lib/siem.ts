import { NextRequest } from 'next/server';

export interface SecurityEvent {
  timestamp: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  fingerprint?: string;
  details: Record<string, any>;
}

export class SIEMLogger {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 1000; // Keep last 1000 events in memory

  log(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.events.push(securityEvent);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console for development
    console.log(`[SECURITY ${event.severity.toUpperCase()}] ${event.eventType}:`, event.details);

    // TODO: Send to SIEM system (Datadog/Splunk)
    this.sendToSIEM(securityEvent);
  }

  private async sendToSIEM(event: SecurityEvent) {
    // TODO: Implement actual SIEM integration
    // For Datadog: Use datadog-logs library
    // For Splunk: Use HTTP Event Collector

    if (process.env.DATADOG_API_KEY) {
      // Send to Datadog
      try {
        await fetch('https://http-intake.logs.datadoghq.com/v1/input', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'DD-API-KEY': process.env.DATADOG_API_KEY,
          },
          body: JSON.stringify({
            message: `[GLST] ${event.eventType}`,
            level: event.severity,
            timestamp: event.timestamp,
            source: event.source,
            ...event.details,
          }),
        });
      } catch (error) {
        console.error('Failed to send to Datadog:', error);
      }
    }

    if (process.env.SPLUNK_HEC_URL && process.env.SPLUNK_HEC_TOKEN) {
      // Send to Splunk
      try {
        await fetch(process.env.SPLUNK_HEC_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Splunk ${process.env.SPLUNK_HEC_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: {
              ...event,
              sourcetype: 'glst:security',
            },
          }),
        });
      } catch (error) {
        console.error('Failed to send to Splunk:', error);
      }
    }
  }

  getRecentEvents(limit = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  getEventsBySeverity(severity: SecurityEvent['severity']): SecurityEvent[] {
    return this.events.filter(event => event.severity === severity);
  }
}

// Global logger instance
export const siemLogger = new SIEMLogger();

// Convenience functions
export function logSecurityEvent(
  eventType: string,
  severity: SecurityEvent['severity'],
  source: string,
  details: Record<string, any>,
  request?: NextRequest,
  userId?: string
) {
  siemLogger.log({
    eventType,
    severity,
    source,
    userId,
    ip: request ? getClientIP(request) : undefined,
    userAgent: request ? request.headers.get('user-agent') || undefined : undefined,
    details,
  });
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (clientIP) {
    return clientIP;
  }

  return 'unknown';
}