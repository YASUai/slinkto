import { ShortLink, ClickEvent } from './types';

const PROD_DOMAIN = 'slnko.me';

export function getBaseUrl(): string {
  if (typeof window === 'undefined') return `https://www.${PROD_DOMAIN}`;
  const { hostname, origin } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return origin;
  // En production, toujours utiliser www.slnko.me
  return `https://www.${PROD_DOMAIN}`;
}

export function getShortUrl(shortCode: string): string {
  return `${getBaseUrl()}/${shortCode}`;
}

export function getDisplayUrl(shortCode: string): string {
  if (typeof window === 'undefined') return `${PROD_DOMAIN}/${shortCode}`;
  const { hostname } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  return isLocal ? `localhost:3000/${shortCode}` : `${PROD_DOMAIN}/${shortCode}`;
}

export function getTotalClicks(links: ShortLink[]): number {
  return links.reduce((sum, l) => sum + l.clicks.length, 0);
}

export function getClicksPerDay(links: ShortLink[], days = 7): number[] {
  const now = Date.now();
  const result = new Array(days).fill(0);
  for (const link of links) {
    for (const click of link.clicks) {
      const daysAgo = Math.floor((now - click.timestamp) / (1000 * 60 * 60 * 24));
      if (daysAgo < days) result[days - 1 - daysAgo]++;
    }
  }
  return result;
}

export function getRelativeDate(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
}

// re-export types for convenience
export type { ShortLink, ClickEvent };
