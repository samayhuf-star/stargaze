export const NIGHT_RED = {
  star: '#ff6a5c',
  line: 'rgba(255,90,76,0.35)',
  label: '#ff8a7c',
  planet: '#ff5040',
  horizon: 'rgba(255,90,76,0.55)',
  accent: '#ff5a4c',
};

export const COLORS = {
  line: 'rgba(120,170,255,0.30)',
  label: 'rgba(210,225,255,0.85)',
  constLabel: 'rgba(130,170,255,0.55)',
  horizon: 'rgba(255,255,255,0.35)',
  accent: '#F2B441',
  panel: 'rgba(20,27,58,0.86)',
  panelBorder: 'rgba(169,178,204,0.22)',
  text: '#F4F1E8',
  muted: '#A9B2CC',
  bg: '#0A0F24',
  card: '#141B3A',
  onAccent: '#0A0F24',
  dim: '#46527A',
};

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c: number[]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/** Sky background colour from the Sun's altitude: deep night below -18°, daylight blue above 0°. */
export function skyColor(sunAlt: number, night: boolean): string {
  if (night) return '#0a0000';
  const t = Math.max(0, Math.min(1, (sunAlt + 18) / 18));
  const a = hex('#03050d');
  const b = hex('#3a5f8f');
  return toHex(a.map((v, i) => v + (b[i] - v) * t));
}

/** Heading typeface, loaded in the root layout. Falls back to the system font until ready. */
export const HEADING_FONT = 'SpaceGrotesk_700Bold';
