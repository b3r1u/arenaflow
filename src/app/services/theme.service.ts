import { Injectable, signal } from '@angular/core';

// Surface vars controlled by CSS [data-theme] — must be cleared from inline
// style when switching to dark so CSS variables take precedence.
const SURFACE_VARS = [
  '--background', '--foreground', '--card', '--muted', '--muted-foreground',
  '--border', '--secondary', '--header-bg', '--input-bg', '--surface-raised', '--svg-empty'
];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  dark = signal(false);

  constructor() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    this.apply(isDark);
  }

  toggle() {
    this.apply(!this.dark());
  }

  private apply(isDark: boolean) {
    this.dark.set(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    // Remove any inline surface vars set by ProfileService so CSS dark vars take over
    if (isDark) {
      SURFACE_VARS.forEach(v => document.documentElement.style.removeProperty(v));
    }
  }
}
