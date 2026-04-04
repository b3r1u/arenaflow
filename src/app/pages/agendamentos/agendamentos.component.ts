import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { Booking, Court, Mensalista } from '../../models/models';

@Component({
  selector: 'app-agendamentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="font-heading font-bold text-2xl lg:text-3xl" style="color: var(--foreground)">Agendamentos</h1>
          <p class="text-sm mt-1" style="color: var(--muted-foreground)">Gerencie as reservas das quadras</p>
        </div>
        <button class="btn-primary" (click)="openModal()">
          <span>+</span> Nova Reserva
        </button>
      </div>

      <!-- Date navigator -->
      <div class="flex items-center gap-3 mb-5">
        <button class="btn-outline p-2" (click)="changeDate(-1)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div class="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm card border" style="border-color: var(--border)">
          <span class="material-icons" style="font-size:1rem">calendar_month</span>
          <span class="font-heading">{{ formatDate(currentDate) }}</span>
        </div>
        <button class="btn-outline p-2" (click)="changeDate(1)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      <!-- Legenda -->
      <div class="flex items-center gap-4 mb-4 flex-wrap">
        <div class="flex items-center gap-1.5 text-xs" style="color:var(--muted-foreground)">
          <div class="w-3 h-3 rounded" style="background:var(--primary)"></div>
          <span>Reserva</span>
        </div>
        <div class="flex items-center gap-1.5 text-xs" style="color:var(--muted-foreground)">
          <div class="w-3 h-3 rounded" style="background:hsl(36,95%,55%)"></div>
          <span>Mensalista</span>
        </div>
      </div>

      <!-- Mobile: booking cards list -->
      <div class="lg:hidden space-y-3">
        <ng-container *ngFor="let court of courts">
          <div class="card overflow-hidden">
            <!-- Court header -->
            <div class="flex items-center justify-between px-4 py-3"
                 style="background-color:var(--muted);border-bottom:1px solid var(--border)">
              <div class="flex items-center gap-2">
                <span class="material-icons" style="font-size:1rem;color:var(--primary)">sports_volleyball</span>
                <span class="font-heading font-semibold text-sm" style="color:var(--foreground)">{{ court.name }}</span>
              </div>
              <span class="badge" [ngClass]="getCourtStatusClass(court.status)">{{ court.status }}</span>
            </div>
            <!-- Entries: bookings + mensalistas -->
            <div class="divide-y" style="border-color:var(--border)">
              <ng-container *ngFor="let hour of hours">
                <!-- Booking entry -->
                <ng-container *ngIf="getBookingForSlot(court.id, hour) as booking">
                  <div *ngIf="booking.start_hour === hour"
                       class="flex items-center gap-3 px-4 py-3 cursor-pointer active:opacity-70"
                       (click)="editBooking(booking)">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center font-heading font-bold text-xs flex-shrink-0"
                         style="background-color:hsl(152,69%,40%,0.12);color:var(--primary)">
                      {{ booking.client_name.charAt(0) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold text-sm truncate" style="color:var(--foreground)">{{ booking.client_name }}</div>
                      <div class="text-xs" style="color:var(--muted-foreground)">{{ booking.start_hour }}–{{ booking.end_hour }} · R\${{ booking.total_amount }}</div>
                    </div>
                    <span class="badge flex-shrink-0" [ngClass]="getPaymentStatusClass(booking.payment_status)">{{ booking.payment_status }}</span>
                  </div>
                </ng-container>
                <!-- Mensalista entry -->
                <ng-container *ngIf="getMensalistaForSlot(court.id, hour) as mensalista">
                  <div *ngIf="mensalista.start_hour === hour"
                       class="flex items-center gap-3 px-4 py-3">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                         style="background-color:hsl(36,95%,55%,0.15)">
                      <span class="material-icons" style="font-size:1rem;color:hsl(36,65%,38%)">card_membership</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold text-sm truncate" style="color:hsl(36,50%,30%)">{{ mensalista.group_name }}</div>
                      <div class="text-xs" style="color:hsl(36,40%,45%)">{{ mensalista.start_hour }}–{{ mensalista.end_hour }} · Mensalista</div>
                    </div>
                    <span class="badge flex-shrink-0" style="background:hsl(36,95%,55%,0.15);color:hsl(36,65%,35%)">mensalista</span>
                  </div>
                </ng-container>
              </ng-container>
              <!-- Empty state -->
              <div *ngIf="getDayBookingsForCourt(court.id).length === 0 && getMensalistasForCourt(court.id).length === 0 && court.status !== 'bloqueada'"
                   class="px-4 py-5 text-center">
                <p class="text-sm mb-2" style="color:var(--muted-foreground)">Sem reservas</p>
                <button class="btn-outline text-xs py-1.5 px-3" (click)="openModal(court.id)">+ Adicionar</button>
              </div>
              <div *ngIf="court.status === 'bloqueada'" class="px-4 py-4 text-center text-xs" style="color:var(--destructive)">
                Quadra bloqueada
              </div>
            </div>
          </div>
        </ng-container>
        <div *ngIf="courts.length === 0" class="text-center py-12 card" style="color:var(--muted-foreground)">
          <p>Nenhuma quadra cadastrada</p>
        </div>
      </div>

      <!-- Desktop: grid table -->
      <div class="hidden lg:block card overflow-auto mobile-scroll">
        <table class="w-full text-sm">
          <thead>
            <tr style="border-bottom:1px solid var(--border)">
              <th class="p-3 text-left font-heading font-semibold w-20" style="color:var(--muted-foreground)">Horário</th>
              <th *ngFor="let court of courts" class="p-3 text-center font-heading font-semibold" style="color:var(--foreground)">
                {{ court.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let hour of hours" style="border-bottom:1px solid var(--border)" class="transition-colors"
                [style.background-color]="hoveredRow === hour ? 'hsl(150,10%,97%)' : ''"
                (mouseenter)="hoveredRow=hour" (mouseleave)="hoveredRow=''">
              <td class="p-3 font-medium text-xs" style="color:var(--muted-foreground)">{{ hour }}</td>
              <td *ngFor="let court of courts" class="p-1.5 text-center" style="min-width:130px">

                <!-- Prioridade 1: reserva avulsa -->
                <ng-container *ngIf="getBookingForSlot(court.id, hour) as booking; else checkMensalista">
                  <div *ngIf="booking.start_hour === hour"
                       class="rounded-xl px-2 py-2 text-xs text-white font-medium cursor-pointer transition-opacity hover:opacity-90"
                       style="background-color:var(--primary)"
                       (click)="editBooking(booking)">
                    <div class="font-semibold truncate">{{ booking.client_name }}</div>
                    <div class="opacity-75 text-[10px]">{{ booking.start_hour }}–{{ booking.end_hour }}</div>
                    <span class="badge mt-1" style="background:rgba(255,255,255,0.2);color:white;font-size:9px">{{ booking.payment_status }}</span>
                  </div>
                  <div *ngIf="booking.start_hour !== hour" class="h-2 mx-2 rounded"
                       style="background-color:hsl(152,69%,40%,0.15)"></div>
                </ng-container>

                <!-- Prioridade 2: mensalista ativo + confirmado -->
                <ng-template #checkMensalista>
                  <ng-container *ngIf="getMensalistaForSlot(court.id, hour) as mensalista; else emptySlot">
                    <div *ngIf="mensalista.start_hour === hour"
                         class="rounded-xl px-2 py-2 text-xs font-medium"
                         style="background-color:hsl(36,95%,55%,0.15);border:1px solid hsl(36,95%,55%,0.35)">
                      <div class="font-semibold truncate" style="color:hsl(36,55%,30%)">{{ mensalista.group_name }}</div>
                      <div class="opacity-75 text-[10px]" style="color:hsl(36,55%,35%)">{{ mensalista.start_hour }}–{{ mensalista.end_hour }}</div>
                      <span class="badge mt-1" style="background:hsl(36,95%,55%,0.2);color:hsl(36,65%,30%);font-size:9px">mensalista</span>
                    </div>
                    <div *ngIf="mensalista.start_hour !== hour" class="h-2 mx-2 rounded"
                         style="background-color:hsl(36,95%,55%,0.2)"></div>
                  </ng-container>

                  <!-- Prioridade 3: slot vazio -->
                  <ng-template #emptySlot>
                    <button *ngIf="court.status !== 'bloqueada'"
                            class="w-full rounded-xl py-2 text-xs transition-all"
                            [style.opacity]="hoveredRow === hour ? '1' : '0'"
                            style="border:1px dashed var(--border);color:var(--muted-foreground)"
                            (click)="openModal(court.id, hour)">+</button>
                    <div *ngIf="court.status === 'bloqueada'" class="rounded-xl py-1.5 text-xs text-center"
                         style="background-color:hsl(0,84%,60%,0.08);color:var(--destructive)">—</div>
                  </ng-template>
                </ng-template>

              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal nova/editar reserva -->
    <div *ngIf="showModal" class="modal-overlay" (click)="closeModal($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-heading font-bold text-lg" style="color: var(--foreground)">
            {{ editingId ? 'Editar Reserva' : 'Nova Reserva' }}
          </h2>
          <button class="btn-ghost p-1" (click)="closeModal()"><span class="material-icons" style="font-size:1.1rem">close</span></button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Nome do Cliente *</label>
            <input class="input" [(ngModel)]="form.client_name" placeholder="Nome completo" (blur)="autoFillPhone()">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Telefone</label>
            <input class="input" [(ngModel)]="form.client_phone" placeholder="(99) 99999-9999">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Quadra *</label>
            <select class="select" [(ngModel)]="form.court_id" (ngModelChange)="calcPrice()">
              <option value="">Selecione...</option>
              <option *ngFor="let c of activeCourts" [value]="c.id">{{ c.name }} - R\${{ c.hourly_rate }}/h</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Data *</label>
            <input class="input" type="date" [(ngModel)]="form.date" (ngModelChange)="calcPrice()">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Início *</label>
              <select class="select" [(ngModel)]="form.start_hour" (ngModelChange)="calcPrice()">
                <option *ngFor="let h of hours" [value]="h">{{ h }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Fim *</label>
              <select class="select" [(ngModel)]="form.end_hour" (ngModelChange)="calcPrice()">
                <option *ngFor="let h of endHours" [value]="h">{{ h }}</option>
              </select>
            </div>
          </div>

          <!-- Conflict warnings -->
          <div *ngIf="hasConflict && conflictType === 'mensalista'"
               class="flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
               style="background-color:hsl(36,95%,55%,0.1);color:hsl(36,65%,35%);border:1px solid hsl(36,95%,55%,0.3)">
            <span class="material-icons" style="font-size:1rem">card_membership</span>
            Horário reservado por mensalistas!
          </div>
          <div *ngIf="hasConflict && conflictType === 'reserva'"
               class="flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
               style="background-color: hsl(0,84%,60%,0.1); color: var(--destructive)">
            <span class="material-icons" style="font-size:1rem">warning</span>
            Conflito de horário detectado!
          </div>

          <!-- Price preview -->
          <div *ngIf="pricePreview > 0" class="p-4 rounded-xl text-sm font-medium" style="background-color: hsl(152,69%,40%,0.05); border: 1px solid hsl(152,69%,40%,0.2)">
            <div style="color: var(--muted-foreground)">{{ durationHours }}h × R\${{ hourlyRate }}/h</div>
            <div class="font-heading font-bold text-lg mt-1" style="color: var(--primary)">R\${{ pricePreview }}</div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Pagamento</label>
            <select class="select" [(ngModel)]="form.payment_method">
              <option value="">Não informado</option>
              <option value="pix">Pix</option>
              <option value="cartão">Cartão</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Status</label>
            <select class="select" [(ngModel)]="form.payment_status">
              <option value="não informado">Não informado</option>
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Observações</label>
            <textarea class="textarea" [(ngModel)]="form.notes" placeholder="Alguma observação?" rows="2"></textarea>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button class="btn-outline flex-1" (click)="closeModal()">Cancelar</button>
          <button *ngIf="editingId" class="btn-outline flex-1" style="border-color: var(--destructive); color: var(--destructive)" (click)="deleteBooking()">Excluir</button>
          <button class="btn-primary flex-1" (click)="saveBooking()" [disabled]="hasConflict || !form.client_name || !form.court_id">
            {{ editingId ? 'Salvar' : 'Criar Reserva' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class AgendamentosComponent implements OnInit {
  courts:      Court[]      = [];
  bookings:    Booking[]    = [];
  mensalistas: Mensalista[] = [];

  currentDate = new Date();
  showModal   = false;
  editingId:  string | null = null;
  hasConflict = false;
  conflictType: 'reserva' | 'mensalista' = 'reserva';
  pricePreview  = 0;
  durationHours = 0;
  hourlyRate    = 0;
  hoveredRow    = '';

  hours    = Array.from({ length: 17 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);
  get endHours()     { return this.hours.slice(1); }
  get activeCourts() { return this.courts.filter(c => c.status !== 'bloqueada'); }
  get dateStr()      { return this.currentDate.toISOString().split('T')[0]; }

  form = this.emptyForm();

  constructor(private data: DataService, private toast: ToastService) {}

  ngOnInit() {
    this.data.courts$.subscribe(c      => this.courts      = c);
    this.data.bookings$.subscribe(b    => this.bookings    = b);
    this.data.mensalistas$.subscribe(m => this.mensalistas = m);
  }

  emptyForm() {
    return {
      client_name: '', client_phone: '', court_id: '',
      date: new Date().toISOString().split('T')[0],
      start_hour: '09:00', end_hour: '10:00',
      payment_method: '' as any, payment_status: 'pendente' as any,
      notes: '', total_amount: 0
    };
  }

  formatDate(d: Date): string {
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  }

  changeDate(delta: number) {
    const d = new Date(this.currentDate);
    d.setDate(d.getDate() + delta);
    this.currentDate = d;
  }

  // ─── Slot lookup ────────────────────────────────────────────────────────────

  getBookingForSlot(courtId: string, hour: string): Booking | undefined {
    return this.bookings.find(b =>
      b.court_id === courtId &&
      b.date     === this.dateStr &&
      b.start_hour <= hour &&
      b.end_hour   >  hour
    );
  }

  getMensalistaForSlot(courtId: string, hour: string): Mensalista | undefined {
    return this.data.getMensalistaForSlot(courtId, this.dateStr, hour);
  }

  getMensalistasForCourt(courtId: string): Mensalista[] {
    return this.data.getMensalistasAtivos(courtId, this.data.getDayOfWeek(this.dateStr));
  }

  getDayBookingsForCourt(courtId: string): Booking[] {
    return this.bookings.filter(b => b.court_id === courtId && b.date === this.dateStr);
  }

  // ─── Modal ──────────────────────────────────────────────────────────────────

  openModal(courtId?: string, hour?: string) {
    this.form       = this.emptyForm();
    this.form.date  = this.dateStr;
    if (courtId) this.form.court_id   = courtId;
    if (hour)   { this.form.start_hour = hour; this.form.end_hour = this.getNextHour(hour); }
    this.editingId  = null;
    this.calcPrice();
    this.showModal  = true;
  }

  editBooking(b: Booking) {
    this.form = {
      client_name: b.client_name, client_phone: b.client_phone || '',
      court_id: b.court_id, date: b.date, start_hour: b.start_hour,
      end_hour: b.end_hour, payment_method: b.payment_method || '' as any,
      payment_status: b.payment_status as any, notes: b.notes || '', total_amount: b.total_amount
    };
    this.editingId = b.id;
    this.calcPrice();
    this.showModal = true;
  }

  // ─── Conflict check (regra de negócio) ──────────────────────────────────────

  checkConflict() {
    if (!this.form.court_id) { this.hasConflict = false; return; }

    const hasBookingConflict = this.bookings.some(b =>
      b.court_id   === this.form.court_id &&
      b.date       === this.form.date &&
      b.id         !== this.editingId &&
      b.start_hour <  this.form.end_hour &&
      b.end_hour   >  this.form.start_hour
    );

    const hasMensalistaConflict = this.data.isHorarioOcupadoPorMensalista(
      this.form.court_id,
      this.form.date,
      this.form.start_hour,
      this.form.end_hour
    );

    this.hasConflict  = hasBookingConflict || hasMensalistaConflict;
    this.conflictType = hasMensalistaConflict ? 'mensalista' : 'reserva';
  }

  calcPrice() {
    const start = parseInt(this.form.start_hour);
    const end   = parseInt(this.form.end_hour);
    this.durationHours = end - start;
    const court = this.courts.find(c => c.id === this.form.court_id);
    this.hourlyRate   = court?.hourly_rate || 0;
    this.pricePreview = this.durationHours > 0 ? this.durationHours * this.hourlyRate : 0;
    this.checkConflict();
  }

  autoFillPhone() {
    const client = this.data.getClients().find(c => c.name === this.form.client_name);
    if (client?.phone) this.form.client_phone = client.phone;
  }

  saveBooking() {
    if (!this.form.client_name || !this.form.court_id) return;
    const booking = { ...this.form, total_amount: this.pricePreview || this.form.total_amount, duration_hours: this.durationHours };
    if (this.editingId) {
      this.data.updateBooking(this.editingId, booking);
      this.toast.show('Reserva atualizada!');
    } else {
      this.data.addBooking(booking);
      const exists = this.data.getClients().some(c => c.name === this.form.client_name);
      if (!exists && this.form.client_name) {
        this.data.addClient({ name: this.form.client_name, phone: this.form.client_phone || '' });
      }
      this.toast.show('Reserva criada!');
    }
    this.closeModal();
  }

  deleteBooking() {
    if (this.editingId) {
      this.data.deleteBooking(this.editingId);
      this.toast.show('Reserva excluída!');
      this.closeModal();
    }
  }

  closeModal(event?: MouseEvent) {
    if (event && event.target !== event.currentTarget) return;
    this.showModal = false;
    this.editingId = null;
  }

  getPaymentStatusClass(s: string) { return s === 'pago' ? 'badge-primary' : s === 'pendente' ? 'badge-accent' : 'badge-muted'; }
  getCourtStatusClass(s: string)   { return s === 'disponível' ? 'badge-primary' : s === 'bloqueada' ? 'badge-destructive' : 'badge-accent'; }

  getNextHour(h: string): string {
    const idx = this.hours.indexOf(h);
    return this.hours[Math.min(idx + 1, this.hours.length - 1)];
  }
}
