import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinancialService, FinancialInfo, SaveBankDto, FinancialFormData } from '../../services/financial.service';
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

      <!-- Aviso genérico -->
      <div *ngIf="warning" class="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
           style="background:hsl(38,92%,50%,0.08);border:1px solid hsl(38,92%,50%,0.3);color:hsl(38,92%,50%)">
        <span class="material-icons flex-shrink-0" style="font-size:1.1rem;margin-top:0.05rem">warning</span>
        <span>{{ warning }}</span>
      </div>

      <!-- Erro ao carregar dados financeiros -->
      <div *ngIf="!financialService.loading() && financialService.loadError()" class="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
           style="background:hsl(0,72%,51%,0.08);border:1px solid hsl(0,72%,51%,0.3);color:hsl(0,72%,51%)">
        <span class="material-icons flex-shrink-0" style="font-size:1.1rem;margin-top:0.05rem">error_outline</span>
        <span>Erro ao carregar dados financeiros: {{ financialService.loadError() }}</span>
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
            {{ statusBadge() }}
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

        <!-- Status Pagar.me (recebedor cadastrado, aguardando ativação) -->
        <div *ngIf="financialService.hasFinancial() && !editing && financialService.financial()?.bank_registered && financialService.financial()?.status !== 'ACTIVE'"
             class="card p-5 mb-6 flex items-start gap-3">
          <span class="material-icons mt-0.5 flex-shrink-0" style="font-size:1.2rem;color:hsl(217,91%,60%)">info</span>
          <div>
            <p class="text-sm font-semibold" style="color:var(--foreground)">Recebedor cadastrado no Pagar.me</p>
            <p class="text-xs mt-0.5" style="color:var(--muted-foreground)">
              Seus dados foram enviados para análise. A ativação ocorre automaticamente pelo Pagar.me em até 1 dia útil.
              Nenhuma ação adicional é necessária.
            </p>
          </div>
        </div>


        <!-- Formulário (cadastro ou edição) -->
        <div *ngIf="!financialService.hasFinancial() || editing" class="card p-6">
          <h2 class="font-heading font-semibold text-base mb-5" style="color:var(--foreground)">
            {{ completionMode ? 'Completar dados de recebimento' : financialService.hasFinancial() ? 'Editar dados financeiros' : 'Cadastrar dados de recebimento' }}
          </h2>

          <!-- Modo completar: dados pessoais já salvos, só banco + documentos pendentes -->
          <div *ngIf="completionMode" class="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
               style="background:hsl(152,69%,40%,0.07);border:1px solid hsl(152,69%,40%,0.2)">
            <span class="material-icons flex-shrink-0" style="font-size:1rem;color:var(--primary);margin-top:0.1rem">check_circle</span>
            <span style="color:var(--muted-foreground)">
              Seus dados pessoais já estão salvos. Preencha apenas os dados bancários e o documento de identidade para concluir o cadastro.
            </span>
          </div>

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

            <!-- ── Dados pessoais (ocultados no modo completar) ── -->
            <ng-container *ngIf="!completionMode">

            <!-- Titular -->
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Nome do titular *</label>
              <input class="input" [(ngModel)]="form.account_holder" placeholder="Nome completo ou razão social">
            </div>

            <!-- E-mail e Celular -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">E-mail *</label>
                <input class="input" type="email" [(ngModel)]="form.email" placeholder="email@exemplo.com">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Celular</label>
                <input class="input" [value]="form.phone" (input)="form.phone = maskPhone($any($event.target).value)" placeholder="(81) 99999-9999">
              </div>
            </div>

            <!-- CPF / CNPJ -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Tipo de documento *</label>
                <select class="select" [(ngModel)]="form.document_type" (ngModelChange)="onDocTypeChange()">
                  <option value="CPF">CPF (Pessoa física)</option>
                  <option value="CNPJ">CNPJ (Pessoa jurídica)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">{{ form.document_type }} *</label>
                <input class="input" [value]="form.document_value"
                       (input)="form.document_value = maskDocument($any($event.target).value)"
                       [placeholder]="form.document_type === 'CPF' ? '000.000.000-00' : '00.000.000/0001-00'">
              </div>
            </div>

            <!-- Data de nascimento (CPF) ou Tipo de empresa (CNPJ) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div *ngIf="form.document_type === 'CPF'">
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Data de nascimento *</label>
                <input class="input" type="date" [(ngModel)]="form.birth_date" [max]="today">
                <p *ngIf="form.birth_date && form.birth_date > today" class="text-xs mt-1" style="color:hsl(0,72%,51%)">
                  A data de nascimento não pode ser futura.
                </p>
              </div>
              <div *ngIf="form.document_type === 'CNPJ'">
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Tipo de empresa *</label>
                <select class="select" [(ngModel)]="form.company_type">
                  <option value="MEI">MEI</option>
                  <option value="LIMITED">Ltda</option>
                  <option value="INDIVIDUAL">Empresário Individual</option>
                  <option value="ASSOCIATION">Associação</option>
                </select>
              </div>
            </div>

            <!-- Dados KYC obrigatórios (Pessoa Física) -->
            <ng-container *ngIf="form.document_type === 'CPF'">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Nome da mãe *</label>
                  <input class="input" [(ngModel)]="form.mother_name" placeholder="Maria Silva">
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Profissão *</label>
                  <input class="input" [(ngModel)]="form.professional_occupation" placeholder="Empresário">
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Renda mensal (R$) *</label>
                <input class="input" type="number" [(ngModel)]="form.monthly_income" placeholder="5000">
              </div>
            </ng-container>

            <!-- Endereço -->
            <p class="text-xs font-semibold uppercase tracking-wide mt-2" style="color:var(--muted-foreground)">Endereço</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Logradouro</label>
                <input class="input" [(ngModel)]="form.address" placeholder="Av. Rolf Wiest">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Número</label>
                <input class="input" [(ngModel)]="form.address_number" placeholder="277">
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Bairro</label>
                <input class="input" [(ngModel)]="form.province" placeholder="Bom Retiro">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">CEP</label>
                <input class="input" [value]="form.postal_code"
                       (input)="onCepInput($any($event.target).value)"
                       placeholder="89223-005">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Complemento</label>
                <input class="input" [(ngModel)]="form.complement" placeholder="Sala 502">
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Cidade *</label>
                <input class="input" [(ngModel)]="form.city" placeholder="Recife">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Estado (UF) *</label>
                <input class="input" [(ngModel)]="form.state" placeholder="PE" maxlength="2"
                       style="text-transform:uppercase">
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

            </ng-container>
            <!-- ── Dados Bancários ── -->
            <p class="text-xs font-semibold uppercase tracking-wide mt-2" style="color:var(--muted-foreground)">Dados Bancários</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Banco *</label>
                <select class="select" [(ngModel)]="bankForm.bank_code">
                  <option value="">Selecione o banco</option>
                  <option *ngFor="let b of banks" [value]="b.code">{{ b.code }} - {{ b.name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Tipo de conta *</label>
                <select class="select" [(ngModel)]="bankForm.account_type">
                  <option value="CONTA_CORRENTE">Conta Corrente</option>
                  <option value="CONTA_POUPANCA">Conta Poupança</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="col-span-1">
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Agência *</label>
                <input class="input" [(ngModel)]="bankForm.agency" placeholder="0001" maxlength="6">
              </div>
              <div class="col-span-1">
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Dígito</label>
                <input class="input" [(ngModel)]="bankForm.agency_digit" placeholder="0" maxlength="1">
              </div>
              <div class="col-span-1">
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Conta *</label>
                <input class="input" [(ngModel)]="bankForm.account" placeholder="000000" maxlength="12">
              </div>
              <div class="col-span-1">
                <label class="block text-sm font-medium mb-1.5" style="color:var(--foreground)">Dígito *</label>
                <input class="input" [(ngModel)]="bankForm.account_digit" placeholder="0" maxlength="2">
              </div>
            </div>

            <!-- Aviso Pagar.me -->
            <div class="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs mt-2"
                 style="background:hsl(217,91%,60%,0.08);border:1px solid hsl(217,91%,60%,0.25);color:hsl(217,91%,60%)">
              <span class="material-icons flex-shrink-0" style="font-size:1rem;margin-top:0.05rem">info</span>
              <span>Ao salvar, seus dados serão enviados ao Pagar.me para criação do recebedor. A verificação é feita automaticamente pelo Pagar.me em até 1 dia útil.</span>
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
  today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  editing        = false;
  completionMode = false;
  saving         = false;
  error:   string | null = null;
  warning: string | null = null;

  form = {
    account_holder: '',
    email:          '',
    phone:          '',
    document_type:  'CPF',
    document_value: '',
    birth_date:     '',
    company_type:   'MEI',
    mother_name:             '',
    monthly_income:          '',
    professional_occupation: '',
    address:        '',
    address_number: '',
    complement:     '',
    province:       '',
    postal_code:    '',
    city:           '',
    state:          '',
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

  async onCepInput(raw: string) {
    const masked = this.maskCep(raw);
    this.form.postal_code = masked;
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (!data.erro) {
          if (data.logradouro && !this.form.address)  this.form.address  = data.logradouro;
          if (data.bairro    && !this.form.province)  this.form.province = data.bairro;
          if (data.localidade) this.form.city  = data.localidade;
          if (data.uf)         this.form.state = data.uf.toUpperCase();
        }
      } catch { /* ignora erros silenciosamente */ }
    }
  }

  async startEdit() {
    const f = this.financialService.financial();
    this.completionMode = !!f && !f.bank_registered;
    this.editing = true;
    try {
      const formData = await this.financialService.getForm();
      if (formData) {
        this.form.account_holder = formData.account_holder;
        this.form.document_type  = formData.document_type;
        this.form.document_value = formData.document_value;
        this.form.pix_key_type   = formData.pix_key_type;
        this.form.pix_key_value  = formData.pix_key_value;
        this.form.email          = formData.email;
        this.form.phone          = formData.phone;
        this.form.birth_date     = formData.birth_date;
        this.form.company_type   = formData.company_type || 'MEI';
        this.form.mother_name             = formData.mother_name             || '';
        this.form.monthly_income          = formData.monthly_income          || '';
        this.form.professional_occupation = formData.professional_occupation || '';
        this.form.address        = formData.address;
        this.form.address_number = formData.address_number;
        this.form.complement     = formData.complement;
        this.form.province       = formData.province;
        this.form.postal_code    = formData.postal_code;
        this.form.city           = formData.city;
        this.form.state          = formData.state;
        this.form.lgpd_consent   = true;
        this.bankForm.bank_code      = formData.bank_code;
        this.bankForm.account_type   = formData.bank_account_type || 'CONTA_CORRENTE';
        this.bankForm.agency         = formData.bank_agency;
        this.bankForm.agency_digit   = formData.bank_agency_digit;
        this.bankForm.account        = formData.bank_account;
        this.bankForm.account_digit  = formData.bank_account_digit;
      }
    } catch {
      // Se falhar ao buscar, mantém o form em branco (não bloqueia a edição)
    }
  }

  cancelEdit() {
    this.editing        = false;
    this.completionMode = false;
    this.error          = null;
    this.resetForm();
  }

  banks = [
    { code: '001', name: 'Banco do Brasil'       },
    { code: '033', name: 'Santander'             },
    { code: '077', name: 'Banco Inter'           },
    { code: '104', name: 'Caixa Econômica Federal'},
    { code: '237', name: 'Bradesco'              },
    { code: '260', name: 'Nubank'                },
    { code: '290', name: 'PagBank'               },
    { code: '323', name: 'Mercado Pago'          },
    { code: '336', name: 'C6 Bank'              },
    { code: '341', name: 'Itaú'                  },
    { code: '380', name: 'PicPay'                },
    { code: '403', name: 'Cora'                  },
    { code: '748', name: 'Sicredi'               },
    { code: '756', name: 'Sicoob'                },
  ];

  bankForm: SaveBankDto = {
    bank_code: '', account_type: 'CONTA_CORRENTE',
    agency: '', agency_digit: '', account: '', account_digit: '',
  };

  maskPhone(v: string): string {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2)  return `(${d}`;
    if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  }

  maskDocument(v: string): string {
    const d = v.replace(/\D/g, '');
    if (this.form.document_type === 'CPF') {
      const c = d.slice(0, 11);
      if (c.length <= 3) return c;
      if (c.length <= 6) return `${c.slice(0,3)}.${c.slice(3)}`;
      if (c.length <= 9) return `${c.slice(0,3)}.${c.slice(3,6)}.${c.slice(6)}`;
      return `${c.slice(0,3)}.${c.slice(3,6)}.${c.slice(6,9)}-${c.slice(9)}`;
    } else {
      const c = d.slice(0, 14);
      if (c.length <= 2)  return c;
      if (c.length <= 5)  return `${c.slice(0,2)}.${c.slice(2)}`;
      if (c.length <= 8)  return `${c.slice(0,2)}.${c.slice(2,5)}.${c.slice(5)}`;
      if (c.length <= 12) return `${c.slice(0,2)}.${c.slice(2,5)}.${c.slice(5,8)}/${c.slice(8)}`;
      return `${c.slice(0,2)}.${c.slice(2,5)}.${c.slice(5,8)}/${c.slice(8,12)}-${c.slice(12)}`;
    }
  }

  maskCep(v: string): string {
    const d = v.replace(/\D/g, '').slice(0, 8);
    if (d.length <= 5) return d;
    return `${d.slice(0,5)}-${d.slice(5)}`;
  }

  onDocTypeChange() {
    this.form.document_value = '';
    this.form.birth_date     = '';
    this.form.company_type   = 'MEI';
  }

  canSave(): boolean {
    const bankOk = !!(this.bankForm.bank_code && this.bankForm.agency && this.bankForm.account && this.bankForm.account_digit);

    if (this.completionMode) return bankOk;

    const cpfOk  = this.form.document_type === 'CPF'
      && !!this.form.birth_date && this.form.birth_date <= this.today
      && !!this.form.mother_name
      && !!this.form.monthly_income
      && !!this.form.professional_occupation;
    const cnpjOk = this.form.document_type === 'CNPJ' && !!this.form.company_type;
    return !!(
      this.form.account_holder &&
      this.form.email          &&
      this.form.document_value &&
      this.form.pix_key_value  &&
      this.form.lgpd_consent   &&
      this.form.city           &&
      this.form.state          &&
      this.form.phone          &&
      this.form.address        &&
      (cpfOk || cnpjOk)
    );
  }

  async save() {
    this.saving  = true;
    this.error   = null;
    this.warning = null;
    try {
      // 1 — salva dados pessoais no DB
      if (!this.completionMode) {
        await this.financialService.save(this.form);
      }

      // 2 — dados bancários → cria recebedor no Pagar.me (só se todos os campos estiverem preenchidos)
      const bankComplete = !!(
        this.bankForm.bank_code   &&
        this.bankForm.account_type &&
        this.bankForm.agency      &&
        this.bankForm.account     &&
        this.bankForm.account_digit
      );
      if (bankComplete) {
        await this.financialService.saveBank(this.bankForm);
      }

      this.editing        = false;
      this.completionMode = false;
      this.resetForm();
      this.toast.show('Dados financeiros salvos com sucesso!');
    } catch (e: any) {
      this.error = e?.error?.error || 'Erro ao salvar dados financeiros';
    } finally {
      this.saving = false;
    }
  }

  resetForm() {
    this.form = {
      account_holder: '', email: '', phone: '',
      document_type: 'CPF', document_value: '',
      birth_date: '', company_type: 'MEI',
      mother_name: '', monthly_income: '', professional_occupation: '',
      address: '', address_number: '', complement: '', province: '', postal_code: '',
      city: '', state: '',
      pix_key_type: 'CPF', pix_key_value: '',
      lgpd_consent: false,
    };
    this.bankForm = { bank_code: '', account_type: 'CONTA_CORRENTE', agency: '', agency_digit: '', account: '', account_digit: '' };
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

  statusBadge(): string {
    const s = this.financialService.financial()?.status;
    if (s === 'ACTIVE')    return 'Ativo';
    if (s === 'SUSPENDED') return 'Suspenso';
    return 'Em análise';
  }

  statusLabel(): string {
    const s = this.financialService.financial()?.status;
    if (s === 'ACTIVE')    return 'Conta ativa — recebendo pagamentos';
    if (s === 'SUSPENDED') return 'Conta suspensa';
    return 'Verificação em andamento';
  }

  statusDesc(): string {
    const s = this.financialService.financial()?.status;
    if (s === 'ACTIVE')    return 'Seus clientes já podem pagar via app.';
    if (s === 'SUSPENDED') return 'Entre em contato com o suporte ArenaFlow.';
    return 'Seus dados foram enviados para verificação. A ativação ocorre automaticamente em até 1 dia útil.';
  }
}
