import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { BookingAdminService } from '../../services/booking-admin.service';
import { Booking, BookingPaymentGroup } from '../../models/models';

type FilterStatus = 'todas' | 'pago' | 'parcial' | 'pendente' | 'não informado' | 'cancelado';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 class="font-heading font-bold text-2xl lg:text-3xl" style="color:var(--foreground)">Gestão de Reservas</h1>
          <p class="text-sm mt-0.5" style="color:var(--muted-foreground)">Gerencie e acompanhe todas as reservas do estabelecimento</p>
        </div>
        <!-- Seletor de mês + Link compartilhável -->
        <div class="flex items-center gap-2 self-start sm:self-auto">
          <input type="month"
                 class="input text-sm"
                 style="width:auto;padding:0.4rem 0.75rem"
                 [value]="selectedMonth"
                 (change)="onMonthChange($event)"
                 [max]="maxMonth" />
          <button class="btn-outline flex items-center gap-2" (click)="copyLink()">
            <span class="material-icons" style="font-size:1rem">share</span>
            Compartilhar link
          </button>
        </div>
      </div>

      <!-- KPIs rápidos -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div class="card p-4">
          <div class="text-xs font-medium mb-1" style="color:var(--muted-foreground)">Total</div>
          <div *ngIf="!loadingKpi" class="font-heading font-bold text-2xl" style="color:var(--foreground)">{{ allBookings.length }}</div>
          <div *ngIf="loadingKpi" class="sk-box h-8 w-14 rounded-lg mt-1"></div>
        </div>
        <div class="card p-4">
          <div class="text-xs font-medium mb-1" style="color:var(--muted-foreground)">Confirmadas</div>
          <div *ngIf="!loadingKpi" class="font-heading font-bold text-2xl" style="color:var(--primary)">{{ countByStatus('pago') }}</div>
          <div *ngIf="loadingKpi" class="sk-box h-8 w-10 rounded-lg mt-1"></div>
        </div>
        <div class="card p-4">
          <div class="text-xs font-medium mb-1" style="color:var(--muted-foreground)">Pendentes/Parciais</div>
          <div *ngIf="!loadingKpi" class="font-heading font-bold text-2xl" style="color:hsl(36,80%,38%)">{{ countByStatus('pendente') + countByStatus('parcial') }}</div>
          <div *ngIf="loadingKpi" class="sk-box h-8 w-10 rounded-lg mt-1"></div>
        </div>
        <div class="card p-4">
          <div class="text-xs font-medium mb-1" style="color:var(--muted-foreground)">Receita total</div>
          <div *ngIf="!loadingKpi" class="font-heading font-bold text-xl" style="color:var(--foreground)">R\${{ totalRevenue | number:'1.0-0' }}</div>
          <div *ngIf="loadingKpi" class="sk-box h-8 w-20 rounded-lg mt-1"></div>
        </div>
        <div class="card p-4 col-span-2 sm:col-span-1">
          <div class="text-xs font-medium mb-1" style="color:var(--muted-foreground)">Canceladas</div>
          <div *ngIf="!loadingKpi" class="font-heading font-bold text-2xl" style="color:var(--destructive)">{{ countByStatus('cancelado') }}</div>
          <div *ngIf="loadingKpi" class="sk-box h-8 w-10 rounded-lg mt-1"></div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="flex flex-col sm:flex-row gap-3 mb-4">
        <!-- Busca -->
        <div style="position:relative;flex:1">
          <span class="material-icons" style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);font-size:1rem;color:var(--muted-foreground);pointer-events:none">search</span>
          <input class="input" style="padding-left:2.25rem" [(ngModel)]="search" (ngModelChange)="resetPage()" placeholder="Buscar por cliente ou quadra...">
        </div>
        <!-- Filtro status -->
        <div class="flex gap-1 p-1 rounded-xl flex-shrink-0" style="background-color:var(--muted)">
          <button *ngFor="let f of filters"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  [style.background]="activeFilter === f.value ? 'var(--card)' : 'transparent'"
                  [style.color]="activeFilter === f.value ? 'var(--foreground)' : 'var(--muted-foreground)'"
                  [style.box-shadow]="activeFilter === f.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'"
                  (click)="activeFilter = f.value; resetPage()">
            {{ f.label }}
          </button>
        </div>
      </div>

      <!-- Skeleton de loading -->
      <div *ngIf="loading" class="space-y-2">
        <div *ngFor="let s of skeletonRows" class="card p-4">
          <div class="flex items-start gap-3">
            <div class="sk-box w-9 h-9 rounded-xl flex-shrink-0"></div>
            <div class="flex-1 min-w-0 space-y-2 pt-1">
              <div class="sk-box h-3.5 rounded-lg w-2/5"></div>
              <div class="sk-box h-3 rounded-lg w-3/4"></div>
            </div>
            <div class="flex flex-col items-end gap-2 flex-shrink-0">
              <div class="sk-box h-3.5 rounded-lg w-12"></div>
              <div class="sk-box h-6 rounded-lg w-20"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista de reservas -->
      <div class="space-y-2" *ngIf="!loading && filtered.length > 0">
        <div *ngFor="let b of paged"
             class="card p-4 transition-all"
             style="cursor:default">
          <div class="flex items-start gap-3">
            <!-- Avatar inicial -->
            <div class="w-9 h-9 rounded-xl flex items-center justify-center font-heading font-bold text-sm flex-shrink-0"
                 style="background-color:hsl(152,69%,40%,0.1);color:var(--primary)">
              {{ b.client_name.charAt(0).toUpperCase() }}
            </div>

            <!-- Info principal -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-heading font-semibold text-sm" style="color:var(--foreground)">{{ b.client_name }}</span>
                  <!-- Badge divisão -->
                  <span *ngIf="b.split_payment"
                        class="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-md font-medium"
                        style="background:hsl(217,91%,60%,0.12);color:hsl(217,91%,45%)">
                    <span class="material-icons" style="font-size:0.7rem">group</span>
                    Dividido
                  </span>
                </div>
                <span class="badge flex-shrink-0" [ngClass]="statusClass(b.payment_status)">{{ b.payment_status }}</span>
              </div>
              <div class="flex items-center gap-3 mt-1 flex-wrap">
                <span class="text-xs flex items-center gap-1" style="color:var(--muted-foreground)">
                  <span class="material-icons" style="font-size:0.85rem">sports_volleyball</span>
                  {{ b.court_name || 'Quadra' }}
                </span>
                <span class="text-xs flex items-center gap-1" style="color:var(--muted-foreground)">
                  <span class="material-icons" style="font-size:0.85rem">calendar_today</span>
                  {{ b.date | date:'dd/MM/yyyy' }}
                </span>
                <span class="text-xs flex items-center gap-1" style="color:var(--muted-foreground)">
                  <span class="material-icons" style="font-size:0.85rem">schedule</span>
                  {{ b.start_hour }}–{{ b.end_hour }}
                </span>
                <span *ngIf="b.client_phone" class="text-xs flex items-center gap-1" style="color:var(--muted-foreground)">
                  <span class="material-icons" style="font-size:0.85rem">phone</span>
                  {{ b.client_phone }}
                </span>
              </div>

              <!-- Seção de split payment -->
              <div *ngIf="b.split_payment && b.payment_group" class="mt-2.5 pt-2.5" style="border-top:1px solid var(--border)">
                <!-- Barra de progresso -->
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs" style="color:var(--muted-foreground)">
                    {{ b.payment_group.splits.length }} jogador{{ b.payment_group.splits.length !== 1 ? 'es' : '' }} ·
                    R\${{ (b.payment_group.paid_amount / 100) | number:'1.0-2' }} /
                    R\${{ (b.payment_group.total_amount / 100) | number:'1.0-2' }}
                  </span>
                  <span class="text-xs font-semibold" [style.color]="splitProgressColor(b.payment_group)">
                    {{ splitProgressPercent(b.payment_group) }}%
                  </span>
                </div>
                <div class="h-1.5 rounded-full overflow-hidden" style="background:var(--muted)">
                  <div class="h-full rounded-full transition-all duration-500"
                       [style.width]="splitProgressPercent(b.payment_group) + '%'"
                       [style.background]="splitProgressColor(b.payment_group)"></div>
                </div>
                <!-- Chips dos jogadores -->
                <div class="flex flex-wrap gap-1 mt-2">
                  <span *ngFor="let s of b.payment_group.splits"
                        class="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full font-medium"
                        [style.background]="s.status === 'PAGO' ? 'hsl(152,69%,40%,0.12)' : 'hsl(0,0%,50%,0.1)'"
                        [style.color]="s.status === 'PAGO' ? 'var(--primary)' : 'var(--muted-foreground)'">
                    <span class="material-icons" style="font-size:0.65rem">
                      {{ s.status === 'PAGO' ? 'check_circle' : 'radio_button_unchecked' }}
                    </span>
                    {{ s.player_name }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Valor + ações -->
            <div class="flex flex-col items-end gap-2 flex-shrink-0">
              <span class="font-heading font-bold text-sm" style="color:var(--foreground)">R\${{ b.total_amount }}</span>
              <div class="flex items-center gap-1">
                <button *ngIf="b.payment_status === 'pendente' && !b.split_payment"
                        class="btn-primary px-2.5 py-1 text-xs rounded-lg"
                        [disabled]="actionLoading === b.id"
                        (click)="confirmPayment(b)">
                  <span class="material-icons" style="font-size:0.8rem">check</span>
                  Confirmar
                </button>
                <button class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style="color:var(--destructive);background:hsl(0,84%,60%,0.08)"
                        [disabled]="actionLoading === b.id"
                        (click)="deleteBooking(b)"
                        title="Cancelar reserva">
                  <span class="material-icons" style="font-size:0.9rem">delete_outline</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Rodapé: paginador + itens por página -->
      <div *ngIf="filtered.length > 0"
           class="flex items-center justify-end gap-3 mt-4 flex-wrap"
           [style.opacity]="loading ? '0.45' : '1'"
           style="transition:opacity 0.2s">

        <div *ngIf="totalPages > 1" class="flex items-center gap-1">
          <button class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  [style.opacity]="currentPage === 1 || loading ? '0.35' : '1'"
                  [disabled]="currentPage === 1 || loading"
                  style="background:var(--muted);color:var(--muted-foreground)"
                  (click)="goToPage(currentPage - 1)">
            <span class="material-icons" style="font-size:1rem">chevron_left</span>
          </button>

          <ng-container *ngFor="let p of pageNumbers">
            <span *ngIf="p === '...'"
                  class="w-8 h-8 flex items-center justify-center text-xs"
                  style="color:var(--muted-foreground)">…</span>
            <button *ngIf="p !== '...'"
                    class="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
                    [style.background]="currentPage === p ? 'var(--primary)' : 'var(--muted)'"
                    [style.color]="currentPage === p ? 'white' : 'var(--muted-foreground)'"
                    [disabled]="loading"
                    (click)="goToPage(+p)">
              {{ p }}
            </button>
          </ng-container>

          <button class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  [style.opacity]="currentPage === totalPages || loading ? '0.35' : '1'"
                  [disabled]="currentPage === totalPages || loading"
                  style="background:var(--muted);color:var(--muted-foreground)"
                  (click)="goToPage(currentPage + 1)">
            <span class="material-icons" style="font-size:1rem">chevron_right</span>
          </button>
        </div>

        <div class="flex items-center gap-1.5" style="border-left:1px solid var(--border);padding-left:0.75rem">
          <span class="text-xs" style="color:var(--muted-foreground)">por página:</span>
          <div class="flex gap-1">
            <button *ngFor="let s of pageSizes"
                    class="w-8 h-7 rounded-lg text-xs font-semibold transition-all"
                    [style.background]="pageSize === s ? 'var(--primary)' : 'var(--muted)'"
                    [style.color]="pageSize === s ? 'white' : 'var(--muted-foreground)'"
                    [disabled]="loading"
                    (click)="changePageSize(s)">
              {{ s }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty states -->
      <div *ngIf="!loading && filtered.length === 0 && allBookings.length > 0"
           class="text-center py-16" style="color:var(--muted-foreground)">
        <span class="material-icons mb-3 block" style="font-size:2.5rem;color:var(--border)">search_off</span>
        <p class="font-medium">Nenhuma reserva encontrada</p>
        <p class="text-sm mt-1">Tente outro filtro ou termo de busca</p>
      </div>

      <div *ngIf="!loading && allBookings.length === 0"
           class="text-center py-16" style="color:var(--muted-foreground)">
        <span class="material-icons mb-3 block" style="font-size:2.5rem;color:var(--border)">event_busy</span>
        <p class="font-medium mb-1">Nenhuma reserva em {{ monthLabel }}</p>
        <p class="text-sm">Compartilhe o link para que clientes façam reservas</p>
        <button class="btn-primary mt-4" (click)="copyLink()">
          <span class="material-icons" style="font-size:1rem">share</span>
          Compartilhar link de reserva
        </button>
      </div>

      <!-- Modal confirmação de cancelamento -->
      <div *ngIf="bookingToDelete" class="modal-overlay" (click)="bookingToDelete = null">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                 style="background:hsl(0,84%,60%,0.1);color:var(--destructive)">
              <span class="material-icons" style="font-size:1.2rem">delete_outline</span>
            </div>
            <div>
              <h3 class="font-heading font-bold text-base" style="color:var(--foreground)">Cancelar reserva</h3>
              <p class="text-xs mt-0.5" style="color:var(--muted-foreground)">Essa ação não pode ser desfeita</p>
            </div>
          </div>
          <p class="text-sm mb-5" style="color:var(--foreground)">
            Deseja cancelar a reserva de <strong>{{ bookingToDelete.client_name }}</strong>
            em {{ bookingToDelete.court_name || 'Quadra' }},
            dia {{ bookingToDelete.date | date:'dd/MM/yyyy' }}
            das {{ bookingToDelete.start_hour }} às {{ bookingToDelete.end_hour }}?
          </p>
          <div class="flex gap-2">
            <button class="btn-outline flex-1" (click)="bookingToDelete = null">Manter</button>
            <button class="btn-primary flex-1" style="background:var(--destructive)"
                    [disabled]="actionLoading === bookingToDelete.id"
                    (click)="confirmDelete()">Cancelar reserva</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes sk-shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position:  600px 0; }
    }
    .sk-box {
      background: linear-gradient(
        90deg,
        var(--muted) 25%,
        var(--surface-raised) 50%,
        var(--muted) 75%
      );
      background-size: 1200px 100%;
      animation: sk-shimmer 1.4s ease-in-out infinite;
    }
  `]
})
export class ReservasComponent implements OnInit {
  allBookings: Booking[] = [];
  search = '';
  activeFilter: FilterStatus = 'todas';
  bookingToDelete: Booking | null = null;
  actionLoading: string | null = null;

  // Mês selecionado
  selectedMonth = this.currentMonthStr();
  maxMonth      = this.currentMonthStr();

  // Paginação
  currentPage = 1;
  pageSize = 10;
  pageSizes = [10, 15, 20];
  loading    = false;
  loadingKpi = false;

  get skeletonRows(): number[] { return Array.from({ length: this.pageSize }, (_, i) => i); }

  filters: { label: string; value: FilterStatus }[] = [
    { label: 'Todas',      value: 'todas'     },
    { label: 'Pagas',      value: 'pago'      },
    { label: 'Parciais',   value: 'parcial'   },
    { label: 'Pendentes',  value: 'pendente'  },
    { label: 'Canceladas', value: 'cancelado' },
  ];

  constructor(
    private bookingAdminService: BookingAdminService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadBookings();
  }

  private currentMonthStr(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  get monthLabel(): string {
    const [year, month] = this.selectedMonth.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  async loadBookings() {
    this.loading    = true;
    this.loadingKpi = true;
    try {
      const data = await this.bookingAdminService.getMonthBookings(this.selectedMonth);
      this.allBookings = data;
      this.resetPage();
    } catch {
      this.toast.show('Erro ao carregar reservas.');
    } finally {
      this.loading    = false;
      this.loadingKpi = false;
    }
  }

  onMonthChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    if (val) {
      this.selectedMonth = val;
      this.loadBookings();
    }
  }

  get filtered(): Booking[] {
    return this.allBookings.filter(b => {
      const matchStatus = this.activeFilter === 'todas' || b.payment_status === this.activeFilter;
      const term = this.search.toLowerCase();
      const matchSearch = !term ||
        b.client_name.toLowerCase().includes(term) ||
        (b.court_name || '').toLowerCase().includes(term) ||
        (b.client_phone || '').includes(term);
      return matchStatus && matchSearch;
    });
  }

  get paged(): Booking[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }

  get pageNumbers(): (number | '...')[] {
    const t = this.totalPages, c = this.currentPage;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (c > 3) pages.push('...');
    for (let i = Math.max(2, c - 1); i <= Math.min(t - 1, c + 1); i++) pages.push(i);
    if (c < t - 2) pages.push('...');
    pages.push(t);
    return pages;
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages || this.loading) return;
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  changePageSize(size: number) {
    if (size === this.pageSize || this.loading) return;
    this.pageSize = size;
    this.currentPage = 1;
  }

  resetPage() { this.currentPage = 1; }

  get totalRevenue(): number {
    return this.allBookings
      .filter(b => b.payment_status === 'pago')
      .reduce((s, b) => s + b.total_amount, 0);
  }

  countByStatus(status: string): number {
    return this.allBookings.filter(b => b.payment_status === status).length;
  }

  async confirmPayment(b: Booking) {
    this.actionLoading = b.id;
    try {
      const updated = await this.bookingAdminService.confirmPayment(b.id);
      this.allBookings = this.allBookings.map(x => x.id === b.id ? { ...x, ...updated } : x);
      this.toast.show(`Pagamento de ${b.client_name} confirmado!`);
    } catch {
      this.toast.show('Erro ao confirmar pagamento.');
    } finally {
      this.actionLoading = null;
    }
  }

  deleteBooking(b: Booking) {
    this.bookingToDelete = b;
  }

  async confirmDelete() {
    if (!this.bookingToDelete) return;
    const id = this.bookingToDelete.id;
    const name = this.bookingToDelete.client_name;
    this.actionLoading = id;
    this.bookingToDelete = null;
    try {
      await this.bookingAdminService.cancelBooking(id);
      this.allBookings = this.allBookings.map(b =>
        b.id === id ? { ...b, payment_status: 'cancelado' } : b
      );
      this.toast.show(`Reserva de ${name} cancelada.`);
    } catch {
      this.toast.show('Erro ao cancelar reserva.');
    } finally {
      this.actionLoading = null;
    }
  }

  copyLink() {
    const url = 'http://localhost:4201';
    navigator.clipboard.writeText(url).then(() => {
      this.toast.show('Link copiado! Compartilhe com seus clientes.');
    }).catch(() => {
      this.toast.show(`Link de reserva: ${url}`);
    });
  }

  statusClass(s: string) {
    if (s === 'pago')      return 'badge-primary';
    if (s === 'parcial')   return 'badge-accent';
    if (s === 'pendente')  return 'badge-accent';
    if (s === 'cancelado') return 'badge-destructive';
    return 'badge-muted';
  }

  splitProgressPercent(pg: BookingPaymentGroup): number {
    if (!pg || !pg.total_amount) return 0;
    return Math.min(100, Math.round((pg.paid_amount / pg.total_amount) * 100));
  }

  splitProgressColor(pg: BookingPaymentGroup): string {
    const pct = this.splitProgressPercent(pg);
    if (pct >= 100) return 'var(--primary)';
    if (pct >= 50)  return '#f59e0b';
    return 'hsl(0,84%,60%)';
  }
}
