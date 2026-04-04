import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { EstablishmentProfile, ThemeId } from '../models/models';

const STORAGE_KEY = 'arenaflow_profile';

const DEFAULT_VARS: Record<string, string> = {
  '--primary':            'hsl(152, 69%, 40%)',
  '--ring':               'hsl(152, 69%, 40%)',
  '--background':         'hsl(150, 10%, 97%)',
  '--muted':              'hsl(150, 10%, 94%)',
  '--muted-foreground':   'hsl(160, 10%, 45%)',
  '--border':             'hsl(150, 12%, 89%)',
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
  private defaultProfile: EstablishmentProfile = {
    name: 'Minha Arena',
    logoUrl: undefined,
    phone: '',
    email: '',
    address: '',
    city: '',
    theme: 'base',
  };

  private profileSubject = new BehaviorSubject<EstablishmentProfile>(this.load());
  profile$ = this.profileSubject.asObservable();

  constructor() {
    this.applyTheme(this.profileSubject.getValue().theme ?? 'base');
  }

  private load(): EstablishmentProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...this.defaultProfile, ...JSON.parse(raw) } : { ...this.defaultProfile };
    } catch {
      return { ...this.defaultProfile };
    }
  }

  getProfile(): EstablishmentProfile {
    return this.profileSubject.getValue();
  }

  updateProfile(updates: Partial<EstablishmentProfile>): void {
    const updated = { ...this.getProfile(), ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
    const overrides = THEME_VARS[id] ?? {};
    const vars = { ...DEFAULT_VARS, ...overrides };
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }
}
