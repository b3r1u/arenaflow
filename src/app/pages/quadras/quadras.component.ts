import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { Court } from '../../models/models';

@Component({
  selector: 'app-quadras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="font-heading font-bold text-2xl lg:text-3xl" style="color: var(--foreground)">Quadras</h1>
          <p class="text-sm mt-1" style="color: var(--muted-foreground)">Gerencie suas quadras esportivas</p>
        </div>
        <button class="btn-primary" (click)="openModal()">
          <span>+</span> Nova Quadra
        </button>
      </div>

      <!-- Courts grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let court of courts"
             class="card p-6 hover:shadow-md transition-shadow cursor-pointer"
             (click)="editCourt(court)">
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background-color: hsl(152,69%,40%,0.1);color:hsl(152,69%,40%)"><span class="material-icons" style="font-size:1.5rem">sports_volleyball</span></div>
            <div class="flex items-center gap-2">
              <span class="badge" [ngClass]="getStatusClass(court.status)">{{ court.status }}</span>
            </div>
          </div>
          <h3 class="font-heading font-bold text-lg mb-1" style="color: var(--foreground)">{{ court.name }}</h3>
          <p class="text-sm mb-2" style="color: var(--muted-foreground)">{{ court.sport_type | titlecase }}</p>
          <div class="flex items-center justify-between mt-3 pt-3" style="border-top: 1px solid var(--border)">
            <span class="font-heading font-bold" style="color: var(--primary)">R\${{ court.hourly_rate }}/h</span>
            <button class="btn-ghost p-1.5" (click)="editCourt(court); $event.stopPropagation()"><span class="material-icons" style="font-size:1.1rem">edit</span></button>
          </div>
          <p *ngIf="court.description" class="text-xs mt-2" style="color: var(--muted-foreground)">{{ court.description }}</p>
        </div>

        <!-- Empty state -->
        <div *ngIf="courts.length === 0" class="col-span-full text-center py-16" style="color: var(--muted-foreground)">
          <div class="mb-3" style="color:var(--border)"><span class="material-icons" style="font-size:3rem">sports_volleyball</span></div>
          <p class="font-medium">Nenhuma quadra cadastrada</p>
          <p class="text-sm mt-1">Clique em "Nova Quadra" para começar</p>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="showModal" class="modal-overlay" (click)="closeModal($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-heading font-bold text-lg" style="color: var(--foreground)">
            {{ editingId ? 'Editar Quadra' : 'Nova Quadra' }}
          </h2>
          <button class="btn-ghost p-1" (click)="closeModal()"><span class="material-icons" style="font-size:1.1rem">close</span></button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Nome *</label>
            <input class="input" [(ngModel)]="form.name" placeholder="Ex: Quadra 1">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Esporte</label>
            <select class="select" [(ngModel)]="form.sport_type">
              <option value="ambos">Ambos</option>
              <option value="futevôlei">Futevôlei</option>
              <option value="vôlei">Vôlei</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Status</label>
            <select class="select" [(ngModel)]="form.status">
              <option value="disponível">Disponível</option>
              <option value="ocupada">Ocupada</option>
              <option value="bloqueada">Bloqueada</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Valor/hora (R$)</label>
            <input class="input" type="number" [(ngModel)]="form.hourly_rate" min="0">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Descrição</label>
            <input class="input" [(ngModel)]="form.description" placeholder="Ex: Quadra de areia principal">
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button class="btn-outline flex-1" (click)="closeModal()">Cancelar</button>
          <button *ngIf="editingId" class="btn-outline flex-1" style="border-color: var(--destructive); color: var(--destructive)" (click)="deleteCourt()">Excluir</button>
          <button class="btn-primary flex-1" (click)="saveCourt()" [disabled]="!form.name">
            {{ editingId ? 'Salvar' : 'Criar Quadra' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class QuadrasComponent implements OnInit {
  courts: Court[] = [];
  showModal = false;
  editingId: string | null = null;
  form = this.emptyForm();

  constructor(private data: DataService, private toast: ToastService) {}

  ngOnInit() { this.data.courts$.subscribe(c => this.courts = c); }

  emptyForm() {
    return { name: '', sport_type: 'ambos' as any, status: 'disponível' as any, hourly_rate: 80, description: '' };
  }

  getStatusClass(s: string) {
    return s === 'disponível' ? 'badge-primary' : s === 'bloqueada' ? 'badge-destructive' : 'badge-accent';
  }

  openModal() { this.form = this.emptyForm(); this.editingId = null; this.showModal = true; }

  editCourt(c: Court) {
    this.form = { name: c.name, sport_type: c.sport_type, status: c.status, hourly_rate: c.hourly_rate, description: c.description || '' };
    this.editingId = c.id;
    this.showModal = true;
  }

  saveCourt() {
    if (!this.form.name) return;
    if (this.editingId) { this.data.updateCourt(this.editingId, this.form); this.toast.show('Quadra atualizada!'); }
    else { this.data.addCourt(this.form); this.toast.show('Quadra criada!'); }
    this.closeModal();
  }

  deleteCourt() {
    if (this.editingId) { this.data.deleteCourt(this.editingId); this.toast.show('Quadra excluída!'); this.closeModal(); }
  }

  closeModal(e?: MouseEvent) {
    if (e && e.target !== e.currentTarget) return;
    this.showModal = false;
  }
}
