import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { Court } from '../../models/models';

const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

interface AdminMensalista {
  id:             string;
  client_name:    string;
  client_phone:   string | null;
  group_name:     string | null;
  court_id:       string;
  day_of_week:    number;
  start_hour:     string;
  end_hour:       string;
  status:         'ATIVO' | 'INATIVO' | 'EXPIRADO';
  payment_status: 'PAGO' | 'PENDENTE' | 'CANCELADO';
  valid_until:    string | null;
  created_at:     string;
  updated_at:     string;
  court: {
    name:            string;
    hourly_rate:     number;
    mensalista_rate: number | null;
  };
}

@Component({
  selector: 'app-mensalistas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="font-heading font-bold text-2xl lg:text-3xl" style="color:var(--foreground)">Mensalistas</h1>
          <p class="text-sm mt-1" style="color:var(--muted-foreground)">Horários fixos semanais contratados pelos clientes</p>
        </div>
        <button class="btn-outline flex items-center gap-2" (click)="load()" [disabled]="loading">
          <span class="material-icons" style="font-size:1rem"
                [style.animation]="loading ? 'spin 1s linear infinite' : 'none'">refresh</span>
          Atualizar
        </button>
      </div>

      <!-- Info box -->
      <div class="flex items-start gap-3 p-4 rounded-xl mb-5 text-sm"
           style="background-color:hsl(36,95%,55%,0.08);border:1px solid hsl(36,95%,55%,0.25);color:hsl(36,55%,32%)">
        <span class="material-icons flex-shrink-0" style="font-size:1.1rem;margin-top:1px">info</span>
        <span>Mensalistas <strong>ativos</strong> com pagamento <strong>confirmado</strong> bloqueiam automaticamente o horário para reservas avulsas. Clientes criam e pagam pelo app.</span>
      </div>

      <!-- Filtros -->
      <div class="flex flex-wrap items-center gap-3 mb-5">
        <select class="select" style="width:auto;min-width:160px" [(ngModel)]="filterCourt">
          <option value="">Todas as quadras</option>
          <option *ngFor="let c of courts" [value]="c.id">{{ c.name }}</option>
        </select>
        <select class="select" style="width:auto;min-width:160px" [(ngModel)]="filterDay">
          <option value="">Todos os dias</option>
          <option *ngFor="let d of dayOptions" [value]="d.value">{{ d.label }}</option>
        </select>
        <select class="select" style="width:auto;min-width:160px" [(ngModel)]="filterStatus">
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativos</option>
          <option value="PENDENTE">Aguardando pagamento</option>
          <option value="EXPIRADO">Expirados</option>
          <option value="CANCELADO">Cancelados</option>
        </select>
        <span class="text-xs ml-auto" style="color:var(--muted-foreground)">{{ filtered.length }} resultado(s)</span>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-16" style="color:var(--muted-foreground)">
        <span class="material-icons" style="font-size:2.5rem;animation:spin 1s linear infinite">refresh</span>
        <p class="mt-3 text-sm">Carregando mensalistas...</p>
      </div>

      <!-- Grid de cards -->
      <div *ngIf="!loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        <div *ngFor="let m of filtered" class="card p-5 flex flex-col">

          <!-- Ícone + badges -->
          <div class="flex items-start justify-between mb-3">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                 [style.background]="m.status === 'ATIVO' ? 'hsl(152,69%,40%,0.1)' : 'var(--muted)'">
              <span class="material-icons" style="font-size:1.3rem"
                    [style.color]="m.status === 'ATIVO' ? 'var(--primary)' : 'var(--muted-foreground)'">
                card_membership
              </span>
            </div>
            <div class="flex flex-wrap gap-1.5 justify-end">
              <span class="badge" [ngClass]="paymentBadge(m)">{{ paymentLabel(m) }}</span>
              <span *ngIf="m.payment_status !== 'CANCELADO'" class="badge" [ngClass]="statusBadge(m)">{{ statusLabel(m) }}</span>
            </div>
          </div>

          <!-- Nome do cliente / grupo -->
          <h3 class="font-heading font-bold text-base mb-0.5" style="color:var(--foreground)">{{ m.group_name || m.client_name }}</h3>
          <p class="text-xs mb-3" style="color:var(--muted-foreground)">{{ m.group_name ? m.client_name + ' · ' : '' }}{{ m.court.name }}</p>

          <!-- Detalhes -->
          <div class="space-y-1.5 flex-1">
            <div class="flex items-center gap-2 text-xs" style="color:var(--muted-foreground)">
              <span class="material-icons" style="font-size:0.9rem">calendar_month</span>
              <span>{{ dayName(m.day_of_week) }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs" style="color:var(--muted-foreground)">
              <span class="material-icons" style="font-size:0.9rem">schedule</span>
              <span>{{ m.start_hour }} – {{ m.end_hour }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs" style="color:var(--muted-foreground)">
              <span class="material-icons" style="font-size:0.9rem">payments</span>
              <span>R\${{ monthlyAmount(m) | number:'1.2-2' }}/mês</span>
            </div>
            <div *ngIf="m.client_phone" class="flex items-center gap-2 text-xs" style="color:var(--muted-foreground)">
              <span class="material-icons" style="font-size:0.9rem">phone</span>
              <span>{{ m.client_phone }}</span>
            </div>
            <div *ngIf="m.valid_until" class="flex items-center gap-2 text-xs" style="color:var(--muted-foreground)">
              <span class="material-icons" style="font-size:0.9rem">event</span>
              <span>Válido até {{ m.valid_until | date:'dd/MM/yyyy':'UTC' }}</span>
            </div>
          </div>

          <!-- Status bar -->
          <div *ngIf="m.status === 'ATIVO' && m.payment_status === 'PAGO'"
               class="mt-3 flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg"
               style="background-color:hsl(152,69%,40%,0.08);color:var(--primary)">
            <span class="material-icons" style="font-size:0.85rem">lock</span>
            <span>Horário bloqueado para reservas avulsas</span>
          </div>
          <div *ngIf="m.payment_status === 'PENDENTE'"
               class="mt-3 flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg"
               style="background-color:hsl(36,95%,55%,0.08);color:hsl(36,65%,38%)">
            <span class="material-icons" style="font-size:0.85rem">hourglass_top</span>
            <span>Aguardando pagamento do cliente</span>
          </div>
          <div *ngIf="m.status === 'EXPIRADO'"
               class="mt-3 flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg"
               style="background-color:hsl(0,84%,60%,0.07);color:hsl(0,72%,45%)">
            <span class="material-icons" style="font-size:0.85rem">schedule</span>
            <span>Vigência encerrada — aguardando renovação</span>
          </div>
          <div *ngIf="m.payment_status === 'CANCELADO'"
               class="mt-3 flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg"
               style="background-color:hsl(0,0%,0%,0.04);color:var(--muted-foreground);border:1px dashed var(--border)">
            <span class="material-icons" style="font-size:0.85rem">auto_delete</span>
            <span>{{ cleanupLabel(m) }}</span>
          </div>

          <!-- Ações -->
          <div class="flex items-center gap-2 mt-4 pt-3" style="border-top:1px solid var(--border)">
            <button *ngIf="m.status === 'ATIVO'"
                    class="btn-outline text-xs px-3 py-1.5 flex items-center gap-1 w-full"
                    style="border-color:hsl(0,72%,51%,0.4);color:hsl(0,72%,51%)"
                    [disabled]="inativando === m.id"
                    (click)="inativar(m)">
              <span class="material-icons" style="font-size:0.95rem"
                    [style.animation]="inativando === m.id ? 'spin 1s linear infinite' : 'none'">
                {{ inativando === m.id ? 'refresh' : 'block' }}
              </span>
              {{ inativando === m.id ? 'Inativando...' : 'Inativar mensalista' }}
            </button>
            <span *ngIf="m.status !== 'ATIVO'"
                  class="text-xs w-full text-center" style="color:var(--muted-foreground)">
              Sem ações disponíveis
            </span>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="filtered.length === 0" class="col-span-full text-center py-16" style="color:var(--muted-foreground)">
          <div class="mb-3"><span class="material-icons" style="font-size:3rem;color:var(--border)">card_membership</span></div>
          <p class="font-medium">Nenhum mensalista encontrado</p>
          <p class="text-sm mt-1">Os clientes criam mensalistas pelo app de reservas.</p>
        </div>

      </div>
    </div>
  `
})
export class MensalistasComponent implements OnInit {
  courts:      Court[]            = [];
  mensalistas: AdminMensalista[]  = [];
  loading    = false;
  inativando: string | null       = null;

  filterCourt  = '';
  filterDay    = '';
  filterStatus = 'ATIVO';

  dayOptions = DAY_NAMES.map((label, value) => ({ value, label }));

  constructor(
    private api:  ApiService,
    private data: DataService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.data.courts$.subscribe(c => this.courts = c);
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      this.mensalistas = await firstValueFrom(
        this.api.get<AdminMensalista[]>('/admin/mensalistas')
      );
    } catch (err: any) {
      this.toast.show(err?.error?.error || 'Erro ao carregar mensalistas.');
    } finally {
      this.loading = false;
    }
  }

  /** Cancelados somem da lista após 3 dias (apenas no front). */
  private isCancelledAndExpired(m: AdminMensalista): boolean {
    if (m.payment_status !== 'CANCELADO') return false;
    const ref  = new Date(m.updated_at || m.created_at);
    const diff = (Date.now() - ref.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 3;
  }

  get filtered(): AdminMensalista[] {
    return this.mensalistas.filter(m => {
      if (this.isCancelledAndExpired(m)) return false;
      if (this.filterCourt && m.court_id !== this.filterCourt) return false;
      if (this.filterDay !== '' && m.day_of_week !== Number(this.filterDay)) return false;
      if (this.filterStatus) {
        if (this.filterStatus === 'PENDENTE') return m.payment_status === 'PENDENTE';
        if (this.filterStatus === 'CANCELADO') return m.payment_status === 'CANCELADO';
        return m.status === this.filterStatus;
      }
      return true;
    });
  }

  dayName(dow: number): string {
    return DAY_NAMES[dow] ?? String(dow);
  }

  monthlyAmount(m: AdminMensalista): number {
    const rate     = m.court.mensalista_rate ?? m.court.hourly_rate;
    const duration = parseInt(m.end_hour) - parseInt(m.start_hour);
    return duration * rate * 4;
  }

  cleanupLabel(m: AdminMensalista): string {
    const ref      = new Date(m.updated_at || m.created_at);
    const elapsedH = (Date.now() - ref.getTime()) / (1000 * 60 * 60);
    const remaining = Math.ceil(72 - elapsedH); // 72h = 3 dias
    if (remaining <= 0)  return 'Removido em breve';
    if (remaining < 24) return `Limpo em menos de 1 dia`;
    const days = Math.ceil(remaining / 24);
    return `Limpo em ${days} dia${days > 1 ? 's' : ''}`;
  }

  statusLabel(m: AdminMensalista): string {
    if (m.status === 'ATIVO')    return 'Ativo';
    if (m.status === 'EXPIRADO') return 'Expirado';
    if (m.payment_status === 'CANCELADO') return 'Cancelado';
    return 'Inativo';
  }

  statusBadge(m: AdminMensalista): string {
    if (m.status === 'ATIVO')    return 'badge-primary';
    if (m.status === 'EXPIRADO') return 'badge-accent';
    return 'badge-muted';
  }

  paymentLabel(m: AdminMensalista): string {
    if (m.payment_status === 'PAGO')      return 'Pago';
    if (m.payment_status === 'PENDENTE')  return 'Aguardando PIX';
    if (m.payment_status === 'CANCELADO') return 'Cancelado';
    return m.payment_status;
  }

  paymentBadge(m: AdminMensalista): string {
    if (m.payment_status === 'PAGO')      return 'badge-primary';
    if (m.payment_status === 'PENDENTE')  return 'badge-accent';
    return 'badge-muted';
  }

  async inativar(m: AdminMensalista): Promise<void> {
    if (this.inativando) return;
    this.inativando = m.id;
    try {
      await firstValueFrom(
        this.api.patch<{ ok: boolean }>(`/admin/mensalistas/${m.id}/inativar`, {})
      );
      // Atualiza localmente sem recarregar tudo
      this.mensalistas = this.mensalistas.map(x =>
        x.id === m.id ? { ...x, status: 'INATIVO' } : x
      );
      this.toast.show(`Mensalista de ${m.client_name} inativado.`);
    } catch (err: any) {
      this.toast.show(err?.error?.error || 'Erro ao inativar. Tente novamente.');
    } finally {
      this.inativando = null;
    }
  }
}
