import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { ToastService } from '../../services/toast.service';
import { EstablishmentService } from '../../services/establishment.service';
import { EstablishmentProfile, ThemeId, CancellationPolicy } from '../../models/models';

interface ThemeOption {
  id: ThemeId;
  name: string;
  primary: string;
  secondary: string;
  sidebarBg: string;
  background: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto space-y-6">

      <!-- Header -->
      <div>
        <h1 class="text-2xl font-heading font-bold" style="color:var(--foreground)">Perfil do Estabelecimento</h1>
        <p class="text-sm mt-1" style="color:var(--muted-foreground)">Personalize as informações e a identidade visual da sua arena.</p>
      </div>

      <!-- Logo section -->
      <div class="card p-6">
        <h2 class="font-heading font-semibold text-base mb-4" style="color:var(--foreground)">Logo / Foto</h2>

        <div class="flex items-center gap-6">
          <!-- Avatar preview -->
          <div class="relative flex-shrink-0">
            <div class="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center"
                 style="background-color:var(--sidebar-primary);box-shadow:0 4px 16px rgba(34,197,94,0.3)">
              <img *ngIf="profile.logoUrl"
                   [src]="profile.logoUrl"
                   alt="Logo"
                   class="w-full h-full object-cover" />
              <span *ngIf="!profile.logoUrl"
                    class="text-white font-heading font-bold text-2xl">
                {{ initials }}
              </span>
            </div>
            <!-- Remove button -->
            <button *ngIf="profile.logoUrl"
                    (click)="removeLogo()"
                    class="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                    style="background-color:#ef4444;box-shadow:0 2px 6px rgba(239,68,68,0.4)"
                    title="Remover foto">
              <span class="material-icons" style="font-size:0.85rem">close</span>
            </button>
          </div>

          <!-- Upload area -->
          <div class="flex-1">
            <div class="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-150"
                 [class.drag-over]="isDragging"
                 style="border-color:var(--border)"
                 (click)="fileInput.click()"
                 (dragover)="onDragOver($event)"
                 (dragleave)="isDragging = false"
                 (drop)="onDrop($event)">
              <div class="mb-2" style="color:var(--muted-foreground)"><span class="material-icons" style="font-size:2rem">add_photo_alternate</span></div>
              <p class="text-sm font-medium" style="color:var(--foreground)">Clique ou arraste uma imagem</p>
              <p class="text-xs mt-1" style="color:var(--muted-foreground)">PNG, JPG, WEBP — máx. 5 MB</p>
            </div>
            <input #fileInput type="file" accept="image/*" class="hidden" (change)="onFileSelected($event)" />

            <p *ngIf="errorMsg" class="text-xs mt-2" style="color:#ef4444">{{ errorMsg }}</p>
          </div>
        </div>
      </div>

      <!-- Theme section -->
      <div class="card p-6">
        <h2 class="font-heading font-semibold text-base mb-1" style="color:var(--foreground)">Tema de Cores</h2>
        <p class="text-xs mb-4" style="color:var(--muted-foreground)">Escolha o esquema de cores do sistema</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button *ngFor="let t of themes"
                  (click)="selectTheme(t.id)"
                  class="relative rounded-xl border-2 p-3 text-left transition-all hover:shadow-md"
                  [style.border-color]="isActiveTheme(t.id) ? t.primary : 'var(--border)'"
                  [style.background]="isActiveTheme(t.id) ? t.background : 'var(--card)'">
            <!-- Mini app preview -->
            <div class="flex rounded-lg overflow-hidden mb-2.5" style="height:44px">
              <div class="w-7 flex-shrink-0" [style.background]="t.sidebarBg">
                <div class="mt-2 mx-1.5 rounded h-1.5 opacity-60" [style.background]="t.primary"></div>
                <div class="mt-1 mx-1.5 rounded h-1 opacity-30" style="background:white"></div>
                <div class="mt-1 mx-1.5 rounded h-1 opacity-30" style="background:white"></div>
              </div>
              <div class="flex-1 flex flex-col gap-1 p-1.5" [style.background]="t.background">
                <div class="rounded h-2" [style.background]="t.primary"></div>
                <div class="rounded h-1.5 opacity-30" style="background:#aaa;width:75%"></div>
                <div class="rounded h-1.5 opacity-20" style="background:#aaa;width:55%"></div>
              </div>
            </div>
            <!-- Name + color dots -->
            <div class="font-heading font-semibold text-xs mb-1.5" style="color:var(--foreground)">{{ t.name }}</div>
            <div class="flex items-center gap-1.5">
              <div class="w-3.5 h-3.5 rounded-full border border-white shadow-sm" [style.background]="t.primary"></div>
              <div class="w-3.5 h-3.5 rounded-full border border-white shadow-sm" [style.background]="t.secondary"></div>
            </div>
            <!-- Active checkmark -->
            <div *ngIf="isActiveTheme(t.id)"
                 class="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center shadow"
                 [style.background]="t.primary">
              <span class="material-icons" style="font-size:0.7rem;color:white">check</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Info section -->
      <div class="card p-6">

        <!-- Section header -->
        <div class="flex items-center gap-3 mb-5">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
               style="background:hsl(152,69%,40%,0.1);color:var(--primary)">
            <span class="material-icons" style="font-size:1.1rem">business</span>
          </div>
          <div>
            <h2 class="font-heading font-semibold text-base leading-tight" style="color:var(--foreground)">Informações</h2>
            <p class="text-xs" style="color:var(--muted-foreground)">Dados públicos do estabelecimento</p>
          </div>
        </div>

        <div class="space-y-3">

          <!-- Nome -->
          <div>
            <label class="info-label">Nome do estabelecimento <span style="color:var(--destructive)">*</span></label>
            <div class="info-input-wrap">
              <span class="material-icons info-icon">storefront</span>
              <input class="input info-input" [(ngModel)]="form.name" placeholder="Ex: Arena Beach Mais" />
            </div>
          </div>

          <!-- Telefone + E-mail -->
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label class="info-label">Telefone</label>
              <div class="info-input-wrap">
                <span class="material-icons info-icon">phone</span>
                <input class="input info-input" [(ngModel)]="form.phone"
                       placeholder="(00) 00000-0000" maxlength="15"
                       (input)="onPhoneInput($event)" />
              </div>
            </div>
            <div>
              <label class="info-label">E-mail</label>
              <div class="info-input-wrap">
                <span class="material-icons info-icon">mail_outline</span>
                <input class="input info-input" [(ngModel)]="form.email"
                       type="email" placeholder="contato@arena.com" />
              </div>
            </div>
          </div>

          <!-- Endereço -->
          <div>
            <label class="info-label">Endereço</label>
            <div class="info-input-wrap">
              <span class="material-icons info-icon">location_on</span>
              <input class="input info-input" [(ngModel)]="form.address" placeholder="Rua, número, bairro" />
            </div>
          </div>

          <!-- Cidade -->
          <div>
            <label class="info-label">Cidade</label>
            <div class="info-input-wrap">
              <span class="material-icons info-icon">map</span>
              <input class="input info-input" [(ngModel)]="form.city" placeholder="São Paulo - SP" />
            </div>
          </div>

        </div>

        <div class="flex justify-end pt-4 mt-2" style="border-top:1px solid var(--border)">
          <button class="btn-primary px-6 py-2 text-sm font-medium rounded-xl"
                  [disabled]="savingInfo"
                  (click)="saveInfo()">
            <span *ngIf="savingInfo" class="material-icons" style="font-size:0.9rem;animation:spin 1s linear infinite;vertical-align:middle;margin-right:4px">refresh</span>
            {{ savingInfo ? 'Salvando...' : 'Salvar informações' }}
          </button>
        </div>
      </div>

      <!-- Política de Cancelamento -->
      <div class="card p-6">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
               style="background:hsl(0,84%,60%,0.1);color:var(--destructive)">
            <span class="material-icons" style="font-size:1.1rem">policy</span>
          </div>
          <div>
            <h2 class="font-heading font-semibold text-base leading-tight" style="color:var(--foreground)">Política de Cancelamento</h2>
            <p class="text-xs" style="color:var(--muted-foreground)">Define as regras para cancelamento de reservas pelos clientes</p>
          </div>
        </div>

        <div class="space-y-4">

          <!-- Tempo limite -->
          <div>
            <label class="info-label">Cancelamento gratuito até</label>
            <select class="input" [(ngModel)]="cancelPolicy.limit_hours">
              <option [ngValue]="0">Sempre gratuito (sem limite de tempo)</option>
              <option [ngValue]="1">1 hora antes do horário</option>
              <option [ngValue]="2">2 horas antes do horário</option>
              <option [ngValue]="3">3 horas antes do horário</option>
              <option [ngValue]="6">6 horas antes do horário</option>
              <option [ngValue]="12">12 horas antes do horário</option>
              <option [ngValue]="24">24 horas antes do horário</option>
            </select>
          </div>

          <!-- Taxa após o limite -->
          <div *ngIf="cancelPolicy.limit_hours > 0">
            <label class="info-label">Taxa cobrada após o limite</label>
            <div class="grid grid-cols-4 gap-2">
              <button *ngFor="let fee of feePcts"
                      (click)="cancelPolicy.fee_percent = fee"
                      class="py-2.5 rounded-xl text-sm font-heading font-bold border-2 transition-all"
                      [style.border-color]="cancelPolicy.fee_percent === fee ? 'var(--primary)' : 'var(--border)'"
                      [style.background]="cancelPolicy.fee_percent === fee ? 'hsl(152,69%,40%,0.08)' : 'var(--card)'"
                      [style.color]="cancelPolicy.fee_percent === fee ? 'var(--primary)' : 'var(--muted-foreground)'">
                {{ fee === 0 ? 'Grátis' : fee + '%' }}
              </button>
            </div>
          </div>

          <!-- Resumo -->
          <div class="rounded-xl p-3 flex items-start gap-2" style="background:var(--muted)">
            <span class="material-icons flex-shrink-0" style="font-size:0.95rem;color:var(--primary);margin-top:1px">info</span>
            <p class="text-xs leading-relaxed" style="color:var(--muted-foreground)">{{ cancelPolicySummary }}</p>
          </div>

        </div>

        <div class="flex justify-end pt-4 mt-2" style="border-top:1px solid var(--border)">
          <button class="btn-primary px-6 py-2 text-sm font-medium rounded-xl" (click)="saveCancelPolicy()">
            Salvar política
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .drag-over {
      border-color: var(--primary) !important;
      background-color: rgba(34,197,94,0.05);
    }
    .info-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 0.375rem;
      color: var(--foreground);
      opacity: 0.8;
    }
    .info-input-wrap {
      position: relative;
    }
    .info-icon {
      position: absolute;
      left: 0.65rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1rem !important;
      color: var(--muted-foreground);
      pointer-events: none;
      z-index: 1;
    }
    .info-input {
      padding-left: 2.25rem !important;
      background-color: var(--input-bg) !important;
      height: 2.6rem;
    }
  `]
})
export class PerfilComponent implements OnInit {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  profile!: EstablishmentProfile;
  form: Omit<EstablishmentProfile, 'logoUrl' | 'theme'> = { name: '', phone: '', email: '', address: '', city: '' };
  isDragging = false;
  errorMsg = '';

  cancelPolicy: CancellationPolicy = { limit_hours: 1, fee_percent: 0 };
  feePcts = [0, 25, 50, 100];

  get cancelPolicySummary(): string {
    const h = this.cancelPolicy.limit_hours;
    const f = this.cancelPolicy.fee_percent;
    if (h === 0) return 'Clientes podem cancelar a qualquer momento sem custo.';
    if (f === 0) return `Cancelamento gratuito até ${h}h antes do horário. Após esse prazo, o cancelamento ainda é gratuito.`;
    return `Cancelamento gratuito até ${h}h antes do horário. Após esse prazo, será cobrada uma taxa de ${f}% do valor já pago.`;
  }

  saveCancelPolicy(): void {
    localStorage.setItem('arenaflow_cancel_policy', JSON.stringify(this.cancelPolicy));
    this.toast.show('Política de cancelamento salva!');
  }

  themes: ThemeOption[] = [
    { id: 'base',     name: 'Verde Padrão', primary: '#22a55c', secondary: '#f0fdf4', sidebarBg: '#111c15', background: '#f5faf6' },
    { id: 'lima',     name: 'Lima',         primary: '#A2D729', secondary: '#FAFFFD', sidebarBg: '#1c280a', background: '#FAFFFD' },
    { id: 'sage',     name: 'Sage',         primary: '#5B7553', secondary: '#8EB897', sidebarBg: '#1a2419', background: '#f4f8f4' },
    { id: 'dark-red', name: 'Dark & Red',   primary: '#F24333', secondary: '#564D4A', sidebarBg: '#1e1816', background: '#faf8f7' },
  ];

  isActiveTheme(id: ThemeId): boolean {
    return (this.profile?.theme ?? 'base') === id;
  }

  selectTheme(id: ThemeId): void {
    this.profileService.updateProfile({ theme: id });
    this.toast.show('Tema atualizado!');
  }

  constructor(
    private profileService: ProfileService,
    private toast: ToastService,
    private establishmentService: EstablishmentService,
  ) {}

  ngOnInit() {
    this.profile = this.profileService.getProfile();
    this.form = {
      name: this.profile.name,
      phone: this.profile.phone || '',
      email: this.profile.email || '',
      address: this.profile.address || '',
      city: this.profile.city || '',
    };
    this.profileService.profile$.subscribe(p => this.profile = p);
    const stored = localStorage.getItem('arenaflow_cancel_policy');
    if (stored) this.cancelPolicy = { ...this.cancelPolicy, ...JSON.parse(stored) };
  }

  get initials(): string {
    return (this.profile.name || 'AF').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  onPhoneInput(event: Event) {
    const el = event.target as HTMLInputElement;
    const d = el.value.replace(/\D/g, '').slice(0, 11);
    let masked = '';
    if (d.length === 0)       masked = '';
    else if (d.length <= 2)   masked = `(${d}`;
    else if (d.length <= 6)   masked = `(${d.slice(0,2)}) ${d.slice(2)}`;
    else if (d.length <= 10)  masked = `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    else                      masked = `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    el.value = masked;
    this.form.phone = masked;
  }

  savingInfo = false;

  async saveInfo() {
    if (!this.form.name.trim()) {
      this.toast.show('O nome do estabelecimento é obrigatório.');
      return;
    }
    this.savingInfo = true;
    try {
      // Salva localmente (sidebar, tema, etc.)
      this.profileService.updateProfile({ ...this.form });
      // Sincroniza com a API: logo atual
      await this.establishmentService.syncLogo(this.profile.logoUrl ?? null);
      this.toast.show('Informações salvas com sucesso!');
    } catch {
      this.toast.show('Erro ao salvar. Tente novamente.');
    } finally {
      this.savingInfo = false;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.processFile(input.files[0]);
      input.value = '';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  private processFile(file: File) {
    this.errorMsg = '';
    if (!file.type.startsWith('image/')) {
      this.errorMsg = 'O arquivo selecionado não é uma imagem.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorMsg = 'A imagem deve ter no máximo 5 MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      // Salva apenas localmente — a sync com a API ocorre no botão Salvar
      this.profileService.updateLogo(base64);
      this.toast.show('Foto carregada! Clique em "Salvar informações" para confirmar.');
    };
    reader.readAsDataURL(file);
  }

  removeLogo() {
    this.profileService.removeLogo();
    this.toast.show('Foto removida. Clique em "Salvar informações" para confirmar.');
  }
}
