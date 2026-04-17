import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';

interface ClientBooking {
  id:             string;
  date:           string;
  start_hour:     string;
  end_hour:       string;
  total_amount:   number;
  paid_amount:    number;
  payment_status: string;
  court_id:       string;
  court_name:     string;
  sport_type:     string;
}

interface ApiClient {
  key:            string;
  name:           string;
  phone:          string | null;
  total_bookings: number;
  total_paid:     number;
  last_booking:   string | null;
  bookings:       ClientBooking[];
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="font-heading font-bold text-2xl lg:text-3xl" style="color:var(--foreground)">Clientes</h1>
          <p class="text-sm mt-1" style="color:var(--muted-foreground)">
            {{ loading ? 'Carregando...' : clients.length + ' clientes encontrados' }}
          </p>
        </div>
      </div>

      <!-- Search -->
      <div class="relative mb-5">
        <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2" style="font-size:1.1rem;color:var(--muted-foreground)">search</span>
        <input class="input" style="padding-left:2.25rem" [(ngModel)]="search" (ngModelChange)="onSearchChange()" placeholder="Buscar por nome ou telefone...">
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex items-center justify-center py-16">
        <span class="material-icons" style="font-size:2rem;color:var(--muted-foreground);animation:spin 1s linear infinite">refresh</span>
      </div>

      <!-- Two-column layout -->
      <div *ngIf="!loading" class="grid grid-cols-1 lg:grid-cols-5 gap-4">

        <!-- Lista de clientes -->
        <div class="lg:col-span-2 space-y-2">
          <div *ngFor="let client of pagedClients"
               class="card p-4 cursor-pointer transition-all"
               [class.shadow-md]="selected?.key === client.key"
               [style.border-color]="selected?.key === client.key ? 'var(--primary)' : ''"
               (click)="selected = selected?.key === client.key ? null : client">
            <div class="flex items-center gap-3">
              <!-- Avatar inicial -->
              <div class="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-bold text-sm flex-shrink-0"
                   style="background:hsl(152,69%,40%,0.1);color:var(--primary)">
                {{ client.name.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm truncate" style="color:var(--foreground)">{{ client.name }}</div>
                <div class="text-xs mt-0.5" style="color:var(--muted-foreground)">
                  <span *ngIf="client.phone">{{ client.phone }}</span>
                  <span *ngIf="!client.phone" style="font-style:italic">Sem telefone</span>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="font-heading font-bold text-sm" style="color:var(--primary)">
                  R\${{ client.total_paid | number:'1.2-2' }}
                </div>
                <div class="text-xs" style="color:var(--muted-foreground)">
                  {{ client.total_bookings }} reserva{{ client.total_bookings !== 1 ? 's' : '' }}
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="filteredClients.length === 0" class="text-center py-12" style="color:var(--muted-foreground)">
            <span class="material-icons mb-2 block" style="font-size:2.5rem;color:var(--border)">group</span>
            <p class="text-sm">Nenhum cliente encontrado</p>
          </div>

          <!-- Paginador -->
          <div *ngIf="totalPages > 1" class="flex items-center justify-between pt-2">
            <span class="text-xs" style="color:var(--muted-foreground)">
              {{ (page - 1) * pageSize + 1 }}–{{ min(page * pageSize, filteredClients.length) }} de {{ filteredClients.length }}
            </span>
            <div class="flex items-center gap-1">
              <button class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      [disabled]="page === 1"
                      [style.opacity]="page === 1 ? '0.35' : '1'"
                      style="background:var(--muted);color:var(--foreground)"
                      (click)="goToPage(page - 1)">
                <span class="material-icons" style="font-size:1rem">chevron_left</span>
              </button>

              <button *ngFor="let p of pageNumbers"
                      class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors"
                      [style.background]="p === page ? 'var(--primary)' : 'var(--muted)'"
                      [style.color]="p === page ? 'white' : 'var(--foreground)'"
                      (click)="goToPage(p)">
                {{ p }}
              </button>

              <button class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      [disabled]="page === totalPages"
                      [style.opacity]="page === totalPages ? '0.35' : '1'"
                      style="background:var(--muted);color:var(--foreground)"
                      (click)="goToPage(page + 1)">
                <span class="material-icons" style="font-size:1rem">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Painel de detalhe -->
        <div class="lg:col-span-3">
          <div class="card p-5 sticky top-4">

            <!-- Cliente selecionado -->
            <ng-container *ngIf="selected; else noSelection">

              <!-- Cabeçalho -->
              <div class="flex items-center gap-4 mb-5">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center font-heading font-bold text-xl flex-shrink-0"
                     style="background:hsl(152,69%,40%,0.1);color:var(--primary)">
                  {{ selected.name.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-heading font-bold text-lg truncate" style="color:var(--foreground)">{{ selected.name }}</h3>
                  <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span *ngIf="selected.phone" class="flex items-center gap-1 text-xs" style="color:var(--muted-foreground)">
                      <span class="material-icons" style="font-size:0.85rem">phone</span>{{ selected.phone }}
                    </span>
                    <span *ngIf="selected.last_booking" class="text-xs" style="color:var(--muted-foreground)">
                      · Última reserva {{ selected.last_booking | date:'dd/MM/yyyy' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Stats -->
              <div class="grid grid-cols-3 gap-3 mb-5">
                <div class="p-3 rounded-xl text-center" style="background:var(--muted)">
                  <div class="text-xs mb-1" style="color:var(--muted-foreground)">Total gasto</div>
                  <div class="font-heading font-bold text-base" style="color:var(--primary)">
                    R\${{ selected.total_paid | number:'1.2-2' }}
                  </div>
                </div>
                <div class="p-3 rounded-xl text-center" style="background:var(--muted)">
                  <div class="text-xs mb-1" style="color:var(--muted-foreground)">Reservas</div>
                  <div class="font-heading font-bold text-base" style="color:var(--foreground)">
                    {{ selected.total_bookings }}
                  </div>
                </div>
                <div class="p-3 rounded-xl text-center" style="background:var(--muted)">
                  <div class="text-xs mb-1" style="color:var(--muted-foreground)">Ticket médio</div>
                  <div class="font-heading font-bold text-base" style="color:var(--foreground)">
                    R\${{ (selected.total_paid / (selected.total_bookings || 1)) | number:'1.2-2' }}
                  </div>
                </div>
              </div>

              <!-- Histórico de reservas -->
              <h4 class="font-heading font-semibold text-sm mb-3" style="color:var(--foreground)">Histórico de Reservas</h4>
              <div class="space-y-2 overflow-y-auto" style="max-height:320px">
                <div *ngFor="let b of selected.bookings"
                     class="flex items-center gap-3 p-3 rounded-xl"
                     style="background:var(--muted)">
                  <!-- Ícone esporte -->
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                       [style.background]="getSportBg(b.sport_type)"
                       [style.color]="getSportColor(b.sport_type)">
                    <span class="material-icons" style="font-size:1rem">{{ getSportIcon(b.sport_type) }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate" style="color:var(--foreground)">{{ b.court_name }}</div>
                    <div class="text-xs" style="color:var(--muted-foreground)">
                      {{ b.date | date:'dd/MM/yy':'UTC' }} · {{ b.start_hour }}–{{ b.end_hour }}
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <div class="font-heading font-semibold text-sm" style="color:var(--foreground)">
                      R\${{ b.total_amount | number:'1.2-2' }}
                    </div>
                    <span class="badge text-xs" [ngClass]="getPaymentClass(b.payment_status)">
                      {{ b.payment_status }}
                    </span>
                  </div>
                </div>

                <div *ngIf="selected.bookings.length === 0"
                     class="text-center py-6 text-sm" style="color:var(--muted-foreground)">
                  Sem reservas registradas
                </div>
              </div>
            </ng-container>

            <!-- Nenhum selecionado -->
            <ng-template #noSelection>
              <div class="flex flex-col items-center justify-center py-12 gap-3">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center"
                     style="background:var(--muted)">
                  <span class="material-icons" style="font-size:1.6rem;color:var(--muted-foreground)">person_search</span>
                </div>
                <div class="text-center">
                  <p class="text-sm font-semibold" style="color:var(--foreground)">Nenhum cliente selecionado</p>
                  <p class="text-xs mt-0.5" style="color:var(--muted-foreground)">Clique em um cliente para ver o histórico</p>
                </div>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClientesComponent implements OnInit {
  clients:  ApiClient[] = [];
  selected: ApiClient | null = null;
  loading  = true;
  search   = '';
  page     = 1;
  pageSize = 10;

  constructor(private api: ApiService) {}

  async ngOnInit() {
    try {
      const res = await firstValueFrom(this.api.get<{ clients: ApiClient[] }>('/clients'));
      this.clients = res.clients;
    } catch (err) {
      console.error('[CLIENTES]', err);
    } finally {
      this.loading = false;
    }
  }

  get filteredClients(): ApiClient[] {
    const q = this.search.toLowerCase().trim();
    const list = q
      ? this.clients.filter(c =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))
        )
      : this.clients;
    return list;
  }

  get pagedClients(): ApiClient[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredClients.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredClients.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const cur   = this.page;
    // Mostra no máximo 5 botões centrados na página atual
    let start = Math.max(1, cur - 2);
    let end   = Math.min(total, start + 4);
    start     = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.selected = null;
  }

  onSearchChange(): void {
    this.page = 1;      // volta para a primeira página ao buscar
    this.selected = null;
  }

  min(a: number, b: number): number { return Math.min(a, b); }

  getSportIcon(sport: string): string {
    if (sport.includes('tennis'))  return 'sports_tennis';
    if (sport.includes('futev'))   return 'sports_volleyball';
    if (sport.includes('vôlei'))   return 'sports_volleyball';
    if (sport.includes('futebol')) return 'sports_soccer';
    return 'sports';
  }

  getSportColor(sport: string): string {
    if (sport.includes('tennis'))  return 'hsl(38,92%,50%)';
    if (sport.includes('futev'))   return 'hsl(199,89%,48%)';
    if (sport.includes('vôlei'))   return 'hsl(262,80%,60%)';
    if (sport.includes('futebol')) return 'hsl(142,70%,40%)';
    return 'hsl(152,69%,40%)';
  }

  getSportBg(sport: string): string {
    if (sport.includes('tennis'))  return 'hsl(38,92%,50%,0.12)';
    if (sport.includes('futev'))   return 'hsl(199,89%,48%,0.12)';
    if (sport.includes('vôlei'))   return 'hsl(262,80%,60%,0.12)';
    if (sport.includes('futebol')) return 'hsl(142,70%,40%,0.12)';
    return 'hsl(152,69%,40%,0.12)';
  }

  getPaymentClass(s: string): string {
    return s === 'pago' ? 'badge-primary' : s === 'pendente' ? 'badge-accent' : 'badge-muted';
  }
}
