import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinancialService, FinancialInfo } from '../../services/financial.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Header -->
      <div class="mb-6">
        <h1 class="font-heading font-bold text-2xl lg:text-3xl" style="color:var(--foreground)">Financeiro</h1>
        <p class="text-sm mt-1" style="color:var(--muted-foreground)">Configure seus dados de recebimento</p>
      </div>

      <!-- Loading -->
      <div *ngIf="financialService.loading()" class="flex items-center justify-center py-24">
        <span class="material-icons" style="font-size:2.5rem;color:var(--border);animation:spin 1s linear infinite">refresh</span>
      </div>

      <ng-container *ngIf="!financialService.loading()">

        <!-- Status atual (se já configurado) -->
        <div *ngIf="financialService.hasFinancial()" class="card p-4 mb-6 flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               [style.background]="statusBg()">
            <span class="material-icons" style="font-size:1.2rem;color:white">{{ statusIcon() }}</span>
          </div>
          <div class="flex-1">
            <p class="font-semibold text-sm" style="color:var(--foreground)">{{ statusLabel() }}</p>
            <p class="text-xs mt-0.5" style="color:var(--muted-foreground)">{{ statusDesc() }}</p>
          </div>
          <span class="text-xs px-2.5 py-1 rounded-full font-semibold"
                [style.background]="statusBg() + '22'"
                [style.color]="statusBg()">
            {{ financialService.financial()?.status }}
          </span>
        </div>

        <!-- Dados atuais (modo leitura) -->
        <div *ngIf="financialService.hasFinancial() && !editing" class="card p-6 mb-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="font-heading font-semibold text-base" style="color:var(--foreground)">Dados cadastrados</h2>
            <button class="btn-outline text-sm px-3 py-1.5" (click)="startEdit()">Editar</button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-xs font-medium mb-1" style="color:var(--muted-foreground)">Titular da conta</p>
              <p style="color:var(--foreground)">{{ financialService.financial()?.account_holder }}</p>
            </div>
            <div>
              <p class="text-xs font-medium mb-1" style="color:var(--muted-foreground)">{{ financialService.financial()?.document_type }}</p>
              <p style="color:var(--foreground)">{{ financialService.financial()?.document_masked }}</p>
            </div>
            <div>
              <p class="text-xs font-medium mb-1" style="color:var(--muted-foreground)">Tipo da chave PIX</p>
              <p style="color:var(--foreground)">{{ pixKeyLabel(financialService.financial()?.pix_key_type) }}</p>
            </div>
            <div>
              <p class="text-xs font-medium mb-1" style="color:var(--muted-foreground)">Chave PIX</p>
              <p style="color:var(--foreground)">{{ financialService.financial()?.pix_key_masked }}</p>
            </div>
          </div>
          <!-- LGPD info -->
          <div class="mt-5 pt-4 flex items-start gap-2 text-xs" style="border-top:1px solid var(--border);color:var(--muted-foreground)">
            <span class="material-icons" style="font-size:0.9rem;margin-top:0.05rem">shield</span>
            <span>
              Consentimento LGPD registrado em
              <strong>{{ financialService.financial()?.lgpd_consent_at | date:'dd/MM/yyyy HH:mm' }}</strong>.
              Seus dados sensíveis são armazenados criptografados (AES-256-GCM) e nunca exibidos em texto puro.
            </span>
          </div>
        </div>

        <!-- Formulário (cadastro ou edição) -->
        <div *ngIf="!financialService.hasFinancial() || editing" class="card p-6">
          <h2 class="font-heading font-semibold text-base mb-5" style="color:var(--foreground)">
            {{ financialService.hasFinancial() ? 'Editar dados financeiros' : 'Cadastrar dados de recebimento' }}
          </h2>

          <!-- Aviso LGPD -->
          <div class="mb-5 px-4 py-3 rounded-xl text-sm flex items-start gap-2.5"
               style="background:hsl(152,69%,40%,0.07);border:1px solid hsl(152,69%,40%,0.2);color:var(--foreground)">
            <span class="material-icons flex-shrink-0" style="font-size:1rem;color:var(--primary);margin-top:0.1rem">privacy_tip</span>
            <div>
              <strong>Proteção de dados (LGPD)</strong><br>
              <span style="color:var(--muted-foreground)">
                CPF/CNPJ e chave PIX são coletados exclusivamente para processamento de pagamentos.
                Armazenados com criptografia AES-256-GCM. Você pode solicitar exclusão a qualquer momento.
              </span>
            </div>
          </div>

          <div class="space-y-4">
            <!-- Titular -->
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Nome do titular *</label>
              <input class="input" [(ngModel)]="form.account_holder" placeholder="Nome completo ou razão social">
            </div>

            <!-- CPF / CNPJ -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Tipo de documento *</label>
                <select class="select" [(ngModel)]="form.document_type">
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">{{ form.document_type }} *</label>
                <input class="input" [(ngModel)]="form.document_value"
                       [placeholder]="form.document_type === 'CPF' ? '000.000.000-00' : '00.000.000/0001-00'">
              </div>
            </div>

            <!-- Chave PIX -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Tipo de chave PIX *</label>
                <select class="select" [(ngModel)]="form.pix_key_type">
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="EMAIL">E-mail</option>
                  <option value="PHONE">Telefone</option>
                  <option value="RANDOM">Chave aleatória</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Chave PIX *</label>
                <input class="input" [(ngModel)]="form.pix_key_value"
                       [placeholder]="pixPlaceholder()">
              </div>
            </div>

            <!-- Consentimento LGPD -->
            <div class="flex items-start gap-3 mt-2 p-4 rounded-xl" style="background:var(--muted)">
              <input type="checkbox" id="lgpd" [(ngModel)]="form.lgpd_consent"
                     class="mt-0.5 flex-shrink-0" style="width:1rem;height:1rem;accent-color:var(--primary)">
              <label for="lgpd" class="text-xs cursor-pointer" style="color:var(--foreground)">
                <strong>Consentimento LGPD *</strong> — Autorizo a ArenaFlow a coletar e armazenar
                meu CPF/CNPJ e chave PIX, criptografados, com a finalidade exclusiva de processar
                pagamentos de reservas de quadras esportivas, conforme a Lei nº 13.709/2018 (LGPD).
                Posso revogar este consentimento e solicitar exclusão dos dados a qualquer momento.
              </label>
            </div>
          </div>

          <!-- Erro -->
          <div *ngIf="error" class="mt-4 px-3 py-2 rounded-lg text-sm"
               style="background:hsl(0,72%,51%,0.1);color:hsl(0,72%,51%)">
            {{ error }}
          </div>

          <!-- Ações -->
          <div class="flex gap-3 mt-6">
            <button *ngIf="editing" class="btn-outline flex-1" (click)="cancelEdit()" [disabled]="saving">Cancelar</button>
            <button class="btn-primary flex-1"
                    [disabled]="!canSave() || saving"
                    (click)="save()">
              <span *ngIf="saving" class="material-icons" style="font-size:0.9rem;animation:spin 1s linear infinite">refresh</span>
              <span *ngIf="!saving">{{ financialService.hasFinancial() ? 'Atualizar dados' : 'Salvar e ativar recebimentos' }}</span>
            </button>
          </div>
        </div>

      </ng-container>
    </div>
  `
})
export class FinanceiroComponent implements OnInit {
  editing = false;
  saving  = false;
  error: string | null = null;

  form = {
    account_holder: '',
    document_type:  'CPF',
    document_value: '',
    pix_key_type:   'CPF',
    pix_key_value:  '',
    lgpd_consent:   false,
  };

  constructor(
    public financialService: FinancialService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.financialService.load();
  }

  startEdit() {
    this.editing = true;
    const f = this.financialService.financial();
    if (f) {
      this.form.account_holder = f.account_holder;
      this.form.document_type  = f.document_type;
      this.form.pix_key_type   = f.pix_key_type;
      this.form.lgpd_consent   = true;
    }
  }

  cancelEdit() {
    this.editing = false;
    this.error   = null;
    this.resetForm();
  }

  canSave(): boolean {
    return !!(
      this.form.account_holder &&
      this.form.document_value &&
      this.form.pix_key_value  &&
      this.form.lgpd_consent
    );
  }

  async save() {
    this.saving = true;
    this.error  = null;
    try {
      await this.financialService.save(this.form);
      this.toast.show('Dados financeiros salvos com sucesso!');
      this.editing = false;
      this.resetForm();
    } catch (e: any) {
      this.error = e?.error?.error || 'Erro ao salvar dados financeiros';
    } finally {
      this.saving = false;
    }
  }

  resetForm() {
    this.form = { account_holder: '', document_type: 'CPF', document_value: '', pix_key_type: 'CPF', pix_key_value: '', lgpd_consent: false };
  }

  pixPlaceholder(): string {
    const map: Record<string, string> = {
      CPF: '000.000.000-00', CNPJ: '00.000.000/0001-00',
      EMAIL: 'email@exemplo.com', PHONE: '(81) 99999-9999', RANDOM: 'Chave aleatória',
    };
    return map[this.form.pix_key_type] ?? '';
  }

  pixKeyLabel(type?: string): string {
    const map: Record<string, string> = {
      CPF: 'CPF', CNPJ: 'CNPJ', EMAIL: 'E-mail', PHONE: 'Telefone', RANDOM: 'Chave aleatória',
    };
    return type ? (map[type] ?? type) : '';
  }

  statusBg(): string {
    const s = this.financialService.financial()?.status;
    if (s === 'ACTIVE')         return 'hsl(152,69%,40%)';
    if (s === 'SUSPENDED')      return 'hsl(0,72%,51%)';
    return 'hsl(38,92%,50%)'; // PENDING_REVIEW
  }

  statusIcon(): string {
    const s = this.financialService.financial()?.status;
    if (s === 'ACTIVE')    return 'check_circle';
    if (s === 'SUSPENDED') return 'block';
    return 'hourglass_top';
  }

  statusLabel(): string {
    const s = this.financialService.financial()?.status;
    if (s === 'ACTIVE')    return 'Conta ativa — recebendo pagamentos';
    if (s === 'SUSPENDED') return 'Conta suspensa';
    return 'Aguardando análise';
  }

  statusDesc(): string {
    const s = this.financialService.financial()?.status;
    if (s === 'ACTIVE')    return 'Seus clientes já podem pagar via app.';
    if (s === 'SUSPENDED') return 'Entre em contato com o suporte.';
    return 'Seus dados foram recebidos e estão em análise. Em breve você poderá receber pagamentos.';
  }
}
