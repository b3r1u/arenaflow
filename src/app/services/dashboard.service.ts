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

export interface RevenueDay {
  day:     string;
  revenue: number;
}

export interface TodayBooking {
  id:             string;
  client_name:    string;
  start_hour:     string;
  end_hour:       string;
  payment_status: string;
  total_amount:   number;
  paid_amount:    number;
  court_id:       string;
  court_name:     string;
  sport_type:     string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private api: ApiService) {}

  async getStats(): Promise<DashboardStats> {
    return firstValueFrom(this.api.get<DashboardStats>('/dashboard/stats'));
  }

  async getRevenue7Days(): Promise<RevenueDay[]> {
    return firstValueFrom(this.api.get<RevenueDay[]>('/dashboard/revenue7days'));
  }

  async getBookingsToday(): Promise<TodayBooking[]> {
    return firstValueFrom(
      this.api.get<{ bookings: TodayBooking[] }>('/dashboard/bookings-today')
    ).then(r => r.bookings);
  }

  async getPopularHours(period?: number): Promise<{ hour: string; count: number }[]> {
    const params: Record<string, string> = period ? { period: String(period) } : {};
    return firstValueFrom(
      this.api.get<{ hour: string; count: number }[]>('/dashboard/popular-hours', params)
    );
  }

  async getReport(period: number): Promise<ReportData> {
    return firstValueFrom(
      this.api.get<ReportData>('/dashboard/report', { period: String(period) })
    );
  }

  async getCourtStats(period: number): Promise<CourtStat[]> {
    return firstValueFrom(
      this.api.get<CourtStat[]>('/dashboard/court-stats', { period: String(period) })
    );
  }
}

export interface CourtStat {
  name:    string;
  hours:   number;
  revenue: number;
  rate:    number;
}

export interface ReportData {
  totalRevenue:   number;
  avgDaily:       number;
  totalBookings:  number;
  pendingRevenue: number;
  dailyData:      { label: string; revenue: number }[];
}
