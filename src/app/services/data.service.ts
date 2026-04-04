import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Booking, Client, Court, DiaSemana, Mensalista, Promotion } from '../models/models';

@Injectable({ providedIn: 'root' })
export class DataService {
  private courtsSubject = new BehaviorSubject<Court[]>([
    { id: '1', name: 'Quadra 1', sport_type: 'futevôlei', status: 'disponível', hourly_rate: 80, description: 'Quadra de areia principal' },
    { id: '2', name: 'Quadra 2', sport_type: 'vôlei',     status: 'disponível', hourly_rate: 90, description: 'Quadra coberta' },
    { id: '3', name: 'Quadra 3', sport_type: 'ambos',     status: 'bloqueada',  hourly_rate: 75, description: 'Em manutenção' },
  ]);

  private bookingsSubject = new BehaviorSubject<Booking[]>([
    { id: '1', client_name: 'Lucas Silva',   client_phone: '(11) 99999-1111', court_id: '1', date: new Date().toISOString().split('T')[0], start_hour: '09:00', end_hour: '10:00', payment_method: 'pix',     payment_status: 'pago',     total_amount: 80,  duration_hours: 1 },
    { id: '2', client_name: 'Ana Costa',     client_phone: '(11) 98888-2222', court_id: '2', date: new Date().toISOString().split('T')[0], start_hour: '11:00', end_hour: '13:00', payment_method: 'cartão',  payment_status: 'pago',     total_amount: 180, duration_hours: 2 },
    { id: '3', client_name: 'Pedro Rocha',   client_phone: '(11) 97777-3333', court_id: '1', date: new Date().toISOString().split('T')[0], start_hour: '14:00', end_hour: '15:00', payment_method: '',        payment_status: 'pendente', total_amount: 80,  duration_hours: 1 },
    { id: '4', client_name: 'Maria Santos',  client_phone: '(11) 96666-4444', court_id: '2', date: this.yesterday(),                       start_hour: '10:00', end_hour: '11:00', payment_method: 'dinheiro',payment_status: 'pago',     total_amount: 90,  duration_hours: 1 },
    { id: '5', client_name: 'João Oliveira', client_phone: '(11) 95555-5555', court_id: '1', date: this.yesterday(),                       start_hour: '16:00', end_hour: '18:00', payment_method: 'pix',     payment_status: 'pago',     total_amount: 160, duration_hours: 2 },
  ]);

  private clientsSubject = new BehaviorSubject<Client[]>([
    { id: '1', name: 'Lucas Silva',   phone: '(11) 99999-1111', email: 'lucas@email.com' },
    { id: '2', name: 'Ana Costa',     phone: '(11) 98888-2222', email: 'ana@email.com' },
    { id: '3', name: 'Pedro Rocha',   phone: '(11) 97777-3333' },
    { id: '4', name: 'Maria Santos',  phone: '(11) 96666-4444', email: 'maria@email.com' },
    { id: '5', name: 'João Oliveira', phone: '(11) 95555-5555' },
  ]);

  private promotionsSubject = new BehaviorSubject<Promotion[]>([
    { id: '1', title: 'Happy Hour',          description: 'Desconto nas reservas das 14h às 17h', type: 'desconto',    discount_percent: 20, start_date: '2026-04-01', end_date: '2026-04-30', start_hour: '14:00', end_hour: '17:00', active: true  },
    { id: '2', title: 'Torneio de Futevôlei',description: 'Campeonato mensal aberto ao público',  type: 'campeonato',  discount_percent: 0,  start_date: '2026-04-15', end_date: '2026-04-15',                                       active: true  },
    { id: '3', title: 'Noite de Gala',       description: 'Evento especial com DJ',               type: 'evento',      discount_percent: 0,  start_date: '2026-04-20', end_date: '2026-04-20', start_hour: '20:00', end_hour: '23:00', active: false },
  ]);

  // ─── Mensalistas ───────────────────────────────────────────────────────────
  // Seed: inclui um mensalista ativo + confirmado para o dia de hoje (quinta)
  // na Quadra 1, 08:00–10:00, para demonstrar o bloqueio imediatamente.
  private mensalistasSubject = new BehaviorSubject<Mensalista[]>([
    { id: 'm1', group_name: 'Grupo da Manhã',     court_id: '1', day_of_week: this.todayDow(), start_hour: '08:00', end_hour: '10:00', active: true,  payment_status: 'confirmado', monthly_amount: 320, contact_phone: '(11) 91111-2222' },
    { id: 'm2', group_name: 'Time do Domingo',    court_id: '2', day_of_week: 'domingo',        start_hour: '09:00', end_hour: '11:00', active: true,  payment_status: 'confirmado', monthly_amount: 360 },
    { id: 'm3', group_name: 'Rapaziada da Tarde', court_id: '1', day_of_week: 'sabado',         start_hour: '14:00', end_hour: '16:00', active: true,  payment_status: 'pendente',   monthly_amount: 280 },
    { id: 'm4', group_name: 'Galera do Vôlei',    court_id: '2', day_of_week: 'terca',          start_hour: '20:00', end_hour: '22:00', active: false, payment_status: 'confirmado', monthly_amount: 320 },
  ]);

  courts$      = this.courtsSubject.asObservable();
  bookings$    = this.bookingsSubject.asObservable();
  clients$     = this.clientsSubject.asObservable();
  promotions$  = this.promotionsSubject.asObservable();
  mensalistas$ = this.mensalistasSubject.asObservable();

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private yesterday(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  /** Retorna o DiaSemana correspondente a uma string YYYY-MM-DD */
  getDayOfWeek(dateStr: string): DiaSemana {
    const map: DiaSemana[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    // T12:00:00 evita problemas de fuso que fariam new Date() interpretar a data como dia anterior
    return map[new Date(dateStr + 'T12:00:00').getDay()];
  }

  private todayDow(): DiaSemana {
    return this.getDayOfWeek(new Date().toISOString().split('T')[0]);
  }

  // ─── Getters ───────────────────────────────────────────────────────────────

  getCourts():      Court[]      { return this.courtsSubject.getValue(); }
  getBookings():    Booking[]    { return this.bookingsSubject.getValue(); }
  getClients():     Client[]     { return this.clientsSubject.getValue(); }
  getPromotions():  Promotion[]  { return this.promotionsSubject.getValue(); }
  getMensalistas(): Mensalista[] { return this.mensalistasSubject.getValue(); }

  // ─── Regra de negócio principal ────────────────────────────────────────────

  /**
   * Verifica se um intervalo de horário numa quadra/data está bloqueado
   * por um mensalista ATIVO com pagamento CONFIRMADO.
   *
   * Regras aplicadas:
   *  - mensalista.active === true
   *  - mensalista.payment_status === 'confirmado'
   *  - mesmo court_id
   *  - mesmo dia da semana que a data informada
   *  - sobreposição de horário: start_m < endHour && end_m > startHour
   */
  isHorarioOcupadoPorMensalista(
    courtId:   string,
    date:      string,
    startHour: string,
    endHour:   string
  ): boolean {
    const dow = this.getDayOfWeek(date);
    return this.getMensalistas().some(m =>
      m.active &&
      m.payment_status === 'confirmado' &&
      m.court_id   === courtId &&
      m.day_of_week === dow &&
      m.start_hour  < endHour &&
      m.end_hour    > startHour
    );
  }

  /**
   * Retorna o mensalista ativo+confirmado que ocupa o hour dado,
   * útil para renderizar o bloco visual na grade de agendamentos.
   */
  getMensalistaForSlot(courtId: string, date: string, hour: string): Mensalista | undefined {
    const dow = this.getDayOfWeek(date);
    return this.getMensalistas().find(m =>
      m.active &&
      m.payment_status === 'confirmado' &&
      m.court_id    === courtId &&
      m.day_of_week === dow &&
      m.start_hour  <= hour &&
      m.end_hour    >  hour
    );
  }

  /** Filtragem opcional por quadra e/ou dia da semana */
  getMensalistasAtivos(courtId?: string, dow?: DiaSemana): Mensalista[] {
    return this.getMensalistas().filter(m => {
      if (!m.active) return false;
      if (courtId && m.court_id    !== courtId) return false;
      if (dow     && m.day_of_week !== dow)     return false;
      return true;
    });
  }

  // ─── Courts CRUD ───────────────────────────────────────────────────────────

  addCourt(court: Omit<Court, 'id'>): void {
    this.courtsSubject.next([...this.getCourts(), { ...court, id: Date.now().toString() }]);
  }
  updateCourt(id: string, updates: Partial<Court>): void {
    this.courtsSubject.next(this.getCourts().map(c => c.id === id ? { ...c, ...updates } : c));
  }
  deleteCourt(id: string): void {
    this.courtsSubject.next(this.getCourts().filter(c => c.id !== id));
  }

  // ─── Bookings CRUD ─────────────────────────────────────────────────────────

  addBooking(booking: Omit<Booking, 'id'>): void {
    this.bookingsSubject.next([...this.getBookings(), { ...booking, id: Date.now().toString() }]);
  }
  updateBooking(id: string, updates: Partial<Booking>): void {
    this.bookingsSubject.next(this.getBookings().map(b => b.id === id ? { ...b, ...updates } : b));
  }
  deleteBooking(id: string): void {
    this.bookingsSubject.next(this.getBookings().filter(b => b.id !== id));
  }

  // ─── Clients CRUD ──────────────────────────────────────────────────────────

  addClient(client: Omit<Client, 'id'>): void {
    this.clientsSubject.next([...this.getClients(), { ...client, id: Date.now().toString() }]);
  }
  updateClient(id: string, updates: Partial<Client>): void {
    this.clientsSubject.next(this.getClients().map(c => c.id === id ? { ...c, ...updates } : c));
  }
  deleteClient(id: string): void {
    this.clientsSubject.next(this.getClients().filter(c => c.id !== id));
  }

  // ─── Promotions CRUD ───────────────────────────────────────────────────────

  addPromotion(promo: Omit<Promotion, 'id'>): void {
    this.promotionsSubject.next([...this.getPromotions(), { ...promo, id: Date.now().toString() }]);
  }
  updatePromotion(id: string, updates: Partial<Promotion>): void {
    this.promotionsSubject.next(this.getPromotions().map(p => p.id === id ? { ...p, ...updates } : p));
  }
  deletePromotion(id: string): void {
    this.promotionsSubject.next(this.getPromotions().filter(p => p.id !== id));
  }

  // ─── Mensalistas CRUD ──────────────────────────────────────────────────────

  addMensalista(m: Omit<Mensalista, 'id'>): void {
    this.mensalistasSubject.next([...this.getMensalistas(), { ...m, id: Date.now().toString() }]);
  }
  updateMensalista(id: string, updates: Partial<Mensalista>): void {
    this.mensalistasSubject.next(this.getMensalistas().map(m => m.id === id ? { ...m, ...updates } : m));
  }
  deleteMensalista(id: string): void {
    this.mensalistasSubject.next(this.getMensalistas().filter(m => m.id !== id));
  }

  // ─── Analytics ─────────────────────────────────────────────────────────────

  getTodayBookings(): Booking[] {
    const today = new Date().toISOString().split('T')[0];
    return this.getBookings().filter(b => b.date === today);
  }

  getTodayRevenue(): number {
    return this.getTodayBookings().filter(b => b.payment_status === 'pago').reduce((s, b) => s + b.total_amount, 0);
  }

  getMonthlyRevenue(): number {
    const now = new Date();
    return this.getBookings().filter(b => {
      const d = new Date(b.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && b.payment_status === 'pago';
    }).reduce((s, b) => s + b.total_amount, 0);
  }

  getLast7DaysRevenue(): { day: string; revenue: number }[] {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const label   = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const revenue = this.getBookings()
        .filter(b => b.date === dateStr && b.payment_status === 'pago')
        .reduce((s, b) => s + b.total_amount, 0);
      return { day: label, revenue };
    });
  }

  getPopularHours(): { hour: string; count: number }[] {
    const counts: Record<string, number> = {};
    for (let h = 7; h <= 22; h++) counts[`${h.toString().padStart(2, '0')}:00`] = 0;
    this.getBookings().forEach(b => {
      const start = parseInt(b.start_hour);
      const end   = parseInt(b.end_hour);
      for (let h = start; h < end; h++) {
        const key = `${h.toString().padStart(2, '0')}:00`;
        if (counts[key] !== undefined) counts[key]++;
      }
    });
    return Object.entries(counts).map(([hour, count]) => ({ hour, count }));
  }

  getClientBookings(clientName: string): Booking[] {
    return this.getBookings().filter(b => b.client_name === clientName);
  }

  getClientTotalSpent(clientName: string): number {
    return this.getClientBookings(clientName)
      .filter(b => b.payment_status === 'pago')
      .reduce((s, b) => s + b.total_amount, 0);
  }
}
