import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { Promotion } from '../../models/models';

@Component({
  selector: 'app-promocoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="font-heading font-bold text-2xl lg:text-3xl" style="color: var(--foreground)">Promoções & Eventos</h1>
          <p class="text-sm mt-1" style="color: var(--muted-foreground)">Gerencie descontos e eventos especiais</p>
        </div>
        <button class="btn-primary" (click)="openModal()">
          <span>+</span> Nova Promoção
        </button>
      </div>

      <!-- Cards grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let promo of promotions"
             class="card p-5 hover:shadow-md transition-shadow"
             [style.opacity]="promo.active ? 1 : 0.6">
          <div class="flex items-start justify-between mb-4">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center" [ngClass]="getTypeIconBg(promo.type)">
              <span class="material-icons" style="font-size:1.3rem">{{ getTypeIcon(promo.type) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span *ngIf="promo.discount_percent && promo.discount_percent > 0"
                    class="badge badge-primary">-{{ promo.discount_percent }}%</span>
              <label class="toggle" [title]="promo.active ? 'Desativar' : 'Ativar'">
                <input type="checkbox" [checked]="promo.active" (change)="toggleActive(promo)">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          <h3 class="font-heading font-bold text-base mb-1" style="color: var(--foreground)">{{ promo.title }}</h3>
          <p *ngIf="promo.description" class="text-sm mb-3" style="color: var(--muted-foreground)">{{ promo.description }}</p>
          <div class="flex items-center gap-1 text-xs" style="color: var(--muted-foreground)">
            <span class="material-icons" style="font-size:0.9rem">calendar_month</span>
            <span>{{ promo.start_date | date:'dd/MM/yy' }}<ng-container *ngIf="promo.end_date && promo.end_date !== promo.start_date"> - {{ promo.end_date | date:'dd/MM/yy' }}</ng-container></span>
          </div>
          <div *ngIf="promo.start_hour" class="flex items-center gap-1 text-xs mt-1" style="color: var(--muted-foreground)">
            <span class="material-icons" style="font-size:0.9rem">schedule</span>
            <span>{{ promo.start_hour }}<ng-container *ngIf="promo.end_hour"> - {{ promo.end_hour }}</ng-container></span>
          </div>
          <div class="flex gap-2 mt-4 pt-3" style="border-top: 1px solid var(--border)">
            <button class="btn-ghost text-xs px-2 py-1 flex items-center gap-1" (click)="editPromo(promo)"><span class="material-icons" style="font-size:0.95rem">edit</span> Editar</button>
            <button class="btn-ghost text-xs px-2 py-1 flex items-center gap-1" style="color: var(--destructive)" (click)="deletePromo(promo.id)"><span class="material-icons" style="font-size:0.95rem">delete</span> Excluir</button>
          </div>
        </div>

        <div *ngIf="promotions.length === 0" class="col-span-full text-center py-16" style="color: var(--muted-foreground)">
          <div class="mb-3" style="color:var(--border)"><span class="material-icons" style="font-size:3rem">local_offer</span></div>
          <p class="font-medium">Nenhuma promoção cadastrada</p>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="showModal" class="modal-overlay" (click)="closeModal($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-heading font-bold text-lg" style="color: var(--foreground)">
            {{ editingId ? 'Editar Promoção' : 'Nova Promoção' }}
          </h2>
          <button class="btn-ghost p-1" (click)="closeModal()"><span class="material-icons" style="font-size:1.1rem">close</span></button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Título *</label>
            <input class="input" [(ngModel)]="form.title" placeholder="Informe o título">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Descrição</label>
            <textarea class="textarea" [(ngModel)]="form.description" placeholder="Descreva a promoção..." rows="2"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Tipo</label>
            <select class="select" [(ngModel)]="form.type">
              <option value="desconto">Desconto</option>
              <option value="evento">Evento</option>
              <option value="campeonato">Campeonato</option>
            </select>
          </div>
          <div *ngIf="form.type === 'desconto'">
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Desconto (%)</label>
            <input class="input" type="number" [(ngModel)]="form.discount_percent" min="0" max="100">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Data Início</label>
              <input class="input" type="date" [(ngModel)]="form.start_date">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Data Fim</label>
              <input class="input" type="date" [(ngModel)]="form.end_date">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Hora Início</label>
              <select class="select" [(ngModel)]="form.start_hour">
                <option value="">Sem hora</option>
                <option *ngFor="let h of hours" [value]="h">{{ h }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Hora Fim</label>
              <select class="select" [(ngModel)]="form.end_hour">
                <option value="">Sem hora</option>
                <option *ngFor="let h of hours" [value]="h">{{ h }}</option>
              </select>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="form.active">
              <span class="toggle-slider"></span>
            </label>
            <span class="text-sm font-medium" style="color: var(--foreground)">{{ form.active ? 'Ativa' : 'Inativa' }}</span>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button class="btn-outline flex-1" (click)="closeModal()">Cancelar</button>
          <button class="btn-primary flex-1" (click)="savePromo()" [disabled]="!form.title">
            {{ editingId ? 'Salvar' : 'Criar Promoção' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class PromocoesComponent implements OnInit {
  promotions: Promotion[] = [];
  showModal = false;
  editingId: string | null = null;
  hours = Array.from({ length: 17 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);
  form = this.emptyForm();

  constructor(private data: DataService, private toast: ToastService) {}
  ngOnInit() { this.data.promotions$.subscribe(p => this.promotions = p); }

  emptyForm() {
    return { title: '', description: '', type: 'desconto' as any, discount_percent: 0, start_date: '', end_date: '', start_hour: '', end_hour: '', active: true };
  }

  getTypeIcon(t: string) { return t === 'desconto' ? 'percent' : t === 'evento' ? 'celebration' : 'emoji_events'; }
  getTypeIconBg(t: string) {
    return t === 'desconto' ? 'bg-primary/10 text-primary' : t === 'evento' ? 'bg-accent/10' : 'badge-blue';
  }

  openModal() { this.form = this.emptyForm(); this.editingId = null; this.showModal = true; }
  editPromo(p: Promotion) {
    this.form = { title: p.title, description: p.description || '', type: p.type, discount_percent: p.discount_percent || 0, start_date: p.start_date || '', end_date: p.end_date || '', start_hour: p.start_hour || '', end_hour: p.end_hour || '', active: p.active };
    this.editingId = p.id; this.showModal = true;
  }
  savePromo() {
    if (!this.form.title) return;
    if (this.editingId) { this.data.updatePromotion(this.editingId, this.form); this.toast.show('Promoção atualizada!'); }
    else { this.data.addPromotion(this.form); this.toast.show('Promoção criada!'); }
    this.closeModal();
  }
  deletePromo(id: string) { this.data.deletePromotion(id); this.toast.show('Promoção excluída!'); }
  toggleActive(p: Promotion) { this.data.updatePromotion(p.id, { active: !p.active }); }
  closeModal(e?: MouseEvent) {
    if (e && e.target !== e.currentTarget) return;
    this.showModal = false;
  }
}
