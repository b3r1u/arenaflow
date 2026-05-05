import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

interface Promotion {
  id:               string;
  title:            string;
  description:      string | null;
  type:             'DESCONTO' | 'EVENTO';
  discount_percent: number | null;
  start_date:       string;
  end_date:         string | null;
  start_hour:       string | null;
  end_hour:         string | null;
  active:           boolean;
  created_at:       string;
}

@Component({
  selector: 'app-promocoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="font-heading font-bold text-2xl lg:text-3xl" style="color:var(--foreground)">Promoções & Eventos</h1>
          <p class="text-sm mt-1" style="color:var(--muted-foreground)">Gerencie descontos e eventos especiais da sua arena</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-outline flex items-center gap-2" (click)="load()" [disabled]="loading">
            <span class="material-icons" style="font-size:1rem"
                  [style.animation]="loading ? 'spin 1s linear infinite' : 'none'">refresh</span>
            Atualizar
          </button>
          <button class="btn-primary flex items-center gap-2" (click)="openModal()">
            <span class="material-icons" style="font-size:1rem">add</span>
            Nova Promoção
          </button>
        </div>
      </div>

      <!-- Info box -->
      <div class="flex items-start gap-3 p-4 rounded-xl mb-5 text-sm"
           style="background-color:hsl(152,69%,40%,0.06);border:1px solid hsl(152,69%,40%,0.2);color:hsl(152,50%,30%)">
        <span class="material-icons flex-shrink-0" style="font-size:1.1rem;margin-top:1px">info</span>
        <span>Promoções <strong>ativas</strong> são exibidas para os clientes no app de reservas, na página da sua arena.</span>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-16" style="color:var(--muted-foreground)">
        <span class="material-icons" style="font-size:2.5rem;animation:spin 1s linear infinite">refresh</span>
        <p class="mt-3 text-sm">Carregando promoções...</p>
      </div>

      <!-- Grid de cards -->
      <div *ngIf="!loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        <div *ngFor="let promo of promotions"
             class="card p-5 flex flex-col transition-shadow hover:shadow-md"
             [style.opacity]="promo.active ? 1 : 0.55">

          <!-- Ícone + toggle -->
          <div class="flex items-start justify-between mb-3">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                 [style.background]="typeIconBg(promo.type)">
              <span class="material-icons" style="font-size:1.3rem"
                    [style.color]="typeIconColor(promo.type)">{{ typeIcon(promo.type) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span *ngIf="promo.type === 'DESCONTO' && promo.discount_percent"
                    class="badge badge-primary">-{{ promo.discount_percent }}%</span>
              <label class="toggle" [title]="promo.active ? 'Desativar' : 'Ativar'">
                <input type="checkbox" [checked]="promo.active"
                       (change)="toggleActive(promo)"
                       [disabled]="toggling === promo.id">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- Tipo badge -->
          <span class="text-xs font-semibold mb-1.5 w-fit px-2 py-0.5 rounded-full"
                [style.background]="typeTagBg(promo.type)"
                [style.color]="typeIconColor(promo.type)">
            {{ typeLabel(promo.type) }}
          </span>

          <!-- Título e descrição -->
          <h3 class="font-heading font-bold text-base mb-1" style="color:var(--foreground)">{{ promo.title }}</h3>
          <p *ngIf="promo.description" class="text-sm mb-3 flex-1" style="color:var(--muted-foreground)">{{ promo.description }}</p>
          <div *ngIf="!promo.description" class="flex-1"></div>

          <!-- Período -->
          <div class="space-y-1 mt-1">
            <div class="flex items-center gap-1.5 text-xs" style="color:var(--muted-foreground)">
              <span class="material-icons" style="font-size:0.9rem">calendar_month</span>
              <span>{{ promo.start_date | date:'dd/MM/yy':'UTC' }}<ng-container *ngIf="promo.end_date && promo.end_date !== promo.start_date"> – {{ promo.end_date | date:'dd/MM/yy':'UTC' }}</ng-container></span>
            </div>
            <div *ngIf="promo.start_hour" class="flex items-center gap-1.5 text-xs" style="color:var(--muted-foreground)">
              <span class="material-icons" style="font-size:0.9rem">schedule</span>
              <span>{{ promo.start_hour }}<ng-container *ngIf="promo.end_hour"> – {{ promo.end_hour }}</ng-container></span>
            </div>
          </div>

          <!-- Status bar -->
          <div class="mt-3 flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg"
               [style.background]="promo.active ? 'hsl(152,69%,40%,0.08)' : 'var(--muted)'"
               [style.color]="promo.active ? 'var(--primary)' : 'var(--muted-foreground)'">
            <span class="material-icons" style="font-size:0.85rem">{{ promo.active ? 'visibility' : 'visibility_off' }}</span>
            <span>{{ promo.active ? 'Visível no app cliente' : 'Oculta no app cliente' }}</span>
          </div>

          <!-- Ações -->
          <div class="flex items-center gap-2 mt-4 pt-3" style="border-top:1px solid var(--border)">
            <button class="btn-ghost text-xs px-2 py-1.5 flex items-center gap-1 flex-1 justify-center"
                    (click)="editPromo(promo)">
              <span class="material-icons" style="font-size:0.95rem">edit</span> Editar
            </button>
            <button class="btn-ghost text-xs px-2 py-1.5 flex items-center gap-1 flex-1 justify-center"
                    style="color:var(--destructive)"
                    [disabled]="deleting === promo.id"
                    (click)="deletePromo(promo)">
              <span class="material-icons" style="font-size:0.95rem"
                    [style.animation]="deleting === promo.id ? 'spin 1s linear infinite' : 'none'">
                {{ deleting === promo.id ? 'refresh' : 'delete' }}
              </span>
              {{ deleting === promo.id ? 'Excluindo...' : 'Excluir' }}
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="promotions.length === 0" class="col-span-full text-center py-16" style="color:var(--muted-foreground)">
          <div class="mb-3"><span class="material-icons" style="font-size:3rem;color:var(--border)">local_offer</span></div>
          <p class="font-medium">Nenhuma promoção cadastrada</p>
          <p class="text-sm mt-1">Crie descontos ou eventos para atrair mais clientes.</p>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="showModal" class="modal-overlay" (click)="closeModal($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-heading font-bold text-lg" style="color:var(--foreground)">
            {{ editingId ? 'Editar Promoção' : 'Nova Promoção' }}
          </h2>
          <button class="btn-ghost p-1" (click)="closeModal()">
            <span class="material-icons" style="font-size:1.1rem">close</span>
          </button>
        </div>

        <div class="space-y-4">

          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Título *</label>
            <input class="input" [(ngModel)]="form.title" placeholder="Ex: Happy Hour — 30% OFF">
          </div>

          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Descrição</label>
            <textarea class="textarea" [(ngModel)]="form.description"
                      placeholder="Descreva a promoção para os clientes..." rows="2"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Tipo</label>
              <select class="select" [(ngModel)]="form.type">
                <option value="DESCONTO">Desconto</option>
                <option value="EVENTO">Evento</option>
              </select>
            </div>
            <div *ngIf="form.type === 'DESCONTO'">
              <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Desconto (%)</label>
              <input class="input" type="number" [(ngModel)]="form.discount_percent" min="1" max="100" placeholder="Ex: 30">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Data Início *</label>
              <input class="input" type="date" [(ngModel)]="form.start_date">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Data Fim</label>
              <input class="input" type="date" [(ngModel)]="form.end_date">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Hora Início</label>
              <select class="select" [(ngModel)]="form.start_hour">
                <option value="">Dia todo</option>
                <option *ngFor="let h of hours" [value]="h">{{ h }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Hora Fim</label>
              <select class="select" [(ngModel)]="form.end_hour">
                <option value="">—</option>
                <option *ngFor="let h of hours" [value]="h">{{ h }}</option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="form.active">
              <span class="toggle-slider"></span>
            </label>
            <span class="text-sm font-medium" style="color:var(--foreground)">
              {{ form.active ? 'Ativa — visível no app cliente' : 'Inativa — oculta no app cliente' }}
            </span>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button class="btn-outline flex-1" (click)="closeModal()">Cancelar</button>
          <button class="btn-primary flex-1" (click)="savePromo()"
                  [disabled]="!form.title || !form.start_date || saving">
            <span *ngIf="saving" class="material-icons" style="font-size:1rem;animation:spin 1s linear infinite">refresh</span>
            {{ saving ? 'Salvando...' : (editingId ? 'Salvar alterações' : 'Criar promoção') }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class PromocoesComponent implements OnInit {
  promotions: Promotion[] = [];
  loading  = false;
  saving   = false;
  toggling: string | null = null;
  deleting: string | null = null;
  showModal = false;
  editingId: string | null = null;

  hours = Array.from({ length: 17 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);
  form  = this.emptyForm();

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const res = await firstValueFrom(this.api.get<{ promotions: Promotion[] }>('/admin/promotions'));
      this.promotions = res.promotions;
    } catch (err: any) {
      this.toast.show(err?.error?.error || 'Erro ao carregar promoções.');
    } finally {
      this.loading = false;
    }
  }

  emptyForm() {
    return {
      title: '', description: '',
      type: 'DESCONTO' as 'DESCONTO' | 'EVENTO',
      discount_percent: null as number | null,
      start_date: '', end_date: '', start_hour: '', end_hour: '',
      active: true,
    };
  }

  openModal()  { this.form = this.emptyForm(); this.editingId = null; this.showModal = true; }
  closeModal(e?: MouseEvent) {
    if (e && e.target !== e.currentTarget) return;
    this.showModal = false;
  }

  editPromo(p: Promotion) {
    this.form = {
      title:            p.title,
      description:      p.description  || '',
      type:             p.type,
      discount_percent: p.discount_percent ?? null,
      start_date:       p.start_date,
      end_date:         p.end_date      || '',
      start_hour:       p.start_hour    || '',
      end_hour:         p.end_hour      || '',
      active:           p.active,
    };
    this.editingId = p.id;
    this.showModal = true;
  }

  async savePromo(): Promise<void> {
    if (!this.form.title || !this.form.start_date) return;
    this.saving = true;
    const body = {
      ...this.form,
      description:      this.form.description      || null,
      end_date:         this.form.end_date          || null,
      start_hour:       this.form.start_hour        || null,
      end_hour:         this.form.end_hour          || null,
      discount_percent: this.form.type === 'DESCONTO' ? this.form.discount_percent : null,
    };
    try {
      if (this.editingId) {
        const res = await firstValueFrom(
          this.api.put<{ promotion: Promotion }>(`/admin/promotions/${this.editingId}`, body)
        );
        this.promotions = this.promotions.map(p => p.id === this.editingId ? res.promotion : p);
        this.toast.show('Promoção atualizada!');
      } else {
        const res = await firstValueFrom(
          this.api.post<{ promotion: Promotion }>('/admin/promotions', body)
        );
        this.promotions = [res.promotion, ...this.promotions];
        this.toast.show('Promoção criada!');
      }
      this.closeModal();
    } catch (err: any) {
      this.toast.show(err?.error?.error || 'Erro ao salvar promoção.');
    } finally {
      this.saving = false;
    }
  }

  async toggleActive(p: Promotion): Promise<void> {
    if (this.toggling) return;
    this.toggling = p.id;
    try {
      const res = await firstValueFrom(
        this.api.patch<{ promotion: Promotion }>(`/admin/promotions/${p.id}/toggle`, {})
      );
      this.promotions = this.promotions.map(x => x.id === p.id ? res.promotion : x);
    } catch (err: any) {
      this.toast.show(err?.error?.error || 'Erro ao alternar status.');
    } finally {
      this.toggling = null;
    }
  }

  async deletePromo(p: Promotion): Promise<void> {
    if (this.deleting) return;
    this.deleting = p.id;
    try {
      await firstValueFrom(this.api.delete<{ ok: boolean }>(`/admin/promotions/${p.id}`));
      this.promotions = this.promotions.filter(x => x.id !== p.id);
      this.toast.show(`Promoção "${p.title}" excluída.`);
    } catch (err: any) {
      this.toast.show(err?.error?.error || 'Erro ao excluir promoção.');
    } finally {
      this.deleting = null;
    }
  }

  typeIcon(type: string): string {
    if (type === 'DESCONTO') return 'percent';
    if (type === 'EVENTO')   return 'celebration';
    return 'local_offer';
  }

  typeLabel(type: string): string {
    if (type === 'DESCONTO') return 'Desconto';
    if (type === 'EVENTO')   return 'Evento';
    return type;
  }

  typeIconBg(type: string): string {
    if (type === 'DESCONTO') return 'hsl(152,69%,40%,0.1)';
    if (type === 'EVENTO')   return 'hsl(36,95%,55%,0.1)';
    return 'var(--muted)';
  }

  typeIconColor(type: string): string {
    if (type === 'DESCONTO') return 'var(--primary)';
    if (type === 'EVENTO')   return 'hsl(36,75%,45%)';
    return 'var(--muted-foreground)';
  }

  typeTagBg(type: string): string {
    if (type === 'DESCONTO') return 'hsl(152,69%,40%,0.08)';
    if (type === 'EVENTO')   return 'hsl(36,95%,55%,0.08)';
    return 'var(--muted)';
  }
}
