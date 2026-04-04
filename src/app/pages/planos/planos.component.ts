import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
}

@Component({
  selector: 'app-planos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="font-heading font-bold text-2xl lg:text-3xl" style="color:var(--foreground)">Planos & Preços</h1>
        <p class="text-sm mt-1.5" style="color:var(--muted-foreground)">Escolha o plano ideal para a sua arena</p>

        <!-- Toggle mensal/anual -->
        <div class="inline-flex items-center gap-2 mt-5 p-1 rounded-xl" style="background:var(--muted)">
          <button (click)="annual = false"
                  class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                  [style.background]="!annual ? 'white' : 'transparent'"
                  [style.color]="!annual ? 'var(--foreground)' : 'var(--muted-foreground)'"
                  [style.box-shadow]="!annual ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'">
            Mensal
          </button>
          <button (click)="annual = true"
                  class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-1.5"
                  [style.background]="annual ? 'white' : 'transparent'"
                  [style.color]="annual ? 'var(--foreground)' : 'var(--muted-foreground)'"
                  [style.box-shadow]="annual ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'">
            Anual
            <span class="text-xs font-semibold px-1.5 py-0.5 rounded-md" style="background:hsl(152,69%,40%,0.12);color:var(--primary)">-20%</span>
          </button>
        </div>
      </div>

      <!-- Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
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
                  [style.background]="plan.highlight ? 'var(--primary)' : 'transparent'"
                  [style.color]="plan.highlight ? 'white' : 'var(--foreground)'"
                  [style.border]="plan.highlight ? 'none' : '1.5px solid var(--border)'"
                  [class.cursor-default]="plan.id === 'free' && currentPlan === 'free'"
                  onmouseover="this.style.opacity='0.88'"
                  onmouseout="this.style.opacity='1'">
            <span *ngIf="plan.id === currentPlan">Plano atual</span>
            <span *ngIf="plan.id !== currentPlan">{{ plan.cta }}</span>
          </button>

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
export class PlanosComponent {
  annual = false;
  currentPlan = 'free';
  Math = Math;

  plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'mês',
      description: 'Para começar a organizar sua arena sem custo.',
      highlight: false,
      badge: null,
      cta: 'Começar grátis',
      features: [
        { label: '1 quadra cadastrada',              included: true  },
        { label: 'Agendamentos ilimitados',           included: true  },
        { label: 'Cadastro de clientes',              included: true  },
        { label: 'Dashboard básico',                  included: true  },
        { label: 'Até 5 quadras',                     included: false },
        { label: 'Relatórios avançados',              included: false },
        { label: 'Agendamento online público',        included: false },
        { label: 'Notificações WhatsApp/e-mail',      included: false },
        { label: 'Multi-usuário',                     included: false },
        { label: 'Suporte prioritário',               included: false },
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 97,
      period: 'mês',
      description: 'Para arenas em crescimento que precisam de mais controle.',
      highlight: true,
      badge: 'Mais popular',
      cta: 'Assinar Pro',
      features: [
        { label: '1 quadra cadastrada',              included: true  },
        { label: 'Agendamentos ilimitados',           included: true  },
        { label: 'Cadastro de clientes',              included: true  },
        { label: 'Dashboard básico',                  included: true  },
        { label: 'Até 5 quadras',                     included: true  },
        { label: 'Relatórios avançados',              included: true  },
        { label: 'Agendamento online público',        included: true  },
        { label: 'Notificações WhatsApp/e-mail',      included: false },
        { label: 'Multi-usuário',                     included: false },
        { label: 'Suporte prioritário',               included: false },
      ]
    },
    {
      id: 'business',
      name: 'Business',
      price: 197,
      period: 'mês',
      description: 'Para complexos esportivos com múltiplas arenas e equipes.',
      highlight: false,
      badge: null,
      cta: 'Assinar Business',
      features: [
        { label: '1 quadra cadastrada',              included: true  },
        { label: 'Agendamentos ilimitados',           included: true  },
        { label: 'Cadastro de clientes',              included: true  },
        { label: 'Dashboard básico',                  included: true  },
        { label: 'Quadras ilimitadas',                included: true  },
        { label: 'Relatórios avançados',              included: true  },
        { label: 'Agendamento online público',        included: true  },
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
    }
  ];
}
