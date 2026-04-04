import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { Court, DiaSemana, Mensalista } from '../../models/models';

const DIAS: { value: DiaSemana; label: string }[] = [
  { value: 'domingo', label: 'Domingo'       },
  { value: 'segunda', label: 'Segunda-feira' },
  { value: 'terca',   label: 'Terça-feira'   },
  { value: 'quarta',  label: 'Quarta-feira'  },
  { value: 'quinta',  label: 'Quinta-feira'  },
  { value: 'sexta',   label: 'Sexta-feira'   },
  { value: 'sabado',  label: 'Sábado'        },
];

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
          <p class="text-sm mt-1" style="color:var(--muted-foreground)">Grupos com horário fixo semanal</p>
        </div>
        <button class="btn-primary" (click)="openModal()">
          <span class="material-icons" style="font-size:1rem">add</span> Novo Mensalista
        </button>
      </div>

      <!-- Regra de negócio: info box -->
      <div class="flex items-start gap-3 p-4 rounded-xl mb-5 text-sm"
           style="background-color:hsl(36,95%,55%,0.08);border:1px solid hsl(36,95%,55%,0.25);color:hsl(36,55%,32%)">
        <span class="material-icons flex-shrink-0" style="font-size:1.1rem;margin-top:1px">info</span>
        <span>Mensalistas <strong>ativos</strong> com pagamento <strong>confirmado</strong> bloqueiam automaticamente o horário para reservas avulsas.</span>
      </div>

      <!-- Filtros -->
      <div class="flex flex-wrap items-center gap-3 mb-5">
        <select class="select" style="width:auto;min-width:160px" [(ngModel)]="filterCourt">
          <option value="">Todas as quadras</option>
          <option *ngFor="let c of courts" [value]="c.id">{{ c.name }}</option>
        </select>
        <select class="select" style="width:auto;min-width:160px" [(ngModel)]="filterDay">
          <option value="">Todos os dias</option>
          <option *ngFor="let d of diasOptions" [value]="d.value">{{ d.label }}</option>
        </select>
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <label class="toggle">
            <input type="checkbox" [(ngModel)]="filterOnlyActive">
            <span class="toggle-slider"></span>
          </label>
          <span class="text-sm font-medium" style="color:var(--foreground)">Apenas ativos</span>
        </label>
        <span class="text-xs ml-auto" style="color:var(--muted-foreground)">{{ filteredMensalistas.length }} resultado(s)</span>
      </div>

      <!-- Grid de cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        <div *ngFor="let m of filteredMensalistas" class="card p-5 flex flex-col">

          <!-- Ícone + badges -->
          <div class="flex items-start justify-between mb-3">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                 style="background-color:hsl(36,95%,55%,0.12)">
              <span class="material-icons" style="font-size:1.3rem;color:hsl(36,65%,38%)">card_membership</span>
            </div>
            <div class="flex flex-wrap gap-1.5 justify-end">
              <span class="badge" [ngClass]="m.payment_status === 'confirmado' ? 'badge-primary' : 'badge-accent'">
                {{ m.payment_status === 'confirmado' ? 'Pago' : 'Pendente' }}
              </span>
              <span class="badge" [ngClass]="m.active ? 'badge-primary' : 'badge-muted'">
                {{ m.active ? 'Ativo' : 'Inativo' }}
              </span>
            </div>
          </div>

          <!-- Nome -->
          <h3 class="font-heading font-bold text-base mb-2" style="color:var(--foreground)">{{ m.group_name }}</h3>

          <!-- Detalhes -->
          <div class="space-y-1.5 flex-1">
            <div class="flex items-center gap-2 text-xs" style="color:var(--muted-foreground)">
              <span class="material-icons" style="font-size:0.9rem">sports_volleyball</span>
              <span>{{ getCourtName(m.court_id) }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs" style="color:var(--muted-foreground)">
              <span class="material-icons" style="font-size:0.9rem">calendar_month</span>
              <span>{{ getDiaLabel(m.day_of_week) }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs" style="color:var(--muted-foreground)">
              <span class="material-icons" style="font-size:0.9rem">schedule</span>
              <span>{{ m.start_hour }} – {{ m.end_hour }}</span>
            </div>
            <div *ngIf="m.monthly_amount" class="flex items-center gap-2 text-xs" style="color:var(--muted-foreground)">
              <span class="material-icons" style="font-size:0.9rem">payments</span>
              <span>R\${{ m.monthly_amount }}/mês</span>
            </div>
            <div *ngIf="m.contact_phone" class="flex items-center gap-2 text-xs" style="color:var(--muted-foreground)">
              <span class="material-icons" style="font-size:0.9rem">phone</span>
              <span>{{ m.contact_phone }}</span>
            </div>
          </div>

          <!-- Aviso: bloqueio ativo -->
          <div *ngIf="m.active && m.payment_status === 'confirmado'"
               class="mt-3 flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg"
               style="background-color:hsl(152,69%,40%,0.08);color:var(--primary)">
            <span class="material-icons" style="font-size:0.85rem">lock</span>
            <span>Horário bloqueado para reservas</span>
          </div>
          <div *ngIf="m.active && m.payment_status === 'pendente'"
               class="mt-3 flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg"
               style="background-color:hsl(36,95%,55%,0.08);color:hsl(36,65%,38%)">
            <span class="material-icons" style="font-size:0.85rem">lock_open</span>
            <span>Pagamento pendente — horário disponível</span>
          </div>

          <!-- Ações -->
          <div class="flex items-center gap-2 mt-4 pt-3" style="border-top:1px solid var(--border)">
            <button class="btn-ghost text-xs px-2 py-1.5 flex items-center gap-1 flex-1"
                    (click)="editMensalista(m)">
              <span class="material-icons" style="font-size:0.95rem">edit</span> Editar
            </button>
            <label class="toggle flex-shrink-0" [title]="m.active ? 'Desativar' : 'Ativar'">
              <input type="checkbox" [checked]="m.active" (change)="toggleActive(m)">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="filteredMensalistas.length === 0" class="col-span-full text-center py-16" style="color:var(--muted-foreground)">
          <div class="mb-3" style="color:var(--border)"><span class="material-icons" style="font-size:3rem">card_membership</span></div>
          <p class="font-medium">Nenhum mensalista encontrado</p>
          <p class="text-sm mt-1">Clique em "Novo Mensalista" para cadastrar</p>
        </div>

      </div>
    </div>

    <!-- Modal add/edit -->
    <div *ngIf="showModal" class="modal-overlay" (click)="closeModal($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-heading font-bold text-lg" style="color:var(--foreground)">
            {{ editingId ? 'Editar Mensalista' : 'Novo Mensalista' }}
          </h2>
          <button class="btn-ghost p-1" (click)="closeModal()">
            <span class="material-icons" style="font-size:1.1rem">close</span>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Nome do grupo / responsável *</label>
            <input class="input" [(ngModel)]="form.group_name" placeholder="Ex: Grupo da Manhã">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Quadra *</label>
            <select class="select" [(ngModel)]="form.court_id">
              <option value="">Selecione...</option>
              <option *ngFor="let c of courts" [value]="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Dia da semana *</label>
            <select class="select" [(ngModel)]="form.day_of_week">
              <option *ngFor="let d of diasOptions" [value]="d.value">{{ d.label }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Início *</label>
              <select class="select" [(ngModel)]="form.start_hour">
                <option *ngFor="let h of hours" [value]="h">{{ h }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Fim *</label>
              <select class="select" [(ngModel)]="form.end_hour">
                <option *ngFor="let h of endHours" [value]="h">{{ h }}</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Valor mensal (R$)</label>
            <input class="input" type="number" [(ngModel)]="form.monthly_amount" min="0">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Telefone de contato</label>
            <input class="input" [(ngModel)]="form.contact_phone" placeholder="(99) 99999-9999">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Status de pagamento</label>
            <select class="select" [(ngModel)]="form.payment_status">
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado (bloqueia horário)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Observações</label>
            <textarea class="textarea" [(ngModel)]="form.notes" rows="2" placeholder="Alguma observação?"></textarea>
          </div>
          <div class="flex items-center gap-3 py-1">
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="form.active">
              <span class="toggle-slider"></span>
            </label>
            <span class="text-sm font-medium" style="color:var(--foreground)">
              {{ form.active ? 'Mensalista ativo' : 'Mensalista inativo' }}
            </span>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button class="btn-outline flex-1" (click)="closeModal()">Cancelar</button>
          <button *ngIf="editingId"
                  class="btn-outline flex-1"
                  style="border-color:var(--destructive);color:var(--destructive)"
                  (click)="deleteMensalista()">Excluir</button>
          <button class="btn-primary flex-1"
                  (click)="saveMensalista()"
                  [disabled]="!form.group_name || !form.court_id">
            {{ editingId ? 'Salvar' : 'Cadastrar' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class MensalistasComponent implements OnInit {
  courts:      Court[]      = [];
  mensalistas: Mensalista[] = [];
  showModal   = false;
  editingId:  string | null = null;

  filterCourt     = '';
  filterDay       = '';
  filterOnlyActive = false;

  diasOptions = DIAS;
  hours    = Array.from({ length: 17 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);
  get endHours() { return this.hours.slice(1); }

  form = this.emptyForm();

  constructor(private data: DataService, private toast: ToastService) {}

  ngOnInit() {
    this.data.courts$.subscribe(c      => this.courts      = c);
    this.data.mensalistas$.subscribe(m => this.mensalistas = m);
  }

  get filteredMensalistas(): Mensalista[] {
    return this.mensalistas.filter(m => {
      if (this.filterCourt    && m.court_id    !== this.filterCourt) return false;
      if (this.filterDay      && m.day_of_week !== this.filterDay)   return false;
      if (this.filterOnlyActive && !m.active)                        return false;
      return true;
    });
  }

  getCourtName(id: string): string {
    return this.courts.find(c => c.id === id)?.name || 'Quadra';
  }

  getDiaLabel(day: DiaSemana): string {
    return DIAS.find(d => d.value === day)?.label || day;
  }

  emptyForm() {
    return {
      group_name:     '',
      court_id:       '',
      day_of_week:    'domingo' as DiaSemana,
      start_hour:     '08:00',
      end_hour:       '10:00',
      monthly_amount: 0,
      contact_phone:  '',
      payment_status: 'pendente' as 'confirmado' | 'pendente',
      notes:          '',
      active:         true,
    };
  }

  openModal() {
    this.form      = this.emptyForm();
    this.editingId = null;
    this.showModal = true;
  }

  editMensalista(m: Mensalista) {
    this.form = {
      group_name:     m.group_name,
      court_id:       m.court_id,
      day_of_week:    m.day_of_week,
      start_hour:     m.start_hour,
      end_hour:       m.end_hour,
      monthly_amount: m.monthly_amount ?? 0,
      contact_phone:  m.contact_phone  ?? '',
      payment_status: m.payment_status,
      notes:          m.notes          ?? '',
      active:         m.active,
    };
    this.editingId = m.id;
    this.showModal = true;
  }

  saveMensalista() {
    if (!this.form.group_name || !this.form.court_id) return;
    if (this.editingId) {
      this.data.updateMensalista(this.editingId, this.form);
      this.toast.show('Mensalista atualizado!');
    } else {
      this.data.addMensalista(this.form);
      this.toast.show('Mensalista cadastrado!');
    }
    this.closeModal();
  }

  deleteMensalista() {
    if (this.editingId) {
      this.data.deleteMensalista(this.editingId);
      this.toast.show('Mensalista excluído!');
      this.closeModal();
    }
  }

  toggleActive(m: Mensalista) {
    this.data.updateMensalista(m.id, { active: !m.active });
    this.toast.show(m.active ? 'Mensalista desativado.' : 'Mensalista ativado!');
  }

  closeModal(e?: MouseEvent) {
    if (e && e.target !== e.currentTarget) return;
    this.showModal = false;
    this.editingId = null;
  }
}
