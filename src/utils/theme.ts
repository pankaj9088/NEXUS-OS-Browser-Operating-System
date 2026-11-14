import { AccentColor } from '../types/os';

export interface AccentTheme {
  primary: string;
  glow: string;
  border: string;
  bgLight: string;
  text: string;
  activeIndicator: string;
  ring: string;
}

export const ACCENT_THEMES: Record<AccentColor, AccentTheme> = {
  cyan: {
    primary: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.35)',
    border: 'rgba(6, 182, 212, 0.45)',
    bgLight: 'rgba(6, 182, 212, 0.12)',
    text: 'text-cyan-400',
    activeIndicator: 'bg-cyan-400',
    ring: 'focus:ring-cyan-500/50',
  },
  violet: {
    primary: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.35)',
    border: 'rgba(168, 85, 247, 0.45)',
    bgLight: 'rgba(168, 85, 247, 0.12)',
    text: 'text-purple-400',
    activeIndicator: 'bg-purple-400',
    ring: 'focus:ring-purple-500/50',
  },
  emerald: {
    primary: '#10b981',
    glow: 'rgba(16, 185, 129, 0.35)',
    border: 'rgba(16, 185, 129, 0.45)',
    bgLight: 'rgba(16, 185, 129, 0.12)',
    text: 'text-emerald-400',
    activeIndicator: 'bg-emerald-400',
    ring: 'focus:ring-emerald-500/50',
  },
  amber: {
    primary: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.35)',
    border: 'rgba(245, 158, 11, 0.45)',
    bgLight: 'rgba(245, 158, 11, 0.12)',
    text: 'text-amber-400',
    activeIndicator: 'bg-amber-400',
    ring: 'focus:ring-amber-500/50',
  },
  rose: {
    primary: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.35)',
    border: 'rgba(244, 63, 94, 0.45)',
    bgLight: 'rgba(244, 63, 94, 0.12)',
    text: 'text-rose-400',
    activeIndicator: 'bg-rose-400',
    ring: 'focus:ring-rose-500/50',
  },
};
