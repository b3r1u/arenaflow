import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { ProfileService } from '../services/profile.service';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { EstablishmentProfile } from '../models/models';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen overflow-hidden" style="background-color: var(--background)">

      <!-- Mobile overlay -->
      <div *ngIf="sidebarOpen"
           class="fixed inset-0 z-30 lg:hidden"
           style="background:rgba(0,0,0,0.5);backdrop-filter:blur(2px)"
           (click)="sidebarOpen = false"></div>

      <!-- Sidebar (desktop always visible, mobile slide-in) -->
      <aside class="fixed inset-y-0 left-0 z-40 w-64 flex flex-col"
             [style.transform]="sidebarOpen || isDesktop ? 'translateX(0)' : 'translateX(-100%)'"
             style="background-color:var(--sidebar-background);transition:transform 0.28s cubic-bezier(0.4,0,0.2,1)">

        <!-- Logo -->
        <div class="flex items-center gap-3 px-5 py-5" style="border-bottom:1px solid var(--sidebar-border)">
          <div class="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center font-bold text-white text-sm font-heading flex-shrink-0"
               style="background-color:var(--sidebar-primary);box-shadow:0 4px 12px rgba(34,197,94,0.35)">
            <img *ngIf="profile?.logoUrl" [src]="profile!.logoUrl" alt="Logo" class="w-full h-full object-cover" />
            <span *ngIf="!profile?.logoUrl">{{ profileInitials }}</span>
          </div>
          <span class="font-heading font-bold text-lg" style="color:var(--sidebar-foreground)">{{ profile?.name || 'ArenaFlow' }}</span>
        </div>

        <!-- Nav -->
        <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <a *ngFor="let item of navItems"
             [routerLink]="item.path"
             routerLinkActive="nav-active"
             [routerLinkActiveOptions]="{exact: item.path === '/'}"
             (click)="sidebarOpen = false"
             class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 nav-item"
             [class.nav-accent]="item.accent">
            <span class="material-icons" style="font-size:1.2rem;width:1.4rem;text-align:center">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </a>
        </nav>

        <!-- Footer -->
        <div class="px-3 pb-5" style="border-top:1px solid var(--sidebar-border);padding-top:0.75rem">
          <a routerLink="/perfil"
             class="flex items-center gap-3 px-4 py-3 rounded-xl text-xs transition-all duration-150 cursor-pointer nav-item"
             (click)="sidebarOpen = false">
            <div class="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center font-bold text-white text-xs font-heading flex-shrink-0"
                 style="background-color:var(--sidebar-primary)">
              <img *ngIf="googleUser()?.photoURL" [src]="googleUser()!.photoURL!" alt="Avatar" class="w-full h-full object-cover" />
              <span *ngIf="!googleUser()?.photoURL">{{ profileInitials }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-heading font-semibold text-xs truncate" style="color:var(--sidebar-foreground)">{{ googleUser()?.displayName || profile?.name || 'Minha Arena' }}</div>
              <div class="text-xs truncate" style="color:var(--sidebar-foreground);opacity:0.5">{{ googleUser()?.email || 'Configurar perfil' }}</div>
            </div>
          </a>
          <button (click)="logout()"
                  class="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all duration-150 mt-1 nav-item">
            <span class="material-icons" style="font-size:1rem">logout</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <!-- Main area -->
      <div class="flex-1 flex flex-col overflow-hidden" [style.margin-left]="isDesktop ? '16rem' : '0'">

        <!-- Top header -->
        <header class="flex-shrink-0 h-14 flex items-center px-4 gap-3 z-20"
                style="border-bottom:1px solid var(--border);background:rgba(255,255,255,0.85);backdrop-filter:blur(12px)">
          <!-- Hamburger (mobile only) -->
          <button class="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl btn-ghost"
                  (click)="sidebarOpen = !sidebarOpen" aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <line x1="3" y1="6"  x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <!-- Brand (mobile) -->
          <div class="flex items-center gap-2 lg:hidden">
            <div class="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center text-white text-xs font-bold font-heading"
                 style="background-color:var(--primary)">
              <img *ngIf="profile?.logoUrl" [src]="profile!.logoUrl" alt="Logo" class="w-full h-full object-cover" />
              <span *ngIf="!profile?.logoUrl">{{ profileInitials }}</span>
            </div>
            <span class="font-heading font-semibold text-sm" style="color:var(--foreground)">{{ profile?.name || 'ArenaFlow' }}</span>
          </div>

          <!-- Current page title (mobile) -->
          <span class="ml-auto text-xs font-medium lg:hidden" style="color:var(--muted-foreground)">
            {{ currentPageLabel }}
          </span>

          <!-- Dark mode toggle -->
          <button (click)="themeService.toggle()"
                  class="flex items-center justify-center w-9 h-9 rounded-xl btn-ghost flex-shrink-0"
                  [class.ml-auto]="true"
                  [class.lg\:ml-0]="true"
                  [title]="themeService.dark() ? 'Modo claro' : 'Modo escuro'">
            <span *ngIf="!themeService.dark()" class="material-icons" style="font-size:1.2rem">dark_mode</span>
            <span *ngIf="themeService.dark()" class="material-icons" style="font-size:1.2rem;color:var(--accent)">light_mode</span>
          </button>
        </header>

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto p-4 lg:p-6 mobile-scroll">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Bottom navigation (mobile only) -->
      <nav class="bottom-nav lg:hidden">
        <a *ngFor="let item of bottomNavItems"
           [routerLink]="item.path"
           class="bottom-nav-item"
           [class.active]="isActive(item.path)"
           (click)="sidebarOpen = false">
          <span class="material-icons icon">{{ item.icon }}</span>
          <span>{{ item.shortLabel }}</span>
        </a>
      </nav>

      <!-- Toast -->
      <div *ngIf="toastMessage" class="toast">{{ toastMessage }}</div>
    </div>
  `,
  styles: [`
    .nav-item {
      color: rgba(144,161,154,0.8);
    }
    .nav-item:hover {
      background-color: var(--sidebar-accent);
      color: var(--sidebar-foreground);
    }
    .nav-active {
      background-color: var(--sidebar-primary) !important;
      color: white !important;
      box-shadow: 0 4px 14px rgba(34,197,94,0.25);
    }
    .nav-accent {
      border: 1px solid rgba(251,191,36,0.28);
      background-color: rgba(251,191,36,0.08);
      color: rgba(251,191,36,0.85) !important;
    }
    .nav-accent:hover {
      background-color: rgba(251,191,36,0.16) !important;
      color: rgba(251,191,36,1) !important;
    }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  sidebarOpen = false;
  isDesktop = false;
  toastMessage: string | null = null;
  currentPageLabel = '';
  profile: EstablishmentProfile = { name: 'Minha Arena' };
  private subs: Subscription[] = [];

  get profileInitials(): string {
    return (this.profile?.name || 'AF').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  navItems = [
    { label: 'Dashboard',     path: '/',             icon: 'dashboard',         accent: false },
    { label: 'Agendamentos',  path: '/agendamentos', icon: 'calendar_month',    accent: false },
    { label: 'Quadras',       path: '/quadras',      icon: 'sports_volleyball', accent: false },
    { label: 'Clientes',      path: '/clientes',     icon: 'group',             accent: false },
    { label: 'Mensalistas',   path: '/mensalistas',  icon: 'card_membership',   accent: false },
    { label: 'Promoções',     path: '/promocoes',    icon: 'local_offer',       accent: false },
    { label: 'Relatórios',    path: '/relatorios',   icon: 'bar_chart',         accent: false },
    { label: 'Reservas',      path: '/reservas',     icon: 'shopping_cart',     accent: true  },
    { label: 'Perfil',        path: '/perfil',       icon: 'settings',          accent: false },
    { label: 'Planos',        path: '/planos',       icon: 'workspace_premium', accent: true  },
  ];

  bottomNavItems = [
    { label: 'Dashboard',    shortLabel: 'Início',   path: '/',            icon: 'dashboard'         },
    { label: 'Agendamentos', shortLabel: 'Agenda',   path: '/agendamentos', icon: 'calendar_month'   },
    { label: 'Quadras',      shortLabel: 'Quadras',  path: '/quadras',      icon: 'sports_volleyball' },
    { label: 'Clientes',     shortLabel: 'Clientes', path: '/clientes',     icon: 'group'             },
    { label: 'Reservas',     shortLabel: 'Reservar', path: '/reservas',     icon: 'shopping_cart'     },
  ];

  googleUser = this.authService.user;

  constructor(private toast: ToastService, private router: Router, private profileService: ProfileService, private authService: AuthService, public themeService: ThemeService) {}

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnInit() {
    this.checkDesktop();
    this.profile = this.profileService.getProfile();
    this.subs.push(this.profileService.profile$.subscribe(p => this.profile = p));
    this.subs.push(this.toast.message$.subscribe(msg => this.toastMessage = msg));
    this.subs.push(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
        const url = e.urlAfterRedirects || e.url;
        const match = this.navItems.find(n => n.path === '/' ? url === '/' : url.startsWith(n.path));
        this.currentPageLabel = match?.label || '';
        if (!this.isDesktop) this.sidebarOpen = false;
      })
    );
    // set initial label
    const cur = this.navItems.find(n => n.path === '/' ? this.router.url === '/' : this.router.url.startsWith(n.path));
    this.currentPageLabel = cur?.label || '';
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }

  @HostListener('window:resize')
  checkDesktop() { this.isDesktop = window.innerWidth >= 1024; }

  isActive(path: string): boolean {
    return path === '/' ? this.router.url === '/' : this.router.url.startsWith(path);
  }
}
