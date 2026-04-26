export interface Court {
  id: string;
  name: string;
  sport_type: 'ambos' | 'futevôlei' | 'vôlei' | 'beach tennis' | 'futebol';
  status: 'disponível' | 'ocupada' | 'bloqueada';
  hourly_rate: number;
  description?: string;
}

export interface BookingPaymentSplit {
  id: string;
  player_name: string;
  amount: number;      // centavos
  status: 'PENDENTE' | 'PAGO' | 'EXPIRADO';
  pix_expires_at: string | null;
}

export interface BookingPaymentGroup {
  id: string;
  payment_type: 'SPLIT' | 'DEPOSIT';
  total_amount: number;   // centavos
  paid_amount: number;    // centavos
  status: 'PENDENTE' | 'PARCIAL' | 'PAGO';
  splits: BookingPaymentSplit[];
}

export interface Booking {
  id: string;
  client_name: string;
  client_phone?: string;
  court_id: string;
  court_name?: string;
  sport_type?: string;
  date: string;
  start_hour: string;
  end_hour: string;
  payment_method?: 'pix' | 'cartão' | 'dinheiro' | '';
  payment_status: 'pago' | 'parcial' | 'pendente' | 'não informado' | 'cancelado';
  total_amount: number;
  paid_amount?: number;
  notes?: string;
  status?: string;
  duration_hours?: number;
  split_payment?: boolean;
  num_players?: number;
  payment_group?: BookingPaymentGroup | null;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export type ThemeId = 'base' | 'lima' | 'sage' | 'dark-red';

export type DiaSemana = 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';

export interface Mensalista {
  id: string;
  group_name: string;
  court_id: string;
  day_of_week: DiaSemana;
  start_hour: string;
  end_hour: string;
  active: boolean;
  payment_status: 'confirmado' | 'pendente';
  monthly_amount?: number;
  contact_phone?: string;
  notes?: string;
}

export interface CancellationPolicy {
  limit_hours: number;  // 0 = sem limite (sempre grátis)
  fee_percent: number;  // % cobrada do paid_amount após o limite
}

export interface EstablishmentProfile {
  name: string;
  logoUrl?: string; // base64 ou URL
  phone?: string;
  email?: string;
  address?: string;     // combinado "logradouro, número" — enviado à API
  street?: string;      // logradouro separado — persiste no localStorage
  houseNumber?: string; // número separado — persiste no localStorage
  cep?: string;         // CEP — persiste no localStorage
  neighborhood?: string;
  city?: string;
  theme?: ThemeId;
}

export interface Promotion {
  id: string;
  title: string;
  description?: string;
  type: 'desconto' | 'evento' | 'campeonato';
  discount_percent?: number;
  start_date?: string;
  end_date?: string;
  start_hour?: string;
  end_hour?: string;
  active: boolean;
}
