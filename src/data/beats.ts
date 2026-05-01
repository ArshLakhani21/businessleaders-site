// Beat metadata mirrored from engine repo's config/beats.json.
// Keep this in sync if the engine's beats.json changes.

export interface Beat {
  slug: 'business' | 'finance' | 'international' | 'entertainment' | 'sports' | 'lifestyle' | 'health' | 'travel' | 'astro';
  name: string;
  displayName: string;
  navLabel: string;
  accentColor: string;
  description: string;
  footer?: string;
}

export const BEATS: readonly Beat[] = [
  { slug: 'business', name: 'Business', displayName: 'Business', navLabel: 'Business', accentColor: '#0D1B2A', description: 'Indian companies, startups, deals, leadership moves, sector trends.' },
  { slug: 'finance', name: 'Finance', displayName: 'Finance & Markets', navLabel: 'Finance & Markets', accentColor: '#16A34A', description: 'Stock markets, RBI, banking, IPOs, mutual funds, personal finance, crypto policy.' },
  { slug: 'international', name: 'International News', displayName: 'International', navLabel: 'International', accentColor: '#2563EB', description: 'World affairs with Indian relevance preferred. Geopolitics, foreign markets, diaspora.' },
  { slug: 'entertainment', name: 'Entertainment', displayName: 'Entertainment', navLabel: 'Entertainment', accentColor: '#7C3AED', description: 'Bollywood, regional cinema, OTT releases, music, awards, celebrity news.' },
  { slug: 'sports', name: 'Sports', displayName: 'Sports', navLabel: 'Sports', accentColor: '#DC2626', description: 'Cricket (anchor sport), football, kabaddi, badminton, athletics, Olympics.' },
  { slug: 'lifestyle', name: 'Lifestyle', displayName: 'Lifestyle', navLabel: 'Lifestyle', accentColor: '#D97706', description: 'Food, fashion, weddings, home, relationships, design, urban culture.' },
  { slug: 'health', name: 'Health and Fitness', displayName: 'Health & Fitness', navLabel: 'Health & Fitness', accentColor: '#0D9488', description: 'Medical research, public health, fitness, nutrition, wellness trends.', footer: 'This article is for informational purposes only and does not substitute medical advice. Consult a qualified physician for any health concern.' },
  { slug: 'travel', name: 'Travel', displayName: 'Travel', navLabel: 'Travel', accentColor: '#0891B2', description: 'Indian destinations, international travel for Indians, airline news, hotels, visa updates.' },
  { slug: 'astro', name: 'Astrology', displayName: 'Astrology', navLabel: 'Astro', accentColor: '#6D28D9', description: 'Vedic astrology, daily and weekly horoscopes, planetary movements, festival significance, remedies.', footer: 'Astrological content reflects traditional Vedic interpretation as reported in source publications. Readers should treat it as cultural and traditional commentary rather than verified prediction.' },
];

export function getBeat(slug: string): Beat | undefined {
  return BEATS.find((b) => b.slug === slug);
}

export const BEAT_SLUGS = BEATS.map((b) => b.slug);
