import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

interface PlatformPlan {
  id:              string;
  slug:            string;
  name:            string;
  description:     string | null;
  price:           number;
  max_courts:      number | null;
  features:        string[];
  pagarme_plan_id: string | null;
  active:          boolean;
  _count?:         { subscriptions: number };
}

const FEATURE_OPTIONS = [
  { key: 'app_cliente',        label: 'App Cliente',        icon: 'smartphone'         },
  { key: 'mensalistas',        label: 'Mensalistas',        icon: 'card_membership'    },
  { key: 'promotions',         label: 'Promoções',          icon: 'local_offer'        },
  { key: 'advanced_reports',   label: 'Rel. Avançados',     icon: 'bar_chart'          },
  { key: 'split_payment',      label: 'Divisão Pagamento',  icon: 'group'              },
  { key: 'dashboard_advanced', label: 'Dashboard Avançado', icon: 'dashboard'          },
  { key: 'multi_user',         label: 'Multi-usuário',      icon: 'manage_accounts'    },
];

@Component({
  selector: 'app-platform-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="material-icons text-xs px-2 py-0.5 rounded-full font-medium"
                  style="font-size:0.7rem;background:hsl(36,95%,55%,0.15);color:hsl(36,75%,40%)">
              PLATFORM ADMIN
            </span>
          </div>
          <h1 class="font-heading font-bold text-2xl lg:text-3xl" style="color:var(--foreground)">Gestão de Planos</h1>
          <p class="text-sm mt-1" style="color:var(--muted-foreground)">Crie e gerencie os planos do ArenaFlow SaaS</p>
        </div>
        <button class="btn-primary flex items-center gap-2" (click)="openCreate()">
          <span class="material-icons" style="font-size:1rem">add</span>
          Novo Plano
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-16" style="color:var(--muted-foreground)">
        <span class="material-icons" style="font-size:2.5rem;animation:spin 1s linear infinite">refresh</span>
        <p class="mt-3 text-sm">Carregando planos...</p>
      </div>

      <!-- Grid de planos -->
      <div *ngIf="!loading" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <div *ngFor="let plan of plans"
             class="card p-5 flex flex-col gap-3"
             [style.opacity]="plan.active ? '1' : '0.55'">

          <!-- Topo: slug badge + assinantes -->
          <div class="flex items-start justify-between">
            <span class="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                  [style.background]="slugBg(plan.slug)" [style.color]="slugColor(plan.slug)">
              {{ plan.slug }}
            </span>
            <span class="text-xs" style="color:var(--muted-foreground)">
              {{ plan._count?.subscriptions || 0 }} assinantes
            </span>
          </div>

          <!-- Nome e descrição -->
          <div>
            <div class="font-heading font-bold text-lg" style="color:var(--foreground)">{{ plan.name }}</div>
            <div class="text-xs mt-0.5" style="color:var(--muted-foreground)">{{ plan.description || '—' }}</div>
          </div>

          <!-- Preço -->
          <div class="font-heading font-bold text-2xl" style="color:var(--primary)">
            <span *ngIf="plan.price === 0">Grátis</span>
            <span *ngIf="plan.price > 0">R$ {{ plan.price | number:'1.2-2' }}<span class="text-sm font-normal" style="color:var(--muted-foreground)">/mês</span></span>
          </div>

          <!-- Limites -->
          <div class="text-sm space-y-1" style="color:var(--muted-foreground)">
            <div class="flex items-center gap-1.5">
              <span class="material-icons" style="font-size:0.9rem">sports_volleyball</span>
              {{ plan.max_courts ? plan.max_courts + ' quadra(s)' : 'Ilimitadas' }}
            </div>
          </div>

          <!-- Features -->
          <div class="flex flex-wrap gap-1 flex-1">
            <span *ngFor="let f of plan.features"
                  class="px-1.5 py-0.5 rounded"
                  style="font-size:0.65rem;line-height:1.3;background:hsl(152,69%,40%,0.08);color:var(--primary)">
              {{ featureLabel(f) }}
            </span>
            <span *ngIf="plan.features.length === 0" style="font-size:0.7rem;color:var(--muted-foreground)">Sem features</span>
          </div>

          <!-- Pagar.me status -->
          <div class="flex items-center gap-1.5 text-xs p-2 rounded-lg"
               [style.background]="plan.pagarme_plan_id ? 'hsl(152,69%,40%,0.07)' : 'hsl(0,0%,50%,0.07)'">
            <span class="material-icons" [style.color]="plan.pagarme_plan_id ? 'var(--primary)' : 'var(--muted-foreground)'"
                  style="font-size:0.9rem">{{ plan.pagarme_plan_id ? 'check_circle' : 'radio_button_unchecked' }}</span>
            <span [style.color]="plan.pagarme_plan_id ? 'var(--primary)' : 'var(--muted-foreground)'">
              {{ plan.pagarme_plan_id ? plan.pagarme_plan_id : 'Não sincronizado' }}
            </span>
          </div>

          <!-- Ações -->
          <div class="flex gap-2 mt-auto pt-2" style="border-top:1px solid var(--border)">
            <button class="btn-outline flex-1 text-xs py-1.5 flex items-center justify-center gap-1"
                    (click)="openEdit(plan)">
              <span class="material-icons" style="font-size:0.9rem">edit</span>
              Editar
            </button>
            <button *ngIf="plan.price > 0"
                    class="flex-1 text-xs py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 transition-all"
                    [style.background]="plan.pagarme_plan_id ? 'hsl(36,95%,55%,0.1)' : 'hsl(152,69%,40%,0.1)'"
                    [style.color]="plan.pagarme_plan_id ? 'hsl(36,75%,40%)' : 'var(--primary)'"
                    [disabled]="syncing === plan.id"
                    (click)="syncPagarme(plan)">
              <span class="material-icons"
                    [style.animation]="syncing === plan.id ? 'spin 1s linear infinite' : 'none'"
                    style="font-size:0.9rem">{{ plan.pagarme_plan_id ? 'sync' : 'cloud_upload' }}</span>
              {{ syncing === plan.id ? 'Sincronizando...' : (plan.pagarme_plan_id ? 'Re-sincronizar' : 'Criar no Pagar.me') }}
            </button>
          </div>
        </div>

        <!-- Empty -->
        <div *ngIf="plans.length === 0" class="col-span-full text-center py-16" style="color:var(--muted-foreground)">
          <span class="material-icons" style="font-size:3rem;color:var(--border)">workspace_premium</span>
          <p class="mt-3 font-medium">Nenhum plano cadastrado</p>
          <p class="text-sm mt-1">Crie o primeiro plano clicando em "Novo Plano".</p>
        </div>
      </div>

      <!-- Modal criar / editar -->
      <div *ngIf="showModal" class="modal-overlay" (click)="closeModal($event)">
        <div class="modal-content" style="max-width:520px" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-5">
            <h2 class="font-heading font-bold text-lg" style="color:var(--foreground)">
              {{ editingId ? 'Editar Plano' : 'Novo Plano' }}
            </h2>
            <button class="btn-ghost p-1" (click)="closeModal()">
              <span class="material-icons" style="font-size:1.1rem">close</span>
            </button>
          </div>

          <div class="space-y-4">
            <!-- Slug + Nome -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Slug <span style="color:var(--destructive)">*</span></label>
                <input class="input" [(ngModel)]="form.slug" placeholder="ex: essencial"
                       [disabled]="!!editingId" />
                <p class="text-xs mt-1" style="color:var(--muted-foreground)">Identificador único, não pode mudar após criação</p>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Nome <span style="color:var(--destructive)">*</span></label>
                <input class="input" [(ngModel)]="form.name" placeholder="ex: Plano Essencial" />
              </div>
            </div>

            <!-- Descrição -->
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Descrição</label>
              <input class="input" [(ngModel)]="form.description" placeholder="Descrição curta do plano" />
            </div>

            <!-- Preço + Quadras -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Preço mensal <span style="color:var(--destructive)">*</span></label>
                <input class="input" type="text" inputmode="numeric"
                       [value]="priceDisplay"
                       (input)="onPriceInput($event)"
                       placeholder="R$ 0,00" />
                <p class="text-xs mt-1" style="color:var(--muted-foreground)">R$ 0,00 = plano gratuito</p>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Máx. de quadras</label>
                <input class="input" type="number" min="1" [(ngModel)]="form.max_courts" placeholder="vazio = ilimitado" />
                <p class="text-xs mt-1" style="color:var(--muted-foreground)">Deixe vazio para ilimitado</p>
              </div>
            </div>

            <!-- Features -->
            <div>
              <label class="block text-sm font-medium mb-2" style="color:var(--foreground)">Funcionalidades incluídas</label>
              <div class="grid grid-cols-2 gap-2">
                <button *ngFor="let opt of featureOptions"
                        type="button"
                        (click)="toggleFeature(opt.key)"
                        class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150"
                        [style.border]="form.features.includes(opt.key) ? '1.5px solid var(--primary)' : '1.5px solid var(--border)'"
                        [style.background]="form.features.includes(opt.key) ? 'hsl(152,69%,40%,0.07)' : 'transparent'">
                  <span class="material-icons flex-shrink-0 transition-colors"
                        style="font-size:1rem"
                        [style.color]="form.features.includes(opt.key) ? 'var(--primary)' : 'var(--muted-foreground)'">
                    {{ opt.icon }}
                  </span>
                  <span class="text-xs font-medium transition-colors"
                        [style.color]="form.features.includes(opt.key) ? 'var(--foreground)' : 'var(--muted-foreground)'">
                    {{ opt.label }}
                  </span>
                  <span *ngIf="form.features.includes(opt.key)"
                        class="ml-auto material-icons flex-shrink-0"
                        style="font-size:0.85rem;color:var(--primary)">check</span>
                </button>
              </div>
            </div>

            <!-- Ativo -->
            <div class="flex items-center gap-3">
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="form.active">
                <span class="toggle-slider"></span>
              </label>
              <span class="text-sm font-medium" style="color:var(--foreground)">
                {{ form.active ? 'Plano ativo — visível para novos usuários' : 'Plano inativo' }}
              </span>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button class="btn-outline flex-1" (click)="closeModal()">Cancelar</button>
            <button class="btn-primary flex-1" (click)="save()"
                    [disabled]="!form.slug || !form.name || form.price === null || saving">
              <span *ngIf="saving" class="material-icons" style="font-size:1rem;animation:spin 1s linear infinite">refresh</span>
              {{ saving ? 'Salvando...' : (editingId ? 'Salvar alterações' : 'Criar plano') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PlatformPlansComponent implements OnInit {
  plans:     PlatformPlan[] = [];
  loading  = false;
  saving   = false;
  syncing: string | null = null;
  showModal = false;
  editingId: string | null = null;

  featureOptions = FEATURE_OPTIONS;

  priceDisplay = 'R$ 0,00';
  form = this.emptyForm();

  constructor(
    private api:   ApiService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const res = await firstValueFrom(this.api.get<{ plans: PlatformPlan[] }>('/platform/plans'));
      this.plans = res.plans;
    } catch (err: any) {
      this.toast.show(err?.error?.error || 'Erro ao carregar planos.');
    } finally {
      this.loading = false;
    }
  }

  openCreate(): void {
    this.form         = this.emptyForm();
    this.priceDisplay = this.formatBRL(0);
    this.editingId    = null;
    this.showModal    = true;
  }

  openEdit(plan: PlatformPlan): void {
    this.form = {
      slug:        plan.slug,
      name:        plan.name,
      description: plan.description || '',
      price:       plan.price,
      max_courts:  plan.max_courts ?? null,
      features:    [...plan.features],
      active:      plan.active,
    };
    this.priceDisplay = this.formatBRL(plan.price);
    this.editingId    = plan.id;
    this.showModal    = true;
  }

  closeModal(e?: MouseEvent): void {
    if (e && e.target !== e.currentTarget) return;
    this.showModal = false;
  }

  toggleFeature(key: string): void {
    const idx = this.form.features.indexOf(key);
    if (idx >= 0) this.form.features.splice(idx, 1);
    else           this.form.features.push(key);
  }

  async save(): Promise<void> {
    if (!this.form.slug || !this.form.name) return;
    this.saving = true;
    const body = {
      ...this.form,
      price:       this.form.price ?? 0,
      max_courts:  this.form.max_courts || null,
      description: this.form.description || null,
    };
    try {
      if (this.editingId) {
        const res = await firstValueFrom(
          this.api.put<{ plan: PlatformPlan }>(`/platform/plans/${this.editingId}`, body)
        );
        this.plans = this.plans.map(p => p.id === this.editingId ? { ...res.plan, _count: p._count } : p);
        this.toast.show('Plano atualizado!');
      } else {
        const res = await firstValueFrom(
          this.api.post<{ plan: PlatformPlan }>('/platform/plans', body)
        );
        this.plans = [...this.plans, { ...res.plan, _count: { subscriptions: 0 } }];
        this.toast.show('Plano criado!');
      }
      this.closeModal();
    } catch (err: any) {
      this.toast.show(err?.error?.error || 'Erro ao salvar plano.');
    } finally {
      this.saving = false;
    }
  }

  async syncPagarme(plan: PlatformPlan): Promise<void> {
    if (this.syncing) return;
    this.syncing = plan.id;
    try {
      const res = await firstValueFrom(
        this.api.post<{ plan: PlatformPlan; pagarme_plan_id: string; message: string }>(
          `/platform/plans/${plan.id}/sync`, {}
        )
      );
      this.plans = this.plans.map(p => p.id === plan.id ? { ...res.plan, _count: p._count } : p);
      this.toast.show(res.message || 'Plano sincronizado com Pagar.me!');
    } catch (err: any) {
      this.toast.show(err?.error?.error || 'Erro ao sincronizar com Pagar.me.');
    } finally {
      this.syncing = null;
    }
  }

  formatBRL(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  onPriceInput(event: Event): void {
    const input  = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    const cents  = parseInt(digits || '0', 10);
    const value  = cents / 100;
    this.priceDisplay = this.formatBRL(value);
    this.form.price   = value;
    input.value       = this.priceDisplay;
  }

  featureLabel(key: string): string {
    return FEATURE_OPTIONS.find(o => o.key === key)?.label ?? key;
  }

  slugBg(slug: string): string {
    const map: Record<string, string> = {
      free:      'hsl(0,0%,50%,0.1)',
      essencial: 'hsl(152,69%,40%,0.1)',
      pro:       'hsl(221,83%,53%,0.1)',
      business:  'hsl(36,95%,55%,0.1)',
    };
    return map[slug] ?? 'var(--muted)';
  }

  slugColor(slug: string): string {
    const map: Record<string, string> = {
      free:      'hsl(0,0%,40%)',
      essencial: 'var(--primary)',
      pro:       'hsl(221,83%,53%)',
      business:  'hsl(36,75%,40%)',
    };
    return map[slug] ?? 'var(--foreground)';
  }

  private emptyForm() {
    return {
      slug:        '',
      name:        '',
      description: '',
      price:       0 as number,
      max_courts:  null as number | null,
      features:    [] as string[],
      active:      true,
    };
  }
}
