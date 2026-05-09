import { Component, OnInit, OnDestroy, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { ToastService, ToastMessage } from '../services/toast.service';
import { ProfileService } from '../services/profile.service';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { EstablishmentService } from '../services/establishment.service';
import { EstablishmentProfile } from '../models/models';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RouterLink, RouterLinkActive],
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
          <a *ngFor="let item of navItems()"
             [routerLink]="item.path"
             routerLinkActive="nav-active"
             [routerLinkActiveOptions]="{exact: item.path === '/'}"
             (click)="sidebarOpen = false"
             class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 nav-item"
             [class.nav-accent]="item.accent"
             [class.nav-locked]="item.locked">
            <span class="material-icons" style="font-size:1.2rem;width:1.4rem;text-align:center">{{ item.icon }}</span>
            <span class="flex-1">{{ item.label }}</span>
            <span *ngIf="item.locked" class="material-icons nav-lock-icon" style="font-size:0.9rem;opacity:0.55">lock</span>
          </a>
        </nav>

        <!-- Footer -->
        <div class="px-3 pb-20 lg:pb-5" style="border-top:1px solid var(--sidebar-border);padding-top:0.75rem">
          <a routerLink="/perfil"
             class="flex items-center gap-3 px-4 py-3 rounded-xl text-xs transition-all duration-150 cursor-pointer nav-item"
             (click)="sidebarOpen = false">
            <div class="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center font-bold text-white text-xs font-heading flex-shrink-0"
                 style="background-color:var(--sidebar-primary)">
              <img *ngIf="profile?.logoUrl" [src]="profile!.logoUrl" alt="Logo" class="w-full h-full object-cover" />
              <img *ngIf="!profile?.logoUrl && googleUser()?.photoURL" [src]="googleUser()!.photoURL!" alt="Avatar" class="w-full h-full object-cover" />
              <span *ngIf="!profile?.logoUrl && !googleUser()?.photoURL">{{ profileInitials }}</span>
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
                style="border-bottom:1px solid var(--border);background:var(--header-bg);backdrop-filter:blur(12px)">
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
      <div *ngIf="toast?.type === 'error'" class="toast toast-error">{{ toast!.text }}</div>
      <div *ngIf="toast?.type === 'success'" class="toast">{{ toast!.text }}</div>

      <!-- ───── Botão flutuante de suporte ───── -->
      <button class="support-fab" (click)="supportOpen = !supportOpen" [class.support-fab--active]="supportOpen" aria-label="Suporte">
        <span class="material-icons" style="font-size:1.5rem">{{ supportOpen ? 'close' : 'chat_bubble' }}</span>
      </button>

      <!-- Painel de chamados -->
      <div class="support-panel" [class.support-panel--open]="supportOpen">

        <!-- Cabeçalho -->
        <div class="support-panel__header">
          <div class="flex items-center gap-3">
            <div class="support-panel__avatar">
              <span class="material-icons" style="font-size:1.2rem">support_agent</span>
            </div>
            <div>
              <p class="font-semibold text-sm" style="color:var(--foreground)">Suporte ArenaFlow</p>
              <p class="text-xs" style="color:var(--muted-foreground)">Resposta em até 24h</p>
            </div>
          </div>
          <button class="support-panel__close" (click)="supportOpen = false">
            <span class="material-icons" style="font-size:1.1rem">close</span>
          </button>
        </div>

        <!-- Corpo de mensagens -->
        <div class="support-panel__body" #chatBody>

          <!-- Mensagem de boas-vindas -->
          <div class="support-msg support-msg--in">
            <div class="support-msg__bubble">
              <p>Olá! 👋 Como podemos ajudar você hoje?</p>
              <p class="mt-1" style="opacity:0.75;font-size:0.72rem">Descreva sua dúvida ou problema e nossa equipe responderá em breve.</p>
            </div>
            <span class="support-msg__time">Agora</span>
          </div>

          <!-- Mensagens do usuário -->
          <ng-container *ngFor="let msg of supportMessages">
            <div class="support-msg support-msg--out">
              <div class="support-msg__bubble support-msg__bubble--out">{{ msg.text }}</div>
              <span class="support-msg__time">{{ msg.time }}</span>
            </div>
          </ng-container>

          <!-- Indicador "aguardando" após envio -->
          <div *ngIf="supportMessages.length > 0 && !supportReplied" class="support-msg support-msg--in">
            <div class="support-msg__bubble support-typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- Aviso de pré-lançamento -->
        <div class="support-panel__notice">
          <span class="material-icons flex-shrink-0" style="font-size:0.9rem">info</span>
          <span>Canal em breve. Sua mensagem será registrada.</span>
        </div>

        <!-- Input de mensagem -->
        <div class="support-panel__footer">
          <textarea class="support-panel__input"
                    [(ngModel)]="supportInput"
                    (keydown.enter)="onSupportEnter($event)"
                    placeholder="Digite sua mensagem..."
                    rows="1"></textarea>
          <button class="support-panel__send"
                  [disabled]="!supportInput.trim()"
                  (click)="sendSupportMessage()">
            <span class="material-icons" style="font-size:1.1rem">send</span>
          </button>
        </div>
      </div>
      <!-- ───── fim suporte ───── -->

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
      position: relative;
      overflow: hidden;
      color: rgba(144,161,154,0.8) !important;
    }
    .nav-accent::after {
      content: '';
      position: absolute;
      top: 0; left: -75%;
      width: 50%; height: 100%;
      background: linear-gradient(120deg, transparent, rgba(255,255,255,0.18), transparent);
      animation: nav-shine 2.8s ease-in-out infinite;
    }
    @keyframes nav-shine {
      0%   { left: -75%; }
      40%  { left: 125%; }
      100% { left: 125%; }
    }
    .nav-accent:hover {
      background-color: var(--sidebar-accent) !important;
      color: var(--sidebar-foreground) !important;
    }
    .nav-active.nav-accent {
      color: white !important;
    }
    .nav-active.nav-accent::after {
      display: none;
    }
    .nav-locked {
      opacity: 0.65;
    }
    .nav-locked:hover {
      opacity: 0.85;
    }
    .toast-error {
      background-color: #ef4444 !important;
    }

    /* ── Floating support button ── */
    .support-fab {
      position: fixed;
      bottom: 5.5rem;
      right: 1.25rem;
      z-index: 200;
      width: 3.25rem;
      height: 3.25rem;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 24px rgba(34,197,94,0.4);
      transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s;
    }
    .support-fab:hover {
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 10px 30px rgba(34,197,94,0.5);
    }
    .support-fab--active {
      background: var(--muted-foreground);
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }
    @media (min-width: 1024px) {
      .support-fab {
        bottom: 1.5rem;
        right: 1.5rem;
      }
    }

    /* ── Support panel ── */
    .support-panel {
      position: fixed;
      bottom: 9rem;
      right: 1.25rem;
      z-index: 199;
      width: min(22rem, calc(100vw - 2rem));
      max-height: 70vh;
      border-radius: 1.25rem;
      background: var(--card);
      border: 1px solid var(--border);
      box-shadow: 0 20px 60px rgba(0,0,0,0.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0.92) translateY(12px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease;
      transform-origin: bottom right;
    }
    .support-panel--open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }
    @media (min-width: 1024px) {
      .support-panel {
        bottom: 5.5rem;
        right: 1.5rem;
      }
    }

    .support-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1rem 0.875rem;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
      background: linear-gradient(135deg, hsl(152,69%,40%,0.06), transparent);
    }
    .support-panel__avatar {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), hsl(152,69%,30%));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .support-panel__close {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      border: none;
      background: var(--muted);
      color: var(--muted-foreground);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    .support-panel__close:hover { background: var(--border); }

    .support-panel__body {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .support-msg { display: flex; flex-direction: column; max-width: 85%; }
    .support-msg--in  { align-self: flex-start; }
    .support-msg--out { align-self: flex-end; align-items: flex-end; }

    .support-msg__bubble {
      padding: 0.55rem 0.9rem;
      border-radius: 1rem;
      font-size: 0.82rem;
      line-height: 1.45;
      background: var(--muted);
      color: var(--foreground);
      border-bottom-left-radius: 0.25rem;
    }
    .support-msg__bubble--out {
      background: var(--primary);
      color: white;
      border-bottom-left-radius: 1rem;
      border-bottom-right-radius: 0.25rem;
    }
    .support-msg__time {
      font-size: 0.67rem;
      color: var(--muted-foreground);
      margin-top: 0.2rem;
      padding: 0 0.25rem;
    }

    /* Typing indicator */
    .support-typing {
      display: flex !important;
      gap: 0.3rem;
      padding: 0.65rem 0.9rem;
      align-items: center;
    }
    .support-typing span {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 50%;
      background: var(--muted-foreground);
      animation: typing-dot 1.2s infinite ease-in-out;
    }
    .support-typing span:nth-child(2) { animation-delay: 0.2s; }
    .support-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing-dot {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-4px); opacity: 1; }
    }

    .support-panel__notice {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 1rem;
      font-size: 0.7rem;
      color: var(--muted-foreground);
      background: hsl(38,92%,50%,0.07);
      border-top: 1px solid hsl(38,92%,50%,0.15);
      flex-shrink: 0;
    }

    .support-panel__footer {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      padding: 0.75rem;
      border-top: 1px solid var(--border);
      flex-shrink: 0;
    }
    .support-panel__input {
      flex: 1;
      resize: none;
      border-radius: 0.75rem;
      border: 1.5px solid var(--border);
      background: var(--background);
      color: var(--foreground);
      padding: 0.55rem 0.75rem;
      font-size: 0.82rem;
      line-height: 1.4;
      max-height: 6rem;
      outline: none;
      transition: border-color 0.15s;
      font-family: inherit;
    }
    .support-panel__input:focus { border-color: var(--primary); }
    .support-panel__input::placeholder { color: var(--muted-foreground); }
    .support-panel__send {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      border: none;
      background: var(--primary);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.15s, transform 0.15s;
    }
    .support-panel__send:disabled { opacity: 0.4; cursor: default; transform: none; }
    .support-panel__send:not(:disabled):hover { transform: scale(1.08); }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  sidebarOpen   = false;
  isDesktop     = false;
  toast: ToastMessage | null = null;
  currentPageLabel = '';
  profile: EstablishmentProfile = { name: 'Minha Arena' };
  private subs: Subscription[] = [];

  // ── Suporte ──
  supportOpen    = false;
  supportInput   = '';
  supportReplied = false;
  supportMessages: { text: string; time: string }[] = [];

  sendSupportMessage() {
    const text = this.supportInput.trim();
    if (!text) return;
    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    this.supportMessages.push({ text, time });
    this.supportInput   = '';
    this.supportReplied = false;
    // TODO: integrar com backend de chamados
  }

  onSupportEnter(e: Event) {
    const ke = e as KeyboardEvent;
    if (!ke.shiftKey) { e.preventDefault(); this.sendSupportMessage(); }
  }

  get profileInitials(): string {
    return (this.profile?.name || 'AF').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  private readonly PLATFORM_ADMIN_EMAIL = 'connectsolve.ti@gmail.com';

  /** Nav items derivados do plano ativo — itens bloqueados exibem ícone de cadeado */
  navItems = computed(() => {
    const f            = this.establishmentService.planFeatures();
    const isPlatformAdmin = this.googleUser()?.email === this.PLATFORM_ADMIN_EMAIL;
    const items = [
      { label: 'Dashboard',   path: '/',            icon: 'dashboard',         accent: false, locked: false },
      { label: 'Quadras',     path: '/quadras',     icon: 'sports_volleyball', accent: false, locked: false },
      { label: 'Clientes',    path: '/clientes',    icon: 'group',             accent: false, locked: false },
      { label: 'Mensalistas', path: '/mensalistas', icon: 'card_membership',   accent: false, locked: !f.mensalistas },
      { label: 'Promoções',   path: '/promocoes',   icon: 'local_offer',       accent: false, locked: !f.promotions },
      { label: 'Relatórios',  path: '/relatorios',  icon: 'bar_chart',         accent: false, locked: !f.advanced_reports },
      { label: 'Reservas',    path: '/reservas',    icon: 'shopping_cart',     accent: false, locked: false },
      { label: 'Financeiro',  path: '/financeiro',  icon: 'account_balance',   accent: false, locked: false },
      { label: 'Perfil',      path: '/perfil',      icon: 'settings',          accent: false, locked: false },
      { label: 'Planos',      path: '/planos',      icon: 'workspace_premium', accent: true,  locked: false },
    ];
    if (isPlatformAdmin) {
      items.push({ label: 'Gestão de Planos', path: '/platform/plans', icon: 'admin_panel_settings', accent: false, locked: false });
    }
    return items;
  });

  bottomNavItems = [
    { label: 'Dashboard',    shortLabel: 'Início',   path: '/',            icon: 'dashboard'         },
    { label: 'Quadras',      shortLabel: 'Quadras',  path: '/quadras',      icon: 'sports_volleyball' },
    { label: 'Clientes',     shortLabel: 'Clientes', path: '/clientes',     icon: 'group'             },
    { label: 'Reservas',     shortLabel: 'Reservar', path: '/reservas',     icon: 'shopping_cart'     },
  ];

  googleUser = this.authService.user;

  constructor(
    private toastService: ToastService,
    private router: Router,
    private profileService: ProfileService,
    private authService: AuthService,
    public themeService: ThemeService,
    private establishmentService: EstablishmentService,
  ) {}

  async logout() {
    this.establishmentService.reset();
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnInit() {
    this.checkDesktop();
    this.profile = this.profileService.getProfile();
    // Registra usuário no banco e verifica estabelecimento
    this.establishmentService.init();
    this.subs.push(this.profileService.profile$.subscribe(p => this.profile = p));
    this.subs.push(this.toastService.message$.subscribe(msg => this.toast = msg));
    this.subs.push(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
        const url = e.urlAfterRedirects || e.url;
        const match = this.navItems().find(n => n.path === '/' ? url === '/' : url.startsWith(n.path));
        this.currentPageLabel = match?.label || '';
        if (!this.isDesktop) this.sidebarOpen = false;
      })
    );
    // set initial label
    const cur = this.navItems().find(n => n.path === '/' ? this.router.url === '/' : this.router.url.startsWith(n.path));
    this.currentPageLabel = cur?.label || '';
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }

  @HostListener('window:resize')
  checkDesktop() { this.isDesktop = window.innerWidth >= 1024; }

  isActive(path: string): boolean {
    return path === '/' ? this.router.url === '/' : this.router.url.startsWith(path);
  }
}
