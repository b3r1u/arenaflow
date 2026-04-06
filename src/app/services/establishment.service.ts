import { Injectable, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

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

  constructor(private api: ApiService) {}

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
        this._establishment.set(res.establishment);
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

  /** Chamado no logout para limpar o estado */
  reset(): void {
    this._establishment.set(null);
    this._initialized.set(false);
  }
}
