import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { EstablishmentService } from '../../services/establishment.service';
import { ApiService } from '../../services/api.service';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  highlight: boolean;
  badge: string | null;
  features: { label: string; included: boolean }[];
  cta: string;
  commission_pct: number;
}

@Component({
  selector: 'app-planos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    @keyframes spin { to { transform: rotate(360deg); } }
    .sub-input {
      width:100%; padding:0.6rem 0.85rem 0.6rem 2.4rem;
      border-radius:0.65rem; font-size:0.85rem;
      background:var(--muted); border:1px solid var(--border);
      color:var(--foreground); outline:none; transition:border-color 0.2s;
    }
    .sub-input:focus { border-color:var(--primary); }
    .sub-input::placeholder { color:var(--muted-foreground); }
    .sub-input-wrap { position:relative; margin-bottom:0.75rem; }
    .sub-input-icon {
      position:absolute; left:0.65rem; top:50%; transform:translateY(-50%);
      font-size:1rem; color:var(--muted-foreground); pointer-events:none;
    }
  `],
  template: `
    <div>
      <!-- Header -->
      <div class="mb-6 text-center">
        <h1 class="font-heading font-bold text-2xl lg:text-3xl" style="color:var(--foreground)">Planos & Preços</h1>
        <p class="text-sm mt-1.5" style="color:var(--muted-foreground)">Escolha o plano ideal para a sua arena</p>
      </div>

      <!-- Banner de assinatura atual -->
      <div *ngIf="subscription()" class="max-w-6xl mx-auto mb-6">

        <!-- TRIAL ativo -->
        <div *ngIf="subscription()!.status === 'TRIAL'"
             class="flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
             style="background:rgba(34,165,92,0.08);border:1.5px solid rgba(34,165,92,0.25)">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                 style="background:rgba(34,165,92,0.15)">
              <span class="material-icons" style="color:var(--primary);font-size:1.2rem">verified</span>
            </div>
            <div>
              <p class="font-heading font-semibold text-sm" style="color:var(--foreground);margin:0">
                Período de teste gratuito — Plano {{ subscription()!.plan.name }}
              </p>
              <p class="text-xs mt-0.5" style="color:var(--muted-foreground);margin:0">
                <ng-container *ngIf="trialDaysRemaining() !== null && trialDaysRemaining()! > 0">
                  Restam <strong style="color:var(--primary)">{{ trialDaysRemaining() }} {{ trialDaysRemaining() === 1 ? 'dia' : 'dias' }}</strong> de acesso completo gratuito
                </ng-container>
                <ng-container *ngIf="trialDaysRemaining() === 0">
                  Seu período de teste encerrou hoje
                </ng-container>
              </p>
            </div>
          </div>
          <div class="flex-shrink-0">
            <div class="px-4 py-2 rounded-xl text-xs font-semibold"
                 style="background:rgba(34,165,92,0.12);color:var(--primary);border:1px solid rgba(34,165,92,0.25)">
              Em breve: Assinar
            </div>
          </div>
        </div>

        <!-- ACTIVE -->
        <div *ngIf="subscription()!.status === 'ACTIVE'"
             class="flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
             style="background:rgba(34,165,92,0.08);border:1.5px solid rgba(34,165,92,0.25)">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                 style="background:rgba(34,165,92,0.15)">
              <span class="material-icons" style="color:var(--primary);font-size:1.2rem">check_circle</span>
            </div>
            <div>
              <p class="font-heading font-semibold text-sm" style="color:var(--foreground);margin:0">
                Assinatura ativa — Plano <strong>{{ subscription()!.plan.name }}</strong>
              </p>
              <p class="text-xs mt-0.5" style="color:var(--muted-foreground);margin:0">
                Renovação automática mensal via cartão de crédito
              </p>
            </div>
          </div>
          <button (click)="showCancelModal = true"
                  class="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
                  style="background:rgba(239,68,68,0.08);color:#f87171;border:1px solid rgba(239,68,68,0.2)"
                  onmouseover="this.style.background='rgba(239,68,68,0.15)'"
                  onmouseout="this.style.background='rgba(239,68,68,0.08)'">
            <span class="material-icons" style="font-size:0.9rem">cancel</span>
            Cancelar assinatura
          </button>
        </div>

        <!-- EXPIRED ou CANCELLED -->
        <div *ngIf="subscription()!.status === 'EXPIRED' || subscription()!.status === 'CANCELLED'"
             class="flex items-center gap-3 rounded-2xl px-5 py-4"
             style="background:rgba(239,68,68,0.07);border:1.5px solid rgba(239,68,68,0.2)">
          <span class="material-icons" style="color:#f87171">warning</span>
          <p class="text-sm font-medium" style="color:var(--foreground);margin:0">
            Sua assinatura está inativa. Escolha um plano abaixo para reativar.
          </p>
        </div>
      </div>

      <!-- Toggle mensal/anual -->
      <div class="text-center mb-7">
        <div class="inline-flex items-center gap-2 p-1 rounded-xl" style="background:var(--muted)">
          <button (click)="annual = false"
                  class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                  [style.background]="!annual ? 'var(--card)' : 'transparent'"
                  [style.color]="!annual ? 'var(--foreground)' : 'var(--muted-foreground)'"
                  [style.box-shadow]="!annual ? '0 1px 4px rgba(0,0,0,0.12)' : 'none'">
            Mensal
          </button>
          <button (click)="annual = true"
                  class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-1.5"
                  [style.background]="annual ? 'var(--card)' : 'transparent'"
                  [style.color]="annual ? 'var(--foreground)' : 'var(--muted-foreground)'"
                  [style.box-shadow]="annual ? '0 1px 4px rgba(0,0,0,0.12)' : 'none'">
            Anual
            <span class="text-xs font-semibold px-1.5 py-0.5 rounded-md" style="background:hsl(152,69%,40%,0.12);color:var(--primary)">-20%</span>
          </button>
        </div>
      </div>

      <!-- Cards de planos -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
        <div *ngFor="let plan of plans"
             class="relative flex flex-col rounded-2xl p-6 transition-all duration-200"
             [style.background]="plan.highlight ? 'var(--sidebar-background)' : 'var(--card)'"
             [style.border]="plan.highlight ? '2px solid var(--primary)' : '1px solid var(--border)'"
             [style.box-shadow]="plan.highlight ? '0 8px 32px rgba(34,197,94,0.18)' : '0 1px 4px rgba(0,0,0,0.04)'">

          <!-- Badge -->
          <div *ngIf="plan.badge"
               class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold font-heading"
               style="background:var(--primary);color:white;white-space:nowrap">
            {{ plan.badge }}
          </div>

          <!-- Plano ativo indicator -->
          <div *ngIf="isCurrentPlan(plan.id)"
               class="absolute -top-3 right-4 px-2.5 py-1 rounded-full text-xs font-semibold"
               style="background:var(--primary);color:white">
            Atual
          </div>

          <!-- Plan name & description -->
          <div class="mb-5">
            <h2 class="font-heading font-bold text-lg"
                [style.color]="plan.highlight ? 'white' : 'var(--foreground)'">{{ plan.name }}</h2>
            <p class="text-xs mt-1"
               [style.color]="plan.highlight ? 'rgba(255,255,255,0.55)' : 'var(--muted-foreground)'">{{ plan.description }}</p>
          </div>

          <!-- Price -->
          <div class="mb-6">
            <div class="flex items-end gap-1">
              <span class="text-sm font-medium"
                    [style.color]="plan.highlight ? 'rgba(255,255,255,0.6)' : 'var(--muted-foreground)'">R$</span>
              <span class="font-heading font-bold text-4xl leading-none"
                    [style.color]="plan.highlight ? 'white' : 'var(--foreground)'">
                {{ plan.price === 0 ? '0' : (annual ? Math.round(plan.price * 0.8) : plan.price) }}
              </span>
              <span class="text-sm mb-0.5"
                    [style.color]="plan.highlight ? 'rgba(255,255,255,0.5)' : 'var(--muted-foreground)'">/mês</span>
            </div>
            <p *ngIf="annual && plan.price > 0" class="text-xs mt-1.5 font-medium" style="color:var(--primary)">
              Cobrado R{{ '$' }}{{ Math.round(plan.price * 0.8 * 12) }}/ano
            </p>
          </div>

          <!-- CTA Button -->
          <button class="w-full py-2.5 rounded-xl font-heading font-semibold text-sm mb-6 transition-all duration-150"
                  [style.background]="plan.highlight ? 'var(--primary)' : (isCurrentPlan(plan.id) ? 'var(--muted)' : 'transparent')"
                  [style.color]="plan.highlight ? 'white' : 'var(--foreground)'"
                  [style.border]="plan.highlight ? 'none' : '1.5px solid var(--border)'"
                  [style.opacity]="isCurrentPlan(plan.id) ? '0.6' : '1'"
                  [style.cursor]="isCurrentPlan(plan.id) || plan.id === 'free' ? 'default' : 'pointer'"
                  (click)="!isCurrentPlan(plan.id) && plan.id !== 'free' && openSubscribeModal(plan)"
                  onmouseover="if(!this.disabled)this.style.opacity='0.88'"
                  onmouseout="this.style.opacity='1'">
            <ng-container *ngIf="isCurrentPlan(plan.id)">Plano atual</ng-container>
            <ng-container *ngIf="!isCurrentPlan(plan.id) && plan.id === 'free'">Começar grátis</ng-container>
            <ng-container *ngIf="!isCurrentPlan(plan.id) && plan.id !== 'free'">
              <span class="flex items-center justify-center gap-1.5">
                <span class="material-icons" style="font-size:0.9rem">credit_card</span>
                {{ plan.cta }}
              </span>
            </ng-container>
          </button>

          <!-- Taxa ArenaFlow sobre reservas -->
          <div class="flex items-center justify-between px-3 py-2 rounded-xl mb-4"
               [style.background]="plan.commission_pct === 0
                 ? 'rgba(34,165,92,0.12)'
                 : (plan.highlight ? 'rgba(255,255,255,0.08)' : 'var(--muted)')">
            <div class="flex items-center gap-1.5">
              <span class="material-icons" style="font-size:0.9rem"
                    [style.color]="plan.commission_pct === 0 ? 'var(--primary)' : (plan.highlight ? 'rgba(255,255,255,0.5)' : 'var(--muted-foreground)')">
                {{ plan.commission_pct === 0 ? 'check_circle' : 'percent' }}
              </span>
              <span class="text-xs"
                    [style.color]="plan.highlight ? 'rgba(255,255,255,0.6)' : 'var(--muted-foreground)'">
                Taxa sobre reservas
              </span>
            </div>
            <span class="text-xs font-bold"
                  [style.color]="plan.commission_pct === 0 ? 'var(--primary)' : (plan.highlight ? 'white' : 'var(--foreground)')">
              {{ plan.commission_pct === 0 ? 'Isento' : plan.commission_pct + '%' }}
            </span>
          </div>

          <!-- Divider -->
          <div class="mb-5" style="border-top:1px solid"
               [style.border-color]="plan.highlight ? 'rgba(255,255,255,0.1)' : 'var(--border)'"></div>

          <!-- Features -->
          <ul class="space-y-3 flex-1">
            <li *ngFor="let feature of plan.features" class="flex items-start gap-2.5 text-sm">
              <span *ngIf="feature.included" class="material-icons flex-shrink-0 mt-0.5"
                    style="font-size:1rem;color:var(--primary)">check_circle</span>
              <span *ngIf="!feature.included" class="material-icons flex-shrink-0 mt-0.5"
                    style="font-size:1rem;color:rgba(150,150,150,0.5)">remove_circle_outline</span>
              <span [style.color]="plan.highlight ? (feature.included ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)') :
                                                    (feature.included ? 'var(--foreground)' : 'var(--muted-foreground)')">
                {{ feature.label }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- ── Modal de assinatura ── -->
      <div *ngIf="showSubscribeModal"
           class="fixed inset-0 z-50 flex items-center justify-center p-4"
           style="background:rgba(0,0,0,0.65);backdrop-filter:blur(4px)"
           (click)="closeSubscribeModal()">
        <div class="relative w-full max-w-md rounded-2xl shadow-2xl overflow-y-auto"
             style="background:var(--card);border:1px solid var(--border);max-height:90vh"
             (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="px-6 pt-6 pb-4" style="border-bottom:1px solid var(--border)">
            <div class="flex items-center justify-between mb-1">
              <h2 class="font-heading font-bold text-lg" style="color:var(--foreground)">Assinar plano</h2>
              <button (click)="closeSubscribeModal()" style="color:var(--muted-foreground);background:none;border:none;cursor:pointer;padding:0">
                <span class="material-icons">close</span>
              </button>
            </div>
            <!-- Chip do plano -->
            <div *ngIf="subscribingPlan" class="flex items-center justify-between rounded-xl px-4 py-2.5 mt-3"
                 style="background:rgba(34,165,92,0.08);border:1px solid rgba(34,165,92,0.25)">
              <div>
                <p class="text-xs font-semibold" style="color:var(--primary);margin:0;text-transform:uppercase;letter-spacing:0.05em">
                  {{ subscribingPlan.name }}{{ annual ? ' Anual' : '' }}
                </p>
                <p class="text-xs" style="color:var(--muted-foreground);margin:0">
                  {{ annual ? 'Cobrado anualmente (20% de desconto)' : 'Cobrança mensal recorrente' }}
                </p>
              </div>
              <div class="text-right">
                <p class="font-heading font-bold text-xl" style="color:var(--foreground);margin:0">
                  R$ {{ annual ? Math.round(subscribingPlan.price * 0.8) : subscribingPlan.price }}
                  <span class="text-xs font-normal" style="color:var(--muted-foreground)">/mês</span>
                </p>
                <p *ngIf="annual" class="text-xs" style="color:var(--primary);margin:0">
                  R$ {{ Math.round(subscribingPlan.price * 0.8 * 12) }}/ano
                </p>
              </div>
            </div>
          </div>

          <!-- Formulário -->
          <div class="px-6 py-5">
            <p class="text-xs font-semibold mb-4" style="color:var(--muted-foreground);text-transform:uppercase;letter-spacing:0.06em">Dados do cartão de crédito</p>

            <!-- Número -->
            <div class="sub-input-wrap">
              <span class="material-icons sub-input-icon">credit_card</span>
              <input class="sub-input" [value]="subCardNumber" (input)="onSubCardNumberInput($event)"
                     type="text" placeholder="0000 0000 0000 0000" maxlength="19" inputmode="numeric" autocomplete="cc-number">
            </div>

            <!-- Nome -->
            <div class="sub-input-wrap">
              <span class="material-icons sub-input-icon">person</span>
              <input class="sub-input" [(ngModel)]="subCardHolder"
                     type="text" placeholder="Nome impresso no cartão" style="text-transform:uppercase" autocomplete="cc-name">
            </div>

            <!-- Validade + CVV -->
            <div style="display:flex;gap:0.75rem">
              <div class="sub-input-wrap" style="flex:1">
                <span class="material-icons sub-input-icon" style="font-size:0.9rem">date_range</span>
                <input class="sub-input" [value]="subCardExpiry" (input)="onSubExpiryInput($event)"
                       type="text" placeholder="MM/AA" maxlength="5" inputmode="numeric" autocomplete="cc-exp">
              </div>
              <div class="sub-input-wrap" style="flex:1">
                <span class="material-icons sub-input-icon" style="font-size:0.9rem">lock</span>
                <input class="sub-input" [(ngModel)]="subCardCvv"
                       type="password" placeholder="CVV" maxlength="4" inputmode="numeric" autocomplete="cc-csc">
              </div>
            </div>

            <!-- CPF -->
            <div class="sub-input-wrap">
              <span class="material-icons sub-input-icon">badge</span>
              <input class="sub-input" [value]="subDocument" (input)="onSubDocumentInput($event)"
                     type="text" placeholder="CPF do titular" maxlength="14" inputmode="numeric">
            </div>

            <!-- Celular -->
            <div class="sub-input-wrap">
              <span class="material-icons sub-input-icon">phone_iphone</span>
              <input class="sub-input" [value]="subPhone" (input)="onSubPhoneInput($event)"
                     type="text" placeholder="(00) 00000-0000" maxlength="15" inputmode="numeric" autocomplete="tel">
            </div>

            <!-- CEP de cobrança -->
            <p class="text-xs font-semibold mb-3 mt-1" style="color:var(--muted-foreground);text-transform:uppercase;letter-spacing:0.06em">Endereço de cobrança</p>
            <div style="display:flex;gap:0.75rem;margin-bottom:0">
              <div class="sub-input-wrap" style="flex:1;margin-bottom:0">
                <span class="material-icons sub-input-icon">place</span>
                <input class="sub-input" [value]="subCep" (input)="onSubCepInput($event)"
                       type="text" placeholder="CEP" maxlength="9" inputmode="numeric" autocomplete="postal-code">
              </div>
              <div class="sub-input-wrap" style="flex:0 0 60px;margin-bottom:0">
                <input class="sub-input" [value]="subState" readonly
                       style="padding-left:0.85rem;text-align:center;background:var(--muted);color:var(--muted-foreground)"
                       placeholder="UF">
              </div>
            </div>
            <div class="sub-input-wrap" style="margin-top:0.75rem" *ngIf="subCity">
              <span class="material-icons sub-input-icon">location_city</span>
              <input class="sub-input" [value]="subCity" readonly
                     style="background:var(--muted);color:var(--muted-foreground)">
            </div>
            <p *ngIf="cepLoading" class="text-xs mt-1 mb-2" style="color:var(--muted-foreground)">
              <span class="material-icons" style="font-size:0.8rem;vertical-align:middle;animation:spin 1s linear infinite">sync</span>
              Consultando CEP...
            </p>

            <!-- Erro -->
            <p *ngIf="subscribeError" class="text-xs mt-1 mb-3" style="color:#f87171">{{ subscribeError }}</p>

            <!-- Segurança -->
            <div class="flex items-center gap-1.5 mt-2 mb-5">
              <span class="material-icons" style="font-size:0.9rem;color:var(--primary)">lock</span>
              <span class="text-xs" style="color:var(--muted-foreground)">Pagamento seguro via Pagar.me · Dados criptografados</span>
            </div>

            <!-- Ações -->
            <div class="flex gap-3">
              <button (click)="closeSubscribeModal()"
                      class="flex-1 py-2.5 rounded-xl font-heading font-semibold text-sm"
                      style="background:var(--muted);color:var(--foreground);border:1px solid var(--border)">
                Cancelar
              </button>
              <button (click)="submitSubscription()"
                      [disabled]="subscribeLoading"
                      class="flex-1 py-2.5 rounded-xl font-heading font-semibold text-sm flex items-center justify-center gap-1.5"
                      style="background:var(--primary);color:white;border:none;cursor:pointer;transition:opacity 0.2s"
                      [style.opacity]="subscribeLoading ? '0.7' : '1'">
                <span *ngIf="subscribeLoading" class="material-icons" style="font-size:1rem;animation:spin 1s linear infinite">sync</span>
                {{ subscribeLoading ? 'Processando...' : 'Confirmar assinatura' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Modal de cancelamento ── -->
      <div *ngIf="showCancelModal"
           class="fixed inset-0 z-50 flex items-center justify-center p-4"
           style="background:rgba(0,0,0,0.65);backdrop-filter:blur(4px)"
           (click)="showCancelModal = false">
        <div class="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
             style="background:var(--card);border:1px solid var(--border)"
             (click)="$event.stopPropagation()">

          <!-- Ícone de alerta -->
          <div class="flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4"
               style="background:rgba(239,68,68,0.1)">
            <span class="material-icons" style="color:#f87171;font-size:1.5rem">warning_amber</span>
          </div>

          <h2 class="font-heading font-bold text-lg text-center mb-1" style="color:var(--foreground)">
            Cancelar assinatura?
          </h2>
          <p class="text-xs text-center mb-5" style="color:var(--muted-foreground)">
            Plano <strong style="color:var(--foreground)">{{ subscription()?.plan?.name }}</strong>
          </p>

          <!-- Texto explicativo -->
          <div class="space-y-3 mb-6 rounded-xl p-4" style="background:var(--muted)">
            <div class="flex items-start gap-2.5">
              <span class="material-icons flex-shrink-0 mt-0.5" style="font-size:1rem;color:#facc15">info</span>
              <p class="text-sm" style="color:var(--foreground);margin:0">
                Seu acesso permanece <strong>ativo até o fim do período atual</strong> já pago. Nenhum valor adicional será cobrado.
              </p>
            </div>
            <div class="flex items-start gap-2.5">
              <span class="material-icons flex-shrink-0 mt-0.5" style="font-size:1rem;color:#f87171">arrow_downward</span>
              <p class="text-sm" style="color:var(--foreground);margin:0">
                Ao término do período, sua conta será <strong>rebaixada automaticamente para o plano Free</strong>, com limite de 1 quadra.
              </p>
            </div>
            <div class="flex items-start gap-2.5">
              <span class="material-icons flex-shrink-0 mt-0.5" style="font-size:1rem;color:var(--primary)">storage</span>
              <p class="text-sm" style="color:var(--foreground);margin:0">
                Todos os seus <strong>dados, clientes e agendamentos são preservados</strong>. Você não perde nenhuma informação.
              </p>
            </div>
            <div class="flex items-start gap-2.5">
              <span class="material-icons flex-shrink-0 mt-0.5" style="font-size:1rem;color:var(--primary)">replay</span>
              <p class="text-sm" style="color:var(--foreground);margin:0">
                Pode <strong>reativar a assinatura a qualquer momento</strong> escolhendo um novo plano.
              </p>
            </div>
          </div>

          <!-- Erro -->
          <p *ngIf="cancelError" class="text-xs text-center mb-3" style="color:#f87171">{{ cancelError }}</p>

          <!-- Ações -->
          <div class="flex gap-3">
            <button (click)="showCancelModal = false"
                    class="flex-1 py-2.5 rounded-xl font-heading font-semibold text-sm transition-all duration-150"
                    style="background:var(--muted);color:var(--foreground);border:1px solid var(--border)"
                    onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
              Manter assinatura
            </button>
            <button (click)="confirmCancel()"
                    [disabled]="cancelLoading"
                    class="flex-1 py-2.5 rounded-xl font-heading font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-1.5"
                    style="background:rgba(239,68,68,0.12);color:#f87171;border:1px solid rgba(239,68,68,0.25)"
                    onmouseover="this.style.background='rgba(239,68,68,0.22)'" onmouseout="this.style.background='rgba(239,68,68,0.12)'">
              <span *ngIf="cancelLoading" class="material-icons" style="font-size:1rem;animation:spin 1s linear infinite">sync</span>
              <span *ngIf="!cancelLoading" class="material-icons" style="font-size:0.9rem">cancel</span>
              {{ cancelLoading ? 'Cancelando...' : 'Sim, cancelar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- FAQ rápido -->
      <div class="max-w-2xl mx-auto mt-12">
        <h2 class="font-heading font-semibold text-base mb-4 text-center" style="color:var(--foreground)">Dúvidas frequentes</h2>
        <div class="space-y-3">
          <div *ngFor="let faq of faqs" class="card p-4">
            <button class="w-full flex items-center justify-between text-left gap-4"
                    (click)="faq.open = !faq.open">
              <span class="font-medium text-sm" style="color:var(--foreground)">{{ faq.question }}</span>
              <span class="material-icons flex-shrink-0 transition-transform duration-200"
                    style="font-size:1.1rem;color:var(--muted-foreground)"
                    [style.transform]="faq.open ? 'rotate(180deg)' : 'rotate(0)'">expand_more</span>
            </button>
            <p *ngIf="faq.open" class="text-sm mt-2 leading-relaxed" style="color:var(--muted-foreground)">{{ faq.answer }}</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PlanosComponent implements OnInit {
  private establishmentService = inject(EstablishmentService);
  private api                  = inject(ApiService);

  annual        = false;
  Math          = Math;

  // slugs anuais vindos da API, mapeados por slug mensal
  private annualSlugs: Record<string, string> = {};

  ngOnInit(): void {
    this.api.get<{ plans: any[] }>('/plans').subscribe({
      next: ({ plans }) => {
        // Mescla preços e comissões reais do banco nos cards hardcoded
        this.plans = this.plans.map(local => {
          const remote = plans.find(p => p.slug === local.id);
          if (!remote) return local;
          return { ...local, price: Number(remote.price), commission_pct: Number(remote.commission_pct ?? local.commission_pct) };
        });

        // Mapeia planos anuais: 'essencial' → 'essencial-anual', etc.
        plans
          .filter(p => p.slug.endsWith('-anual') && p.pagarme_plan_id)
          .forEach(p => {
            const monthlySlug = p.slug.replace('-anual', '');
            this.annualSlugs[monthlySlug] = p.slug;
          });
      },
      error: () => { /* mantém valores locais em caso de falha */ }
    });
  }

  /** Retorna o slug correto (mensal ou anual) para usar na assinatura */
  private resolvedSlug(planId: string): string {
    if (this.annual && this.annualSlugs[planId]) {
      return this.annualSlugs[planId];
    }
    return planId;
  }
  showCancelModal = false;
  cancelLoading   = false;
  cancelError     = '';

  readonly subscription       = this.establishmentService.subscription;
  readonly trialDaysRemaining = this.establishmentService.trialDaysRemaining;

  // ── Subscribe modal ─────────────────────────────────────
  showSubscribeModal = false;
  subscribingPlan: Plan | null = null;
  subCardNumber = ''; subCardHolder = ''; subCardExpiry = '';
  subCardCvv = ''; subDocument = ''; subPhone = '';
  subCep = ''; subCity = ''; subState = '';
  cepLoading = false;
  subscribeLoading = false;
  subscribeError = '';

  openSubscribeModal(plan: Plan) {
    this.subscribingPlan  = plan;
    this.showSubscribeModal = true;
    this.subscribeError   = '';
    this.subCardNumber = ''; this.subCardHolder = ''; this.subCardExpiry = '';
    this.subCardCvv = ''; this.subDocument = ''; this.subPhone = '';
    this.subCep = ''; this.subCity = ''; this.subState = '';
  }

  closeSubscribeModal() {
    this.showSubscribeModal = false;
    this.subscribingPlan = null;
  }

  onSubCardNumberInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 16);
    this.subCardNumber = raw.replace(/(.{4})/g, '$1 ').trim();
    (e.target as HTMLInputElement).value = this.subCardNumber;
  }

  onSubExpiryInput(e: Event) {
    let raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) raw = raw.slice(0, 2) + '/' + raw.slice(2);
    this.subCardExpiry = raw;
    (e.target as HTMLInputElement).value = raw;
  }

  onSubDocumentInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
    const fmt = raw.length <= 3 ? raw
      : raw.length <= 6 ? raw.slice(0, 3) + '.' + raw.slice(3)
      : raw.length <= 9 ? raw.slice(0, 3) + '.' + raw.slice(3, 6) + '.' + raw.slice(6)
      : raw.slice(0, 3) + '.' + raw.slice(3, 6) + '.' + raw.slice(6, 9) + '-' + raw.slice(9);
    this.subDocument = fmt;
    (e.target as HTMLInputElement).value = fmt;
  }

  onSubPhoneInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
    let fmt = raw;
    if (raw.length > 2) fmt = '(' + raw.slice(0, 2) + ') ' + raw.slice(2);
    if (raw.length > 7) fmt = '(' + raw.slice(0, 2) + ') ' + raw.slice(2, 7) + '-' + raw.slice(7);
    this.subPhone = fmt;
    (e.target as HTMLInputElement).value = fmt;
  }

  onSubCepInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 8);
    const fmt = raw.length > 5 ? raw.slice(0, 5) + '-' + raw.slice(5) : raw;
    this.subCep = raw;
    (e.target as HTMLInputElement).value = fmt;

    if (raw.length === 8) {
      this.cepLoading = true;
      this.subCity = ''; this.subState = '';
      fetch(`https://viacep.com.br/ws/${raw}/json/`)
        .then(r => r.json())
        .then(d => {
          if (!d.erro) {
            this.subCity  = d.localidade || '';
            this.subState = d.uf || '';
          }
        })
        .catch(() => {})
        .finally(() => this.cepLoading = false);
    } else {
      this.subCity = ''; this.subState = '';
    }
  }

  async submitSubscription() {
    const rawCep = this.subCep.replace(/\D/g, '');
    if (!this.subCardNumber || !this.subCardHolder || !this.subCardExpiry || !this.subCardCvv || !this.subDocument || !this.subPhone) {
      this.subscribeError = 'Preencha todos os campos do cartão antes de continuar.';
      return;
    }
    if (rawCep.length !== 8) {
      this.subscribeError = 'Informe um CEP válido para o endereço de cobrança.';
      return;
    }
    this.subscribeLoading = true;
    this.subscribeError   = '';
    try {
      const [expMonth, expYear] = this.subCardExpiry.split('/');
      await firstValueFrom(
        this.api.post('/subscriptions', {
          plan_slug:         this.resolvedSlug(this.subscribingPlan!.id),
          customer_document: this.subDocument.replace(/\D/g, ''),
          customer_phone:    this.subPhone.replace(/\D/g, ''),
          card: {
            number:      this.subCardNumber.replace(/\D/g, ''),
            holder_name: this.subCardHolder.toUpperCase(),
            exp_month:   expMonth,
            exp_year:    '20' + expYear,
            cvv:         this.subCardCvv,
          },
          billing_address: {
            line_1:   '1',
            zip_code: rawCep,
            city:     this.subCity  || 'Não informado',
            state:    this.subState || 'SP',
            country:  'BR',
          },
        })
      );
      window.location.reload();
    } catch (e: any) {
      this.subscribeError = e?.error?.error || 'Erro ao processar o cartão. Verifique os dados e tente novamente.';
    } finally {
      this.subscribeLoading = false;
    }
  }

  // ── Cancel modal ─────────────────────────────────────
  async confirmCancel() {
    this.cancelLoading = true;
    this.cancelError   = '';
    try {
      await firstValueFrom(this.api.delete('/subscriptions/me'));
      // Recarrega dados do usuário para atualizar o signal de subscription
      await firstValueFrom(this.api.post('/auth/me', { role: 'ADMIN' }));
      window.location.reload();
    } catch (e: any) {
      this.cancelError = e?.error?.error || 'Erro ao cancelar. Tente novamente.';
    } finally {
      this.cancelLoading = false;
    }
  }

  isCurrentPlan(planId: string): boolean {
    const sub = this.subscription();
    if (!sub) return planId === 'free';
    return sub.plan.slug === planId;
  }

  plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'mês',
      description: 'Para testar a plataforma sem compromisso.',
      highlight: false,
      badge: null,
      cta: 'Começar grátis',
      commission_pct: 10,
      features: [
        { label: '1 quadra incluída',                 included: true  },
        { label: 'Agendamentos ilimitados',           included: true  },
        { label: 'Cadastro de clientes',              included: true  },
        { label: 'Dashboard básico',                  included: true  },
        { label: 'Agendamento online público',        included: false },
        { label: 'Relatórios avançados',              included: false },
        { label: 'Quadra extra (+R$39/quadra)',        included: false },
        { label: 'Notificações WhatsApp/e-mail',      included: false },
        { label: 'Multi-usuário',                     included: false },
        { label: 'Suporte prioritário',               included: false },
      ]
    },
    {
      id: 'essencial',
      name: 'Essencial',
      price: 89,
      period: 'mês',
      description: 'Para arenas iniciando com até 2 quadras.',
      highlight: false,
      badge: null,
      cta: 'Assinar Essencial',
      commission_pct: 7,
      features: [
        { label: 'Até 2 quadras incluídas',           included: true  },
        { label: 'Agendamentos ilimitados',           included: true  },
        { label: 'Cadastro de clientes',              included: true  },
        { label: 'Dashboard básico',                  included: true  },
        { label: 'Agendamento online público',        included: true  },
        { label: 'Relatórios avançados',              included: false },
        { label: 'Quadra extra (+R$39/quadra)',        included: false },
        { label: 'Notificações WhatsApp/e-mail',      included: false },
        { label: 'Multi-usuário',                     included: false },
        { label: 'Suporte prioritário',               included: false },
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 159,
      period: 'mês',
      description: 'Para arenas em crescimento com até 5 quadras.',
      highlight: true,
      badge: 'Mais popular',
      cta: 'Assinar Pro',
      commission_pct: 4,
      features: [
        { label: 'Até 5 quadras incluídas',           included: true  },
        { label: 'Agendamentos ilimitados',           included: true  },
        { label: 'Cadastro de clientes',              included: true  },
        { label: 'Dashboard completo',                included: true  },
        { label: 'Agendamento online público',        included: true  },
        { label: 'Relatórios avançados',              included: true  },
        { label: 'Quadra extra (+R$39/quadra)',        included: true  },
        { label: 'Notificações WhatsApp/e-mail',      included: false },
        { label: 'Multi-usuário',                     included: false },
        { label: 'Suporte prioritário',               included: false },
      ]
    },
    {
      id: 'business',
      name: 'Business',
      price: 269,
      period: 'mês',
      description: 'Para complexos esportivos com quadras ilimitadas.',
      highlight: false,
      badge: null,
      cta: 'Assinar Business',
      commission_pct: 0,
      features: [
        { label: 'Quadras ilimitadas',                included: true  },
        { label: 'Agendamentos ilimitados',           included: true  },
        { label: 'Cadastro de clientes',              included: true  },
        { label: 'Dashboard completo',                included: true  },
        { label: 'Agendamento online público',        included: true  },
        { label: 'Relatórios avançados',              included: true  },
        { label: 'Quadra extra (+R$39/quadra)',        included: true  },
        { label: 'Notificações WhatsApp/e-mail',      included: true  },
        { label: 'Multi-usuário',                     included: true  },
        { label: 'Suporte prioritário',               included: true  },
      ]
    }
  ];

  faqs = [
    {
      question: 'Posso cancelar a qualquer momento?',
      answer: 'Sim. Você pode cancelar sua assinatura a qualquer momento sem multa. O acesso continua ativo até o fim do período pago.',
      open: false
    },
    {
      question: 'O que acontece com meus dados se eu cancelar?',
      answer: 'Seus dados ficam armazenados por 30 dias após o cancelamento. Nesse período você pode exportar tudo ou reativar o plano.',
      open: false
    },
    {
      question: 'Posso migrar de plano depois?',
      answer: 'Sim, você pode fazer upgrade ou downgrade a qualquer momento. No upgrade o novo plano é cobrado imediatamente com desconto proporcional.',
      open: false
    },
    {
      question: 'O plano anual tem desconto?',
      answer: 'Sim, ao assinar o plano anual você garante 20% de desconto em relação ao valor mensal, além de travar o preço por 12 meses.',
      open: false
    },
    {
      question: 'Posso adicionar mais quadras sem trocar de plano?',
      answer: 'Sim! Nos planos Pro e Business você pode adicionar quadras extras por R$ 39/quadra/mês, sem precisar fazer upgrade. É a forma mais flexível de crescer no seu ritmo.',
      open: false
    }
  ];
}
