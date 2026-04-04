import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { Booking, Court } from '../../models/models';

type FilterStatus = 'todas' | 'pago' | 'pendente' | 'não informado';

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
        <!-- Link compartilhável -->
        <button class="btn-outline flex items-center gap-2 self-start sm:self-auto" (click)="copyLink()">
          <span class="material-icons" style="font-size:1rem">share</span>
          Compartilhar link
        </button>
      </div>

      <!-- KPIs rápidos -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div class="card p-4">
          <div class="text-xs font-medium mb-1" style="color:var(--muted-foreground)">Total</div>
          <div class="font-heading font-bold text-2xl" style="color:var(--foreground)">{{ allBookings.length }}</div>
        </div>
        <div class="card p-4">
          <div class="text-xs font-medium mb-1" style="color:var(--muted-foreground)">Confirmadas</div>
          <div class="font-heading font-bold text-2xl" style="color:var(--primary)">{{ countByStatus('pago') }}</div>
        </div>
        <div class="card p-4">
          <div class="text-xs font-medium mb-1" style="color:var(--muted-foreground)">Pendentes</div>
          <div class="font-heading font-bold text-2xl" style="color:hsl(36,80%,38%)">{{ countByStatus('pendente') }}</div>
        </div>
        <div class="card p-4">
          <div class="text-xs font-medium mb-1" style="color:var(--muted-foreground)">Receita total</div>
          <div class="font-heading font-bold text-xl" style="color:var(--foreground)">R\${{ totalRevenue | number:'1.0-0' }}</div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="flex flex-col sm:flex-row gap-3 mb-4">
        <!-- Busca -->
        <div style="position:relative;flex:1">
          <span class="material-icons" style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);font-size:1rem;color:var(--muted-foreground);pointer-events:none">search</span>
          <input class="input" style="padding-left:2.25rem" [(ngModel)]="search" placeholder="Buscar por cliente ou quadra...">
        </div>
        <!-- Filtro status -->
        <div class="flex gap-1 p-1 rounded-xl flex-shrink-0" style="background-color:var(--muted)">
          <button *ngFor="let f of filters"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  [style.background]="activeFilter === f.value ? 'var(--card)' : 'transparent'"
                  [style.color]="activeFilter === f.value ? 'var(--foreground)' : 'var(--muted-foreground)'"
                  [style.box-shadow]="activeFilter === f.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'"
                  (click)="activeFilter = f.value">
            {{ f.label }}
          </button>
        </div>
      </div>

      <!-- Lista de reservas -->
      <div class="space-y-2" *ngIf="filtered.length > 0">
        <div *ngFor="let b of filtered"
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
                <span class="font-heading font-semibold text-sm" style="color:var(--foreground)">{{ b.client_name }}</span>
                <span class="badge flex-shrink-0" [ngClass]="statusClass(b.payment_status)">{{ b.payment_status }}</span>
              </div>
              <div class="flex items-center gap-3 mt-1 flex-wrap">
                <span class="text-xs flex items-center gap-1" style="color:var(--muted-foreground)">
                  <span class="material-icons" style="font-size:0.85rem">sports_volleyball</span>
                  {{ getCourtName(b.court_id) }}
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
            </div>

            <!-- Valor + ações -->
            <div class="flex flex-col items-end gap-2 flex-shrink-0">
              <span class="font-heading font-bold text-sm" style="color:var(--foreground)">R\${{ b.total_amount }}</span>
              <div class="flex items-center gap-1">
                <button *ngIf="b.payment_status === 'pendente'"
                        class="btn-primary px-2.5 py-1 text-xs rounded-lg"
                        (click)="confirmPayment(b)">
                  <span class="material-icons" style="font-size:0.8rem">check</span>
                  Confirmar
                </button>
                <button class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style="color:var(--destructive);background:hsl(0,84%,60%,0.08)"
                        (click)="deleteBooking(b)"
                        title="Cancelar reserva">
                  <span class="material-icons" style="font-size:0.9rem">delete_outline</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty states -->
      <div *ngIf="filtered.length === 0 && allBookings.length > 0"
           class="text-center py-16" style="color:var(--muted-foreground)">
        <span class="material-icons mb-3 block" style="font-size:2.5rem;color:var(--border)">search_off</span>
        <p class="font-medium">Nenhuma reserva encontrada</p>
        <p class="text-sm mt-1">Tente outro filtro ou termo de busca</p>
      </div>

      <div *ngIf="allBookings.length === 0"
           class="text-center py-16" style="color:var(--muted-foreground)">
        <span class="material-icons mb-3 block" style="font-size:2.5rem;color:var(--border)">event_busy</span>
        <p class="font-medium mb-1">Nenhuma reserva ainda</p>
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
            em {{ getCourtName(bookingToDelete.court_id) }},
            dia {{ bookingToDelete.date | date:'dd/MM/yyyy' }}
            das {{ bookingToDelete.start_hour }} às {{ bookingToDelete.end_hour }}?
          </p>
          <div class="flex gap-2">
            <button class="btn-outline flex-1" (click)="bookingToDelete = null">Manter</button>
            <button class="btn-primary flex-1" style="background:var(--destructive)" (click)="confirmDelete()">Cancelar reserva</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReservasComponent implements OnInit {
  allBookings: Booking[] = [];
  courts: Court[] = [];
  search = '';
  activeFilter: FilterStatus = 'todas';
  bookingToDelete: Booking | null = null;

  filters: { label: string; value: FilterStatus }[] = [
    { label: 'Todas',     value: 'todas'         },
    { label: 'Pagas',     value: 'pago'          },
    { label: 'Pendentes', value: 'pendente'      },
  ];

  constructor(private data: DataService, private toast: ToastService) {}

  ngOnInit() {
    this.data.courts$.subscribe(c => this.courts = c);
    this.data.bookings$.subscribe(b => {
      this.allBookings = [...b].sort((a, z) => {
        if (a.date !== z.date) return z.date.localeCompare(a.date);
        return z.start_hour.localeCompare(a.start_hour);
      });
    });
  }

  get filtered(): Booking[] {
    return this.allBookings.filter(b => {
      const matchStatus = this.activeFilter === 'todas' || b.payment_status === this.activeFilter;
      const term = this.search.toLowerCase();
      const matchSearch = !term ||
        b.client_name.toLowerCase().includes(term) ||
        this.getCourtName(b.court_id).toLowerCase().includes(term) ||
        (b.client_phone || '').includes(term);
      return matchStatus && matchSearch;
    });
  }

  get totalRevenue(): number {
    return this.allBookings.filter(b => b.payment_status === 'pago').reduce((s, b) => s + b.total_amount, 0);
  }

  countByStatus(status: string): number {
    return this.allBookings.filter(b => b.payment_status === status).length;
  }

  confirmPayment(b: Booking) {
    this.data.updateBooking(b.id, { payment_status: 'pago' });
    this.toast.show(`Pagamento de ${b.client_name} confirmado!`);
  }

  deleteBooking(b: Booking) {
    this.bookingToDelete = b;
  }

  confirmDelete() {
    if (!this.bookingToDelete) return;
    this.data.deleteBooking(this.bookingToDelete.id);
    this.toast.show('Reserva cancelada.');
    this.bookingToDelete = null;
  }

  copyLink() {
    const url = 'http://localhost:4201';
    navigator.clipboard.writeText(url).then(() => {
      this.toast.show('Link copiado! Compartilhe com seus clientes.');
    }).catch(() => {
      this.toast.show(`Link de reserva: ${url}`);
    });
  }

  getCourtName(id: string): string { return this.courts.find(c => c.id === id)?.name || 'Quadra'; }
  statusClass(s: string) { return s === 'pago' ? 'badge-primary' : s === 'pendente' ? 'badge-accent' : 'badge-muted'; }
}
