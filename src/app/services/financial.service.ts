import { Injectable, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

export interface FinancialInfo {
  id: string;
  account_holder: string;
  document_type: 'CPF' | 'CNPJ';
  document_masked: string;
  pix_key_type: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  pix_key_masked: string;
  asaas_account_id?: string;
  bank_registered: boolean;
  docs_uploaded: number;
  status: 'PENDING_REVIEW' | 'ACTIVE' | 'SUSPENDED';
  lgpd_consent_at: string;
  created_at: string;
  updated_at: string;
}

export interface SaveBankDto {
  bank_code: string;
  account_type: string;
  agency: string;
  agency_digit?: string;
  account: string;
  account_digit: string;
}

export interface SaveFinancialDto {
  account_holder: string;
  document_type: string;
  document_value: string;
  pix_key_type: string;
  pix_key_value: string;
  lgpd_consent: boolean;
  email: string;
  phone?: string;
  birth_date?: string;
  company_type?: string;
  address?: string;
  address_number?: string;
  complement?: string;
  province?: string;
  postal_code?: string;
}

@Injectable({ providedIn: 'root' })
export class FinancialService {
  private _financial = signal<FinancialInfo | null | undefined>(undefined);
  private _loading   = signal(false);

  readonly financial   = this._financial.asReadonly();
  readonly loading     = this._loading.asReadonly();
  readonly hasFinancial = computed(() => !!this._financial());
  readonly isConfigured = computed(() => {
    const f = this._financial();
    return f !== null && f !== undefined;
  });

  constructor(private api: ApiService) {}

  async load(): Promise<void> {
    this._loading.set(true);
    try {
      const res = await firstValueFrom(
        this.api.get<{ financial: FinancialInfo | null }>('/financial/me')
      );
      this._financial.set(res.financial);
    } catch {
      this._financial.set(null);
    } finally {
      this._loading.set(false);
    }
  }

  async save(data: SaveFinancialDto): Promise<{ financial: FinancialInfo; asaas_warning: string | null }> {
    const res = await firstValueFrom(
      this.api.post<{ financial: FinancialInfo; asaas_warning: string | null }>('/financial/me', data)
    );
    this._financial.set(res.financial);
    return res;
  }

  async saveBank(data: SaveBankDto): Promise<FinancialInfo> {
    const res = await firstValueFrom(
      this.api.post<{ financial: FinancialInfo }>('/financial/bank-account', data)
    );
    this._financial.set(res.financial);
    return res.financial;
  }

  async saveDocument(formData: FormData): Promise<FinancialInfo> {
    const res = await firstValueFrom(
      this.api.http.post<{ financial: FinancialInfo }>(
        `${this.api.baseUrl}/financial/document`, formData
      )
    );
    this._financial.set(res.financial);
    return res.financial;
  }

  reset(): void {
    this._financial.set(undefined);
  }
}
