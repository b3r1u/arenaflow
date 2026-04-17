import { Injectable, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { ProfileService } from './profile.service';
import { CourtService, ApiCourt } from './court.service';

export interface ApiSubscription {
  id: string;
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  trial_ends_at?: string | null;
  days_remaining?: number | null;  // calculado pelo servidor
  starts_at: string;
  ends_at?: string | null;
  plan: {
    slug: string;
    name: string;
    price: number;
    max_courts: number | null;
    features: string[];
  };
}

export interface ApiEstablishment {
  id: string;
  name: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  phone?: string;
  description?: string;
  sports: string[];
  open_hours?: string;
  logo_color: string;
  logo_initials: string;
  logo_url?: string | null;
  price_from?: number;
  price_to?: number;
  courts?: ApiCourt[];
}

export interface CreateEstablishmentDto {
  name: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  phone?: string;
  description?: string;
  sports?: string[];
  open_hours?: string;
  logo_color?: string;
  logo_url?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EstablishmentService {
  private _establishment = signal<ApiEstablishment | null>(null);
  private _subscription  = signal<ApiSubscription | null>(null);
  private _loading       = signal(false);
  private _initialized   = signal(false);

  /** Plano escolhido na tela de cadastro — consumido uma vez pelo init() */
  private _pendingPlanSlug: string | null = null;

  setPendingPlan(slug: string) {
    this._pendingPlanSlug = slug;
  }

  readonly establishment    = this._establishment.asReadonly();
  readonly subscription     = this._subscription.asReadonly();
  readonly loading          = this._loading.asReadonly();
  readonly initialized      = this._initialized.asReadonly();
  readonly hasEstablishment = computed(() => this._establishment() !== null);

  // Usa o valor calculado pelo servidor — imune ao relógio do cliente
  readonly trialDaysRemaining = computed(() => {
    const sub = this._subscription();
    if (!sub || sub.status !== 'TRIAL') return null;
    return sub.days_remaining ?? null;
  });

  constructor(
    private api: ApiService,
    private profileService: ProfileService,
    private courtService: CourtService,
  ) {}

  /**
   * Chama POST /auth/me para registrar/atualizar o usuário no banco,
   * depois GET /establishments/me para verificar se já tem estabelecimento.
   * Chamado uma vez após login, pelo LayoutComponent.
   */
  async init(): Promise<void> {
    if (this._initialized()) return;
    this._loading.set(true);
    try {
      // Registra/retorna o usuário como ADMIN no banco
      const planSlug = this._pendingPlanSlug;
      this._pendingPlanSlug = null; // consome e descarta
      const authRes = await firstValueFrom(
        this.api.post<{ user: { subscription?: ApiSubscription } }>('/auth/me', {
          role: 'ADMIN',
          ...(planSlug ? { plan_slug: planSlug } : {}),
        })
      );
      if (authRes.user?.subscription) {
        this._subscription.set(authRes.user.subscription);
      }

      // Verifica se estabelecimento existe
      try {
        const res = await firstValueFrom(
          this.api.get<{ establishment: ApiEstablishment }>('/establishments/me')
        );
        const est = res.establishment;
        this._establishment.set(est);

        // Popula CourtService com as quadras já embutidas na resposta (evita chamada extra)
        if (est.courts) {
          this.courtService.seed(est.courts);
        }

        // Sincroniza dados da API com o perfil local (sidebar + formulário de perfil)
        const profileUpdates: { name?: string; logoUrl?: string; phone?: string; address?: string; neighborhood?: string; city?: string } = {};
        if (est.name)         profileUpdates.name         = est.name;
        if (est.logo_url)     profileUpdates.logoUrl      = est.logo_url;
        if (est.phone)        profileUpdates.phone        = est.phone;
        if (est.address)      profileUpdates.address      = est.address;
        if (est.neighborhood) profileUpdates.neighborhood = est.neighborhood;
        if (est.city)         profileUpdates.city         = est.city;
        if (Object.keys(profileUpdates).length) {
          this.profileService.updateProfile(profileUpdates);
        }
      } catch (e: any) {
        if (e?.status === 404) {
          this._establishment.set(null);
          // Conta sem estabelecimento no banco — limpa cache local do perfil
          this.profileService.resetStorage();
        } else {
          throw e;
        }
      }
    } catch (err) {
      console.error('[EstablishmentService] init error', err);
    } finally {
      this._loading.set(false);
      this._initialized.set(true);
    }
  }

  async create(data: CreateEstablishmentDto): Promise<ApiEstablishment> {
    const res = await firstValueFrom(
      this.api.post<{ establishment: ApiEstablishment }>('/establishments', data)
    );
    this._establishment.set(res.establishment);
    return res.establishment;
  }

  /**
   * Sincroniza o logo com o banco.
   * Chamado pelo PerfilComponent ao clicar em "Salvar informações".
   * Se o estabelecimento ainda não foi carregado, aguarda a inicialização.
   */
  async syncLogo(logoUrl: string | null): Promise<void> {
    // Aguarda init se ainda não concluiu
    if (!this._initialized()) {
      await this.init();
    }
    if (!this.hasEstablishment()) return;
    try {
      const res = await firstValueFrom(
        this.api.patch<{ establishment: ApiEstablishment }>(
          '/establishments/me',
          { logo_url: logoUrl }
        )
      );
      this._establishment.set(res.establishment);
    } catch (err) {
      console.error('[EstablishmentService] syncLogo error', err);
      throw err; // propaga para o componente poder exibir feedback
    }
  }

  /**
   * Sincroniza os dados do perfil (nome, telefone, endereço, cidade, etc.) com o banco.
   * Chamado pelo PerfilComponent ao clicar em "Salvar informações".
   */
  async syncProfile(data: {
    name?: string;
    phone?: string;
    address?: string;
    neighborhood?: string;
    city?: string;
    description?: string;
    logo_url?: string | null;
  }): Promise<void> {
    if (!this._initialized()) {
      await this.init();
    }
    if (!this.hasEstablishment()) return;
    try {
      const res = await firstValueFrom(
        this.api.patch<{ establishment: ApiEstablishment }>(
          '/establishments/me',
          data
        )
      );
      this._establishment.set(res.establishment);
    } catch (err) {
      console.error('[EstablishmentService] syncProfile error', err);
      throw err;
    }
  }

  /** Chamado no logout para limpar o estado */
  reset(): void {
    this._establishment.set(null);
    this._subscription.set(null);
    this._initialized.set(false);
  }
}
