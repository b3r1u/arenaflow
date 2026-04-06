import { Injectable, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { ProfileService } from './profile.service';

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
  private _loading       = signal(false);
  private _initialized   = signal(false);

  readonly establishment    = this._establishment.asReadonly();
  readonly loading          = this._loading.asReadonly();
  readonly initialized      = this._initialized.asReadonly();
  readonly hasEstablishment = computed(() => this._establishment() !== null);

  constructor(private api: ApiService, private profileService: ProfileService) {}

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
      await firstValueFrom(
        this.api.post<{ user: unknown }>('/auth/me', { role: 'ADMIN' })
      );

      // Verifica se estabelecimento existe
      try {
        const res = await firstValueFrom(
          this.api.get<{ establishment: ApiEstablishment }>('/establishments/me')
        );
        const est = res.establishment;
        this._establishment.set(est);

        // Se a API tem um logo cadastrado, sincroniza com o perfil local (sidebar)
        if (est.logo_url) {
          this.profileService.updateLogo(est.logo_url);
        }
      } catch (e: any) {
        if (e?.status === 404) {
          this._establishment.set(null);
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

  /** Chamado no logout para limpar o estado */
  reset(): void {
    this._establishment.set(null);
    this._initialized.set(false);
  }
}
