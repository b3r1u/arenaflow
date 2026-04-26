import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Booking } from '../models/models';

@Injectable({ providedIn: 'root' })
export class BookingAdminService {
  constructor(private api: ApiService) {}

  /** Busca todas as reservas do mês informado (padrão: mês atual). */
  async getMonthBookings(month?: string): Promise<Booking[]> {
    const params: Record<string, string> = {};
    if (month) params['month'] = month;
    const res = await firstValueFrom(
      this.api.get<{ bookings: Booking[] }>('/admin/bookings/month', params)
    );
    return res.bookings;
  }

  /** Confirma pagamento de uma reserva. */
  async confirmPayment(id: string): Promise<Booking> {
    const res = await firstValueFrom(
      this.api.patch<{ booking: Booking }>(`/admin/bookings/${id}`, { payment_status: 'pago' })
    );
    return res.booking;
  }

  /** Cancela uma reserva. */
  async cancelBooking(id: string): Promise<void> {
    await firstValueFrom(this.api.delete(`/admin/bookings/${id}`));
  }
}
