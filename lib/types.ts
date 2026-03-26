export interface ClickEvent {
  timestamp: number;
  referer?: string;
}

export interface ShortLink {
  id: string;
  shortCode: string;
  originalUrl: string;
  createdAt: number;
  clicks: ClickEvent[];
  userId: string; // propriétaire du lien
}
