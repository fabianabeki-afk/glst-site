// Lightweight bot detection heuristics / ML stub
// This service would eventually call a real model or external API
// For now it uses simple rules (user-agent, rate, fingerprint score) and returns a risk score.

import { BehaviorStats } from './behavior';

export interface BotScore {
  risk: number; // 0-100
  reasons: string[];
}

export function scoreBehavior(stats: BehaviorStats): BotScore {
  const reasons: string[] = [];
  let risk = 0;

  // high request rates
  if (stats.requestsPerMinute > 500) {
    risk += 50;
    reasons.push('high_request_rate');
  }
  if (stats.score > 80) {
    risk += 30;
    reasons.push('high_score');
  }
  // simple threshold
  if (risk > 100) risk = 100;
  return { risk, reasons };
}

export function analyzeUA(userAgent: string): BotScore {
  const lower = userAgent.toLowerCase();
  let risk = 0;
  const reasons: string[] = [];
  const patterns = [/bot/, /crawler/, /spider/, /scraper/, /curl/, /wget/, /python/];
  patterns.forEach(p => {
    if (p.test(lower)) {
      risk += 20;
      reasons.push(`ua_match:${p}`);
    }
  });
  if (risk > 100) risk = 100;
  return { risk, reasons };
}

// composite function
export async function evaluateRequest(
  fingerprint: string,
  userAgent: string,
  stats: BehaviorStats
): Promise<BotScore> {
  const uaScore = analyzeUA(userAgent);
  const behaviorScore = scoreBehavior(stats);
  let combined = uaScore.risk + behaviorScore.risk;
  if (combined > 100) combined = 100;
  return {
    risk: combined,
    reasons: [...uaScore.reasons, ...behaviorScore.reasons],
  };
}