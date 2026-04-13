import { Injectable, effect } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { EstablishmentProfile, ThemeId } from '../models/models';
import { ThemeService } from './theme.service';

const STORAGE_KEY = (uid: string) => `arenaflow_profile_${uid}`;

// Vars de superfície controladas pelo CSS [data-theme="dark"] —
// não devem ser aplicadas como inline style quando dark mode está ativo.
const SURFACE_VARS_SET = new Set([
  '--background', '--foreground', '--card', '--muted', '--muted-foreground',
  '--border', '--secondary', '--header-bg', '--input-bg', '--surface-raised', '--svg-empty',
]);

// Only accent/primary vars — surface vars (background, card, muted, border)
// are controlled exclusively by CSS [data-theme] to keep dark mode working.
const DEFAULT_VARS: Record<string, string> = {
  '--primary':            'hsl(152, 69%, 40%)',
  '--ring':               'hsl(152, 69%, 40%)',
  '--sidebar-background': 'hsl(160, 20%, 8%)',
  '--sidebar-primary':    'hsl(152, 69%, 45%)',
  '--sidebar-accent':     'hsl(160, 15%, 15%)',
  '--sidebar-border':     'hsl(160, 15%, 18%)',
  '--sidebar-foreground': 'hsl(150, 10%, 90%)',
};

const THEME_VARS: Record<ThemeId, Record<string, string>> = {
  'base': {},
  'lima': {
    '--primary':            '#A2D729',
    '--ring':               '#A2D729',
    '--background':         '#FAFFFD',
    '--muted':              '#f0fadc',
    '--muted-foreground':   '#5a7a1a',
    '--border':             '#d4eda4',
    '--sidebar-background': '#1c280a',
    '--sidebar-primary':    '#A2D729',
    '--sidebar-accent':     '#283810',
    '--sidebar-border':     '#334815',
    '--sidebar-foreground': '#e8f8d0',
  },
  'sage': {
    '--primary':            '#5B7553',
    '--ring':               '#5B7553',
    '--background':         '#f4f8f4',
    '--muted':              '#e6efe6',
    '--muted-foreground':   '#4a6048',
    '--border':             '#c4d8c4',
    '--sidebar-background': '#1a2419',
    '--sidebar-primary':    '#5B7553',
    '--sidebar-accent':     '#243020',
    '--sidebar-border':     '#2e3c2c',
    '--sidebar-foreground': '#d0e4cc',
  },
  'dark-red': {
    '--primary':            '#F24333',
    '--ring':               '#F24333',
    '--background':         '#faf8f7',
    '--muted':              '#f0eded',
    '--muted-foreground':   '#7a6460',
    '--border':             '#e0d0cc',
    '--sidebar-background': '#1e1816',
    '--sidebar-primary':    '#F24333',
    '--sidebar-accent':     '#2e2320',
    '--sidebar-border':     '#3a2c28',
    '--sidebar-foreground': '#ede0dc',
  },
};

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private uid: string | null = null;

  private defaultProfile: EstablishmentProfile = {
    name: 'Minha Arena',
    logoUrl: undefined,
    phone: '',
    email: '',
    address: '',
    city: '',
    theme: 'base',
  };

  private profileSubject = new BehaviorSubject<EstablishmentProfile>({ ...this.defaultProfile });
  profile$ = this.profileSubject.asObservable();

  constructor(private themeService: ThemeService) {
    // Reaplicar tema sempre que o modo escuro for alternado
    effect(() => {
      const _ = this.themeService.dark(); // rastreia o signal
      this.applyTheme(this.profileSubject.getValue().theme ?? 'base');
    });
  }

  /** Chamado pelo AuthService ao confirmar o usuário logado */
  init(uid: string): void {
    this.uid = uid;
    try {
      const raw = localStorage.getItem(STORAGE_KEY(uid));
      const profile = raw ? { ...this.defaultProfile, ...JSON.parse(raw) } : { ...this.defaultProfile };
      this.profileSubject.next(profile);
      this.applyTheme(profile.theme ?? 'base');
    } catch {
      this.profileSubject.next({ ...this.defaultProfile });
    }
  }

  /** Chamado pelo AuthService no logout */
  clear(): void {
    this.uid = null;
    this.profileSubject.next({ ...this.defaultProfile });
  }

  /** Remove o cache do localStorage e reseta para os valores padrão (conta nova) */
  resetStorage(): void {
    if (this.uid) {
      localStorage.removeItem(STORAGE_KEY(this.uid));
    }
    this.profileSubject.next({ ...this.defaultProfile });
    this.applyTheme('base');
  }

  getProfile(): EstablishmentProfile {
    return this.profileSubject.getValue();
  }

  updateProfile(updates: Partial<EstablishmentProfile>): void {
    if (!this.uid) return;
    const updated = { ...this.getProfile(), ...updates };
    localStorage.setItem(STORAGE_KEY(this.uid), JSON.stringify(updated));
    this.profileSubject.next(updated);
    if (updates.theme !== undefined) {
      this.applyTheme(updates.theme ?? 'base');
    }
  }

  updateLogo(base64: string): void {
    this.updateProfile({ logoUrl: base64 });
  }

  removeLogo(): void {
    this.updateProfile({ logoUrl: undefined });
  }

  applyTheme(id: ThemeId): void {
    const root = document.documentElement;
    const isDark = this.themeService.dark();
    const overrides = THEME_VARS[id] ?? {};
    const vars = { ...DEFAULT_VARS, ...overrides };
    Object.entries(vars).forEach(([key, value]) => {
      // Em dark mode, não sobrescrever as vars de superfície controladas pelo CSS
      if (isDark && SURFACE_VARS_SET.has(key)) return;
      root.style.setProperty(key, value);
    });
    // Garantir que surface vars inline não fiquem "presas" ao entrar no dark mode
    if (isDark) {
      SURFACE_VARS_SET.forEach(v => root.style.removeProperty(v));
    }
  }
}
