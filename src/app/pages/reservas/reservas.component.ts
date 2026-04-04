import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { Court, Booking } from '../../models/models';

interface PublicBooking {
  id: string;
  court_id: string;
  date: string;
  start_hour: string;
  end_hour: string;
  organizer_name: string;
  num_players: number;
  split_payment: boolean;
  status: 'aguardando_pagamento' | 'parcialmente_pago' | 'confirmada' | 'finalizada' | 'cancelada';
  total_amount: number;
  paid_amount: number;
  pix_key?: string;
}

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Header -->
      <div class="mb-6">
        <h1 class="font-heading font-bold text-2xl lg:text-3xl" style="color: var(--foreground)">Reservas</h1>
        <p class="text-sm mt-1" style="color: var(--muted-foreground)">Reserve sua quadra de forma rápida e fácil</p>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 p-1 rounded-xl mb-6 w-full max-w-sm" style="background-color: var(--muted)">
        <button class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                [class.bg-card]="activeTab === 'nova'"
                [style.color]="activeTab === 'nova' ? 'var(--foreground)' : 'var(--muted-foreground)'"
                [class.shadow-sm]="activeTab === 'nova'"
                (click)="activeTab = 'nova'">
          <span class="material-icons" style="font-size:1rem">shopping_cart</span> Nova Reserva
        </button>
        <button class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                [class.bg-card]="activeTab === 'minhas'"
                [style.color]="activeTab === 'minhas' ? 'var(--foreground)' : 'var(--muted-foreground)'"
                [class.shadow-sm]="activeTab === 'minhas'"
                (click)="activeTab = 'minhas'">
          <span class="material-icons" style="font-size:1rem">person</span> Minhas Reservas
        </button>
      </div>

      <!-- Nova Reserva tab -->
      <div *ngIf="activeTab === 'nova'">
        <!-- Step 1: Choose court -->
        <div *ngIf="step === 1">
          <h2 class="font-heading font-semibold text-base mb-4" style="color: var(--foreground)">Escolha uma quadra para reservar:</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div *ngFor="let court of availableCourts"
                 class="card p-5 cursor-pointer transition-all hover:shadow-md"
                 [style.border-color]="booking.court_id === court.id ? 'var(--primary)' : ''"
                 (click)="selectCourt(court)">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                   style="background-color: hsl(152,69%,40%,0.1);color:hsl(152,69%,40%)"><span class="material-icons" style="font-size:1.5rem">sports_volleyball</span></div>
              <h3 class="font-heading font-bold text-base mb-1" style="color: var(--foreground)">{{ court.name }}</h3>
              <p class="text-sm mb-3" style="color: var(--muted-foreground)">{{ court.sport_type | titlecase }}</p>
              <div class="font-heading font-bold text-lg" style="color: var(--primary)">R\${{ court.hourly_rate }}/h</div>
            </div>
          </div>
          <div *ngIf="availableCourts.length === 0" class="text-center py-16" style="color: var(--muted-foreground)">
            <div class="mb-3" style="color:var(--border)"><span class="material-icons" style="font-size:3rem">sports_volleyball</span></div>
            <p>Nenhuma quadra disponível no momento</p>
          </div>
        </div>

        <!-- Step 2: Date & Time -->
        <div *ngIf="step === 2">
          <button class="btn-ghost mb-4 px-0" (click)="step = 1">← Voltar</button>
          <h2 class="font-heading font-semibold text-base mb-4" style="color: var(--foreground)">
            {{ selectedCourt?.name }} — Escolha data e horário
          </h2>
          <div class="card p-5 mb-4">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Data</label>
                <input class="input" type="date" [(ngModel)]="booking.date" [min]="todayStr" (ngModelChange)="checkSlotConflict()">
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Início</label>
                  <select class="select" [(ngModel)]="booking.start_hour" (ngModelChange)="checkSlotConflict(); calcTotal()">
                    <option *ngFor="let h of hours" [value]="h">{{ h }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Fim</label>
                  <select class="select" [(ngModel)]="booking.end_hour" (ngModelChange)="checkSlotConflict(); calcTotal()">
                    <option *ngFor="let h of endHours" [value]="h">{{ h }}</option>
                  </select>
                </div>
              </div>
              <div *ngIf="slotConflict && mensalistaConflict"
                   class="flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
                   style="background-color:hsl(36,95%,55%,0.1);color:hsl(36,60%,32%);border:1px solid hsl(36,95%,55%,0.3)">
                <span class="material-icons" style="font-size:1rem">card_membership</span>
                Horário reservado por mensalistas!
              </div>
              <div *ngIf="slotConflict && !mensalistaConflict"
                   class="flex items-center gap-2 p-3 rounded-xl text-sm" style="background-color: hsl(0,84%,60%,0.1); color: var(--destructive)">
                <span class="material-icons" style="font-size:1rem">warning</span> Horário já reservado! Escolha outro horário.
              </div>
              <div *ngIf="booking.total_amount > 0 && !slotConflict" class="p-4 rounded-xl" style="background-color: hsl(152,69%,40%,0.05); border: 1px solid hsl(152,69%,40%,0.2)">
                <div class="text-sm" style="color: var(--muted-foreground)">{{ durationHours }}h × R\${{ selectedCourt?.hourly_rate }}/h</div>
                <div class="font-heading font-bold text-xl mt-1" style="color: var(--primary)">R\${{ booking.total_amount }}</div>
              </div>
            </div>
          </div>
          <button class="btn-primary w-full" (click)="step = 3" [disabled]="slotConflict || durationHours <= 0">
            Continuar →
          </button>
        </div>

        <!-- Step 3: Player info & payment -->
        <div *ngIf="step === 3">
          <button class="btn-ghost mb-4 px-0" (click)="step = 2">← Voltar</button>
          <h2 class="font-heading font-semibold text-base mb-4" style="color: var(--foreground)">Seus dados (organizador)</h2>
          <div class="card p-5 mb-4 space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Seu nome *</label>
              <input class="input" [(ngModel)]="booking.organizer_name" placeholder="Nome completo">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Número de jogadores</label>
              <input class="input" type="number" [(ngModel)]="booking.num_players" min="1" max="12">
            </div>
            <div class="flex items-center justify-between py-2" style="border-top: 1px solid var(--border)">
              <span class="text-sm font-medium" style="color: var(--foreground)">Dividir o pagamento?</span>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="booking.split_payment">
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div *ngIf="booking.split_payment" class="p-3 rounded-xl text-sm" style="background-color: var(--muted)">
              <p style="color: var(--muted-foreground)">Cada jogador pagará: <strong style="color: var(--primary)">R\${{ perPlayerAmount | number:'1.2-2' }}</strong></p>
            </div>
          </div>

          <!-- Summary -->
          <div class="card p-5 mb-4" style="border-color: var(--primary)">
            <h3 class="font-heading font-semibold mb-3" style="color: var(--foreground)">Resumo</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span style="color: var(--muted-foreground)">Quadra</span><span style="color: var(--foreground)">{{ selectedCourt?.name }}</span></div>
              <div class="flex justify-between"><span style="color: var(--muted-foreground)">Data</span><span style="color: var(--foreground)">{{ booking.date | date:'dd/MM/yyyy' }}</span></div>
              <div class="flex justify-between"><span style="color: var(--muted-foreground)">Horário</span><span style="color: var(--foreground)">{{ booking.start_hour }} - {{ booking.end_hour }}</span></div>
              <div class="flex justify-between font-heading font-bold pt-2" style="border-top: 1px solid var(--border)">
                <span style="color: var(--foreground)">Total</span>
                <span style="color: var(--primary)">R\${{ booking.total_amount }}</span>
              </div>
            </div>
          </div>

          <button class="btn-primary w-full" (click)="confirmReservation()" [disabled]="!booking.organizer_name">
            Confirmar e Gerar PIX
          </button>
        </div>

        <!-- Step 4: PIX -->
        <div *ngIf="step === 4">
          <div class="card p-6 text-center mb-4">
            <div class="mb-3" style="color:var(--primary)"><span class="material-icons" style="font-size:3rem">check_circle</span></div>
            <h2 class="font-heading font-bold text-xl mb-2" style="color: var(--foreground)">Pague via PIX</h2>
            <p class="text-sm mb-5" style="color: var(--muted-foreground)">Use a chave PIX abaixo para confirmar sua reserva</p>

            <!-- QR code placeholder -->
            <div class="w-40 h-40 rounded-xl mx-auto mb-4 flex items-center justify-center" style="background-color: var(--muted)">
              <span class="material-icons" style="font-size:3.5rem;color:var(--muted-foreground)">qr_code</span>
            </div>

            <div class="p-3 rounded-xl mb-4" style="background-color: var(--muted)">
              <div class="text-xs mb-1" style="color: var(--muted-foreground)">Chave PIX</div>
              <div class="font-heading font-bold text-sm" style="color: var(--foreground)">arenaflow&#64;pix.com.br</div>
            </div>

            <!-- Progress -->
            <div class="text-left mb-3">
              <div class="flex justify-between text-xs mb-2" style="color: var(--muted-foreground)">
                <span>Progresso de pagamento</span>
                <span>R\${{ confirmedBooking?.paid_amount | number:'1.2-2' }} / R\${{ confirmedBooking?.total_amount }}</span>
              </div>
              <div class="w-full rounded-full h-2.5" style="background-color: var(--muted)">
                <div class="h-2.5 rounded-full" style="background-color: var(--primary)"
                     [style.width.%]="(confirmedBooking?.paid_amount || 0) / (confirmedBooking?.total_amount || 1) * 100"></div>
              </div>
            </div>

            <span class="badge badge-accent">aguardando pagamento</span>
          </div>

          <button class="btn-outline w-full" (click)="resetReservation()">Fazer nova reserva</button>
        </div>
      </div>

      <!-- Minhas Reservas tab -->
      <div *ngIf="activeTab === 'minhas'">
        <div class="mb-4">
          <input class="input" [(ngModel)]="searchName" placeholder="Digite seu nome para buscar suas reservas...">
        </div>
        <div class="space-y-3">
          <div *ngFor="let b of myBookings"
               class="card p-4">
            <div class="flex items-center justify-between mb-2">
              <div>
                <div class="font-semibold text-sm" style="color: var(--foreground)">{{ getCourtName(b.court_id) }}</div>
                <div class="text-xs mt-0.5" style="color: var(--muted-foreground)">{{ b.date | date:'dd/MM/yyyy' }} · {{ b.start_hour }}-{{ b.end_hour }}</div>
              </div>
              <span class="badge" [ngClass]="getStatusClass(b.payment_status)">{{ b.payment_status }}</span>
            </div>
            <div class="flex items-center justify-between pt-2" style="border-top: 1px solid var(--border)">
              <span class="text-sm" style="color: var(--muted-foreground)">Total: <strong style="color: var(--foreground)">R\${{ b.total_amount }}</strong></span>
              <button *ngIf="b.payment_status === 'pendente'" class="text-xs btn-outline py-1 px-3" style="color: var(--primary); border-color: var(--primary)">
                Entrar na fila de espera
              </button>
            </div>
          </div>
          <div *ngIf="searchName && myBookings.length === 0" class="text-center py-12" style="color: var(--muted-foreground)">
            <div class="mb-2" style="color:var(--border)"><span class="material-icons" style="font-size:2.5rem">search</span></div>
            <p class="font-medium">Nenhuma reserva encontrada</p>
            <p class="text-sm mt-1">Faça sua primeira reserva na aba "Nova Reserva"</p>
          </div>
          <div *ngIf="!searchName" class="text-center py-12" style="color: var(--muted-foreground)">
            <p class="text-sm">Digite seu nome para ver suas reservas</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReservasComponent implements OnInit {
  activeTab: 'nova' | 'minhas' = 'nova';
  step = 1;
  courts: Court[] = [];
  bookings: Booking[] = [];
  selectedCourt: Court | null = null;
  slotConflict = false;
  mensalistaConflict = false;
  durationHours = 0;
  searchName = '';
  confirmedBooking: { paid_amount: number; total_amount: number } | null = null;

  hours = Array.from({ length: 17 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);
  get endHours() { return this.hours.slice(1); }
  get todayStr() { return new Date().toISOString().split('T')[0]; }
  get availableCourts() { return this.courts.filter(c => c.status !== 'bloqueada'); }
  get perPlayerAmount() { return this.booking.num_players > 0 ? this.booking.total_amount / this.booking.num_players : this.booking.total_amount; }

  get myBookings(): Booking[] {
    if (!this.searchName) return [];
    return this.bookings.filter(b => b.client_name.toLowerCase().includes(this.searchName.toLowerCase()));
  }

  booking = this.emptyBooking();

  constructor(private data: DataService, private toast: ToastService) {}
  ngOnInit() {
    this.data.courts$.subscribe(c => this.courts = c);
    this.data.bookings$.subscribe(b => this.bookings = b);
  }

  emptyBooking() {
    return {
      court_id: '', date: new Date().toISOString().split('T')[0],
      start_hour: '09:00', end_hour: '10:00',
      organizer_name: '', num_players: 2, split_payment: false, total_amount: 0
    };
  }

  selectCourt(court: Court) {
    this.booking.court_id = court.id;
    this.selectedCourt = court;
    this.calcTotal();
    this.step = 2;
  }

  calcTotal() {
    const start = parseInt(this.booking.start_hour);
    const end = parseInt(this.booking.end_hour);
    this.durationHours = end - start;
    this.booking.total_amount = this.durationHours > 0 ? this.durationHours * (this.selectedCourt?.hourly_rate || 0) : 0;
  }

  checkSlotConflict() {
    const hasBookingConflict = this.bookings.some(b =>
      b.court_id   === this.booking.court_id &&
      b.date       === this.booking.date &&
      b.start_hour <  this.booking.end_hour &&
      b.end_hour   >  this.booking.start_hour
    );

    this.mensalistaConflict = this.data.isHorarioOcupadoPorMensalista(
      this.booking.court_id,
      this.booking.date,
      this.booking.start_hour,
      this.booking.end_hour
    );

    this.slotConflict = hasBookingConflict || this.mensalistaConflict;
  }

  confirmReservation() {
    if (!this.booking.organizer_name) return;
    const newBooking = {
      client_name: this.booking.organizer_name,
      court_id: this.booking.court_id,
      date: this.booking.date,
      start_hour: this.booking.start_hour,
      end_hour: this.booking.end_hour,
      payment_method: 'pix' as any,
      payment_status: 'pendente' as any,
      total_amount: this.booking.total_amount,
      paid_amount: 0,
      duration_hours: this.durationHours
    };
    this.data.addBooking(newBooking);
    this.confirmedBooking = { paid_amount: 0, total_amount: this.booking.total_amount };
    this.step = 4;
    this.toast.show('Reserva criada! Aguardando pagamento.');
  }

  resetReservation() {
    this.booking = this.emptyBooking();
    this.selectedCourt = null;
    this.step = 1;
  }

  getCourtName(id: string): string { return this.courts.find(c => c.id === id)?.name || 'Quadra'; }
  getStatusClass(s: string) { return s === 'pago' ? 'badge-primary' : s === 'pendente' ? 'badge-accent' : 'badge-muted'; }
}
