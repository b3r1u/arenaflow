import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Court } from '../models/models';

/** Formato retornado pela API */
interface ApiCourt {
  id: string;
  name: string;
  sport_type: string;
  status: 'DISPONIVEL' | 'BLOQUEADA';
  hourly_rate: number;
  description?: string | null;
}

/** Converte o status do banco (uppercase) para o formato do front */
function fromApi(c: ApiCourt): Court {
  return {
    id:          c.id,
    name:        c.name,
    sport_type:  c.sport_type as Court['sport_type'],
    status:      c.status === 'DISPONIVEL' ? 'disponível' : 'bloqueada',
    hourly_rate: c.hourly_rate,
    description: c.description ?? undefined,
  };
}

/** Converte o status do front para o enum do banco */
function toApiStatus(s: string): 'DISPONIVEL' | 'BLOQUEADA' {
  return s === 'disponível' ? 'DISPONIVEL' : 'BLOQUEADA';
}

export interface CourtFormData {
  name: string;
  sport_type: string;
  status: string;
  hourly_rate: number;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class CourtService {
  private _courts  = signal<Court[]>([]);
  private _loading = signal(false);
  private _saving  = signal(false);
  private _error   = signal<string | null>(null);

  readonly courts  = this._courts.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving  = this._saving.asReadonly();
  readonly error   = this._error.asReadonly();

  constructor(private api: ApiService) {}

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.api.get<{ courts: ApiCourt[] }>('/courts')
      );
      this._courts.set(res.courts.map(fromApi));
    } catch (e: any) {
      if (e?.status === 404) {
        this._courts.set([]);
      } else {
        this._error.set('Erro ao carregar quadras');
        console.error('[CourtService] load error', e);
      }
    } finally {
      this._loading.set(false);
    }
  }

  async create(data: CourtFormData): Promise<Court> {
    this._saving.set(true);
    try {
      const res = await firstValueFrom(
        this.api.post<{ court: ApiCourt }>('/courts', {
          name:        data.name,
          sport_type:  data.sport_type,
          hourly_rate: data.hourly_rate,
          status:      toApiStatus(data.status),
          description: data.description || undefined,
        })
      );
      const court = fromApi(res.court);
      this._courts.update(cs => [...cs, court]);
      return court;
    } finally {
      this._saving.set(false);
    }
  }

  async update(id: string, data: Partial<CourtFormData>): Promise<Court> {
    this._saving.set(true);
    try {
      const body: Record<string, unknown> = { ...data };
      if (data.status !== undefined) {
        body['status'] = toApiStatus(data.status);
      }
      const res = await firstValueFrom(
        this.api.patch<{ court: ApiCourt }>(`/courts/${id}`, body)
      );
      const court = fromApi(res.court);
      this._courts.update(cs => cs.map(c => c.id === id ? court : c));
      return court;
    } finally {
      this._saving.set(false);
    }
  }

  async remove(id: string): Promise<void> {
    this._saving.set(true);
    try {
      await firstValueFrom(
        this.api.delete<{ message: string }>(`/courts/${id}`)
      );
      this._courts.update(cs => cs.filter(c => c.id !== id));
    } finally {
      this._saving.set(false);
    }
  }
}
