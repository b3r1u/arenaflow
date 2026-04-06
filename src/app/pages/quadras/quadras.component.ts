import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { EstablishmentService } from '../../services/establishment.service';
import { CourtService, CourtFormData } from '../../services/court.service';
import { Court } from '../../models/models';

@Component({
  selector: 'app-quadras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>

      <!-- ═══════════════════════════════════════════════════════════
           Estado: inicializando (aguarda POST /auth/me)
      ════════════════════════════════════════════════════════════ -->
      <div *ngIf="!establishment.initialized()" class="flex flex-col items-center justify-center py-24">
        <span class="material-icons mb-3" style="font-size:3rem;color:var(--border);animation:spin 1s linear infinite">refresh</span>
        <p class="text-sm" style="color:var(--muted-foreground)">Carregando...</p>
      </div>

      <!-- ═══════════════════════════════════════════════════════════
           Estado: sem estabelecimento → onboarding
      ════════════════════════════════════════════════════════════ -->
      <div *ngIf="establishment.initialized() && !establishment.hasEstablishment()">

        <!-- Header onboarding -->
        <div class="mb-6">
          <h1 class="font-heading font-bold text-2xl lg:text-3xl" style="color:var(--foreground)">Quadras</h1>
          <p class="text-sm mt-1" style="color:var(--muted-foreground)">Gerencie suas quadras esportivas</p>
        </div>

        <!-- Card de setup -->
        <div class="card p-8 max-w-xl mx-auto text-center">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style="background:hsl(152,69%,40%,0.12)">
            <span class="material-icons" style="font-size:2rem;color:hsl(152,69%,40%)">sports_volleyball</span>
          </div>
          <h2 class="font-heading font-bold text-xl mb-2" style="color:var(--foreground)">Configure seu estabelecimento</h2>
          <p class="text-sm mb-6" style="color:var(--muted-foreground)">
            Antes de cadastrar quadras, precisamos das informações do seu espaço esportivo.<br>
            Depois disso, sua arena já aparece no app de reservas!
          </p>

          <div class="text-left space-y-4">
            <!-- Nome -->
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Nome do estabelecimento *</label>
              <input class="input" [(ngModel)]="setupForm.name" placeholder="Ex: Arena Beach Park">
            </div>
            <!-- Cidade -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Cidade</label>
                <input class="input" [(ngModel)]="setupForm.city" placeholder="Ex: São Paulo">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Bairro</label>
                <input class="input" [(ngModel)]="setupForm.neighborhood" placeholder="Ex: Pinheiros">
              </div>
            </div>
            <!-- Horário -->
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Horário de funcionamento</label>
              <input class="input" [(ngModel)]="setupForm.open_hours" placeholder="Ex: 07:00 - 23:00">
            </div>
            <!-- Esportes -->
            <div>
              <label class="block text-sm font-medium mb-2" style="color:var(--foreground)">Esportes oferecidos</label>
              <div class="flex flex-wrap gap-2">
                <button *ngFor="let s of sportOptions"
                        type="button"
                        class="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                        [style.background]="setupForm.sports.includes(s.value) ? 'hsl(152,69%,40%,0.1)' : 'var(--card)'"
                        [style.color]="setupForm.sports.includes(s.value) ? 'hsl(152,69%,40%)' : 'var(--muted-foreground)'"
                        [style.border-color]="setupForm.sports.includes(s.value) ? 'hsl(152,69%,40%)' : 'var(--border)'"
                        (click)="toggleSport(s.value)">
                  {{ s.label }}
                </button>
              </div>
            </div>
          </div>

          <button class="btn-primary w-full mt-6"
                  [disabled]="!setupForm.name || savingSetup"
                  (click)="createEstablishment()">
            <span *ngIf="savingSetup" class="material-icons" style="font-size:1rem;animation:spin 1s linear infinite">refresh</span>
            <span *ngIf="!savingSetup">Criar estabelecimento e continuar</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════
           Estado: com estabelecimento → gerenciamento de quadras
      ════════════════════════════════════════════════════════════ -->
      <div *ngIf="establishment.initialized() && establishment.hasEstablishment()">

        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="font-heading font-bold text-2xl lg:text-3xl" style="color:var(--foreground)">Quadras</h1>
            <p class="text-sm mt-1" style="color:var(--muted-foreground)">
              {{ establishment.establishment()?.name }} ·
              {{ courts.courts().length }} quadra{{ courts.courts().length !== 1 ? 's' : '' }}
            </p>
          </div>
          <button class="btn-primary" (click)="openModal()">
            <span>+</span> Nova Quadra
          </button>
        </div>

        <!-- Loading quadras -->
        <div *ngIf="courts.loading()" class="text-center py-16">
          <span class="material-icons mb-3 block" style="font-size:3rem;color:var(--border);animation:spin 1s linear infinite">refresh</span>
          <p class="text-sm" style="color:var(--muted-foreground)">Carregando quadras...</p>
        </div>

        <!-- Erro ao carregar -->
        <div *ngIf="courts.error() && !courts.loading()" class="text-center py-16">
          <span class="material-icons mb-3 block" style="font-size:3rem;color:var(--border)">wifi_off</span>
          <p class="font-heading font-bold mb-1" style="color:var(--foreground)">Erro ao carregar quadras</p>
          <p class="text-sm mb-3" style="color:var(--muted-foreground)">{{ courts.error() }}</p>
          <button class="btn-primary" (click)="courts.load()">Tentar novamente</button>
        </div>

        <!-- Grid de quadras -->
        <div *ngIf="!courts.loading() && !courts.error()"
             class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <div *ngFor="let court of courts.courts()"
               class="card p-6 hover:shadow-md transition-shadow cursor-pointer"
               (click)="editCourt(court)">
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                   style="background-color:hsl(152,69%,40%,0.1);color:hsl(152,69%,40%)">
                <span class="material-icons" style="font-size:1.5rem">sports_volleyball</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="badge" [ngClass]="getStatusClass(court.status)">{{ court.status }}</span>
              </div>
            </div>
            <h3 class="font-heading font-bold text-lg mb-1" style="color:var(--foreground)">{{ court.name }}</h3>
            <p class="text-sm mb-2" style="color:var(--muted-foreground)">{{ court.sport_type | titlecase }}</p>
            <div class="flex items-center justify-between mt-3 pt-3" style="border-top:1px solid var(--border)">
              <span class="font-heading font-bold" style="color:var(--primary)">R\${{ court.hourly_rate }}/h</span>
              <button class="btn-ghost p-1.5" (click)="editCourt(court); $event.stopPropagation()">
                <span class="material-icons" style="font-size:1.1rem">edit</span>
              </button>
            </div>
            <p *ngIf="court.description" class="text-xs mt-2" style="color:var(--muted-foreground)">{{ court.description }}</p>
          </div>

          <!-- Empty state -->
          <div *ngIf="courts.courts().length === 0" class="col-span-full text-center py-16" style="color:var(--muted-foreground)">
            <div class="mb-3" style="color:var(--border)">
              <span class="material-icons" style="font-size:3rem">sports_volleyball</span>
            </div>
            <p class="font-medium">Nenhuma quadra cadastrada</p>
            <p class="text-sm mt-1">Clique em "Nova Quadra" para começar</p>
          </div>
        </div>

      </div><!-- fim com-estabelecimento -->
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         Modal: criar / editar quadra
    ════════════════════════════════════════════════════════════ -->
    <div *ngIf="showModal" class="modal-overlay" (click)="closeModal($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-heading font-bold text-lg" style="color:var(--foreground)">
            {{ editingId ? 'Editar Quadra' : 'Nova Quadra' }}
          </h2>
          <button class="btn-ghost p-1" (click)="closeModal()">
            <span class="material-icons" style="font-size:1.1rem">close</span>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Nome *</label>
            <input class="input" [(ngModel)]="form.name" placeholder="Ex: Quadra 1">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Esporte</label>
            <select class="select" [(ngModel)]="form.sport_type">
              <option value="ambos">Ambos</option>
              <option value="futevôlei">Futevôlei</option>
              <option value="vôlei">Vôlei</option>
              <option value="beach tennis">Beach Tennis</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Status</label>
            <select class="select" [(ngModel)]="form.status">
              <option value="disponível">Disponível</option>
              <option value="bloqueada">Bloqueada</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Valor/hora (R$)</label>
            <input class="input" type="number" [(ngModel)]="form.hourly_rate" min="1">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Descrição</label>
            <input class="input" [(ngModel)]="form.description" placeholder="Ex: Quadra de areia principal">
          </div>
        </div>

        <!-- Erro do modal -->
        <div *ngIf="modalError" class="mt-4 px-3 py-2 rounded-lg text-sm" style="background:hsl(0,72%,51%,0.1);color:hsl(0,72%,51%)">
          {{ modalError }}
        </div>

        <div class="flex gap-3 mt-6">
          <button class="btn-outline flex-1" (click)="closeModal()" [disabled]="courts.saving()">Cancelar</button>
          <button *ngIf="editingId"
                  class="btn-outline flex-1"
                  style="border-color:var(--destructive);color:var(--destructive)"
                  [disabled]="courts.saving()"
                  (click)="deleteCourt()">
            <span *ngIf="courts.saving()" class="material-icons" style="font-size:0.9rem;animation:spin 1s linear infinite">refresh</span>
            <span *ngIf="!courts.saving()">Excluir</span>
          </button>
          <button class="btn-primary flex-1"
                  [disabled]="!form.name || courts.saving()"
                  (click)="saveCourt()">
            <span *ngIf="courts.saving()" class="material-icons" style="font-size:0.9rem;animation:spin 1s linear infinite">refresh</span>
            <span *ngIf="!courts.saving()">{{ editingId ? 'Salvar' : 'Criar Quadra' }}</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class QuadrasComponent implements OnInit {
  showModal   = false;
  editingId: string | null = null;
  modalError: string | null = null;
  savingSetup = false;

  form = this.emptyForm();

  setupForm = {
    name:         '',
    city:         '',
    neighborhood: '',
    open_hours:   '',
    sports:       [] as string[],
  };

  sportOptions = [
    { value: 'futevôlei',    label: 'Futevôlei'    },
    { value: 'vôlei',        label: 'Vôlei'        },
    { value: 'beach tennis', label: 'Beach Tennis' },
  ];

  private courtsLoaded = false;

  constructor(
    public establishment: EstablishmentService,
    public courts: CourtService,
    private toast: ToastService,
  ) {
    // Quando o serviço de estabelecimento terminar de inicializar e existir um
    // estabelecimento, carrega as quadras automaticamente (uma única vez).
    effect(() => {
      const ready    = this.establishment.initialized();
      const hasEst   = this.establishment.hasEstablishment();
      if (ready && hasEst && !this.courtsLoaded) {
        this.courtsLoaded = true;
        this.courts.load();
      }
    });
  }

  ngOnInit() {}

  // ─── Onboarding ────────────────────────────────────────────────────────────

  toggleSport(value: string) {
    const idx = this.setupForm.sports.indexOf(value);
    if (idx >= 0) {
      this.setupForm.sports.splice(idx, 1);
    } else {
      this.setupForm.sports.push(value);
    }
  }

  async createEstablishment() {
    if (!this.setupForm.name) return;
    this.savingSetup = true;
    try {
      await this.establishment.create({
        name:         this.setupForm.name,
        city:         this.setupForm.city  || undefined,
        neighborhood: this.setupForm.neighborhood || undefined,
        open_hours:   this.setupForm.open_hours   || undefined,
        sports:       this.setupForm.sports.length ? this.setupForm.sports : undefined,
      });
      this.toast.show('Estabelecimento criado com sucesso!');
      // O effect vai detectar hasEstablishment() = true e chamar courts.load()
    } catch (e: any) {
      const msg = e?.error?.error || 'Erro ao criar estabelecimento';
      this.toast.show(msg);
    } finally {
      this.savingSetup = false;
    }
  }

  // ─── Quadras ───────────────────────────────────────────────────────────────

  emptyForm(): CourtFormData {
    return { name: '', sport_type: 'ambos', status: 'disponível', hourly_rate: 80, description: '' };
  }

  getStatusClass(s: string) {
    return s === 'disponível' ? 'badge-primary' : 'badge-destructive';
  }

  openModal() {
    this.form       = this.emptyForm();
    this.editingId  = null;
    this.modalError = null;
    this.showModal  = true;
  }

  editCourt(c: Court) {
    this.form = {
      name:        c.name,
      sport_type:  c.sport_type,
      status:      c.status === 'ocupada' ? 'bloqueada' : c.status,
      hourly_rate: c.hourly_rate,
      description: c.description || '',
    };
    this.editingId  = c.id;
    this.modalError = null;
    this.showModal  = true;
  }

  async saveCourt() {
    if (!this.form.name) return;
    this.modalError = null;
    try {
      if (this.editingId) {
        await this.courts.update(this.editingId, this.form);
        this.toast.show('Quadra atualizada!');
      } else {
        await this.courts.create(this.form);
        this.toast.show('Quadra criada!');
      }
      this.closeModal();
    } catch (e: any) {
      this.modalError = e?.error?.error || 'Erro ao salvar quadra';
    }
  }

  async deleteCourt() {
    if (!this.editingId) return;
    this.modalError = null;
    try {
      await this.courts.remove(this.editingId);
      this.toast.show('Quadra excluída!');
      this.closeModal();
    } catch (e: any) {
      this.modalError = e?.error?.error || 'Erro ao excluir quadra';
    }
  }

  closeModal(e?: MouseEvent) {
    if (e && e.target !== e.currentTarget) return;
    if (this.courts.saving()) return;
    this.showModal = false;
  }
}
