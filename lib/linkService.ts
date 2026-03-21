import { ShortLink, ClickEvent } from './types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'slinkto_links';
const BASE_URL = 'https://slnko.me';

function generateCode(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getLinks(): ShortLink[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLinks(links: ShortLink[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

export function createShortLink(originalUrl: string): ShortLink {
  const links = getLinks();

  // Génère un code unique
  let shortCode = generateCode();
  while (links.some(l => l.shortCode === shortCode)) {
    shortCode = generateCode();
  }

  const link: ShortLink = {
    id: uuidv4(),
    shortCode,
    originalUrl,
    createdAt: Date.now(),
    clicks: [],
  };

  saveLinks([link, ...links]);
  return link;
}

export function getLinkByCode(code: string): ShortLink | null {
  const links = getLinks();
  return links.find(l => l.shortCode === code) ?? null;
}

export function recordClick(code: string, referer?: string): void {
  const links = getLinks();
  const idx = links.findIndex(l => l.shortCode === code);
  if (idx === -1) return;

  const click: ClickEvent = { timestamp: Date.now(), referer };
  links[idx].clicks.push(click);
  saveLinks(links);
}

export function deleteLink(id: string): void {
  const links = getLinks().filter(l => l.id !== id);
  saveLinks(links);
}

export function getShortUrl(link: ShortLink): string {
  return `${BASE_URL}/${link.shortCode}`;
}

export function getDisplayUrl(link: ShortLink): string {
  return `slnko.me/${link.shortCode}`;
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
      if (daysAgo < days) {
        result[days - 1 - daysAgo]++;
      }
    }
  }
  return result;
}

export function getRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `${days}j`;
  if (days < 30) return `${Math.floor(days / 7)}sem`;
  return `${Math.floor(days / 30)}mo`;
}
