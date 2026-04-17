import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

export interface DashboardStats {
  reservasHoje:   number;
  pagasHoje:      number;
  pendentesHoje:  number;
  receitaHoje:    number;
  reservasMes:    number;
  receitaMensal:  number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private api: ApiService) {}

  async getStats(): Promise<DashboardStats> {
    return firstValueFrom(this.api.get<DashboardStats>('/dashboard/stats'));
  }
}
