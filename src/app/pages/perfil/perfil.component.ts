import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener, NgZone } from '@angular/core';
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

          <!-- CEP -->
          <div>
            <label class="info-label">CEP</label>
            <div class="info-input-wrap" style="position:relative">
              <span class="material-icons info-icon">pin_drop</span>
              <input class="input info-input" [value]="cep" placeholder="00000-000" maxlength="9"
                     style="padding-right:2rem"
                     (input)="onCepInput($event)" />
              <span *ngIf="cepLoading" class="material-icons"
                    style="position:absolute;right:0.7rem;top:50%;transform:translateY(-50%);font-size:1rem;color:var(--muted-foreground);animation:spin 1s linear infinite">
                refresh
              </span>
            </div>
            <p *ngIf="cepError" class="text-xs mt-1" style="color:var(--destructive)">{{ cepError }}</p>
          </div>

          <!-- Rua + Número -->
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]" style="grid-template-columns:1fr 90px">
            <div>
              <label class="info-label">Logradouro</label>
              <div class="info-input-wrap">
                <span class="material-icons info-icon">location_on</span>
                <input class="input info-input" [(ngModel)]="street"
                       placeholder="Rua, Avenida..." (ngModelChange)="updateAddress()" />
              </div>
            </div>
            <div>
              <label class="info-label">Número</label>
              <div class="info-input-wrap">
                <input class="input info-input" [(ngModel)]="houseNumber"
                       placeholder="Nº" style="padding-left:0.75rem"
                       (ngModelChange)="updateAddress()" />
              </div>
            </div>
          </div>

          <!-- Bairro + Cidade -->
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label class="info-label">Bairro</label>
              <div class="info-input-wrap">
                <span class="material-icons info-icon">holiday_village</span>
                <input class="input info-input" [(ngModel)]="form.neighborhood" placeholder="Bairro" />
              </div>
            </div>
            <div>
              <label class="info-label">Cidade</label>
              <div class="info-input-wrap">
                <span class="material-icons info-icon">map</span>
                <input class="input info-input" [(ngModel)]="form.city" placeholder="Cidade - UF" />
              </div>
            </div>
          </div>

          <!-- Horário de funcionamento -->
          <div class="hours-block">
            <div class="flex items-center justify-between mb-3">
              <label class="info-label" style="margin-bottom:0">
                <span class="material-icons" style="font-size:0.9rem;vertical-align:middle;margin-right:4px;color:var(--primary)">schedule</span>
                Horário de funcionamento
              </label>
              <span class="hours-badge">
                <span class="material-icons" style="font-size:0.8rem">timelapse</span>
                {{ hoursOperatingLabel }}
              </span>
            </div>

            <!-- Inputs abertura/fechamento -->
            <div class="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label class="hours-sub-label">Abertura</label>
                <div class="info-input-wrap">
                  <span class="material-icons info-icon">wb_sunny</span>
                  <input class="input info-input" type="time"
                         [(ngModel)]="openHoursStart"
                         (ngModelChange)="onHoursChange()" />
                </div>
              </div>
              <div>
                <label class="hours-sub-label">Fechamento</label>
                <div class="info-input-wrap">
                  <span class="material-icons info-icon">nightlight_round</span>
                  <input class="input info-input" type="time"
                         [(ngModel)]="openHoursEnd"
                         (ngModelChange)="onHoursChange()" />
                </div>
              </div>
            </div>

            <!-- Timeline 24h interativa -->
            <div class="timeline-track" #timelineTrack>

              <!-- Fundo inativo esquerdo -->
              <div class="timeline-bg"
                   [style.width.%]="startPct"></div>

              <!-- Faixa ativa -->
              <div class="timeline-fill"
                   [class.dragging]="!!dragging"
                   [style.left.%]="startPct"
                   [style.width.%]="widthPct"></div>

              <!-- Marcas de referência -->
              <div class="timeline-tick" style="left:25%"></div>
              <div class="timeline-tick" style="left:50%"></div>
              <div class="timeline-tick" style="left:75%"></div>

              <!-- Handle abertura -->
              <div class="timeline-handle"
                   [class.active]="dragging === 'start'"
                   [style.left.%]="startPct"
                   (mousedown)="startDrag('start', $event)"
                   (touchstart)="startDrag('start', $event)">
                <div class="handle-tooltip">{{ openHoursStart }}</div>
              </div>

              <!-- Handle fechamento -->
              <div class="timeline-handle"
                   [class.active]="dragging === 'end'"
                   [style.left.%]="startPct + widthPct"
                   (mousedown)="startDrag('end', $event)"
                   (touchstart)="startDrag('end', $event)">
                <div class="handle-tooltip">{{ openHoursEnd }}</div>
              </div>

            </div>

            <!-- Labels 24h -->
            <div class="timeline-labels">
              <span>00h</span>
              <span>06h</span>
              <span>12h</span>
              <span>18h</span>
              <span>24h</span>
            </div>

            <!-- Resumo -->
            <div class="hours-summary">
              <span class="material-icons" style="font-size:0.9rem;color:var(--primary)">info</span>
              Abre às <strong>{{ openHoursStart }}</strong> e fecha às <strong>{{ openHoursEnd }}</strong>
              — <strong>{{ hoursOperatingLabel }}</strong> por dia.
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
            <div class="info-input-wrap">
              <span class="material-icons info-icon">timer</span>
              <input class="input info-input"
                     style="font-variant-numeric:tabular-nums;letter-spacing:0.06em;font-family:monospace"
                     [value]="limitHoursDisplay"
                     placeholder="00:00:00"
                     maxlength="10"
                     (input)="onLimitHoursInput($event)"
                     (focus)="onLimitHoursFocus($event)" />
            </div>
            <p class="text-xs mt-1.5" style="color:var(--muted-foreground)">
              <span class="material-icons" style="font-size:0.7rem;vertical-align:middle">info</span>
              Digite o número de horas antes do início — <strong style="color:var(--foreground)">00:00:00</strong> = sempre gratuito
            </p>
          </div>

          <!-- Taxa após o limite -->
          <div *ngIf="cancelPolicy.limit_hours > 0">
            <label class="info-label">Taxa cobrada após o limite</label>
            <div class="info-input-wrap">
              <span class="material-icons info-icon">percent</span>
              <input class="input info-input"
                     style="font-variant-numeric:tabular-nums;letter-spacing:0.04em;font-family:monospace"
                     [value]="feePctDisplay"
                     placeholder="0%"
                     maxlength="4"
                     (input)="onFeePctInput($event)"
                     (focus)="onFeePctFocus($event)" />
            </div>
            <p class="text-xs mt-1.5" style="color:var(--muted-foreground)">
              <span class="material-icons" style="font-size:0.7rem;vertical-align:middle">info</span>
              <strong style="color:var(--foreground)">0%</strong> = cancelamento gratuito mesmo fora do prazo ·
              <strong style="color:var(--foreground)">100%</strong> = valor total retido
            </p>
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
    .hours-block {
      margin-top: 0.5rem;
      padding-top: 1rem;
      border-top: 1px dashed var(--border);
    }
    .hours-sub-label {
      display: block;
      font-size: 0.7rem;
      font-weight: 600;
      margin-bottom: 0.3rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--muted-foreground);
    }
    .hours-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
      background: hsl(152, 69%, 40%, 0.12);
      color: var(--primary);
      border: 1px solid hsl(152, 69%, 40%, 0.25);
    }
    .timeline-track {
      position: relative;
      height: 14px;
      border-radius: 9999px;
      background: var(--muted);
      margin: 1.4rem 0 0.5rem;
      cursor: default;
      user-select: none;
      -webkit-user-select: none;
    }
    .timeline-bg {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      border-radius: 9999px 0 0 9999px;
      background: var(--muted);
      pointer-events: none;
    }
    .timeline-fill {
      position: absolute;
      top: 0;
      bottom: 0;
      border-radius: 0;
      background: linear-gradient(
        90deg,
        hsl(152, 69%, 50%) 0%,
        hsl(152, 69%, 42%) 100%
      );
      box-shadow: 0 2px 10px rgba(34, 197, 94, 0.4);
      transition: left 0.06s ease, width 0.06s ease;
      pointer-events: none;
    }
    .timeline-fill.dragging {
      transition: none;
    }
    .timeline-tick {
      position: absolute;
      top: 2px;
      bottom: 2px;
      width: 1.5px;
      background: rgba(255,255,255,0.35);
      transform: translateX(-50%);
      pointer-events: none;
      border-radius: 9999px;
    }
    .timeline-handle {
      position: absolute;
      top: 50%;
      width: 22px;
      height: 22px;
      border-radius: 9999px;
      background: #fff;
      border: 3px solid var(--primary);
      transform: translate(-50%, -50%);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
      cursor: grab;
      transition: left 0.06s ease, box-shadow 0.15s ease, transform 0.15s ease;
      touch-action: none;
      z-index: 2;
    }
    .timeline-handle:hover,
    .timeline-handle.active {
      box-shadow: 0 0 0 5px hsl(152, 69%, 40%, 0.18), 0 3px 10px rgba(0,0,0,0.2);
      transform: translate(-50%, -50%) scale(1.15);
    }
    .timeline-handle.active {
      cursor: grabbing;
      transition: none;
    }
    .handle-tooltip {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--foreground);
      color: var(--background, #fff);
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.2rem 0.45rem;
      border-radius: 0.35rem;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    .handle-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 4px solid transparent;
      border-top-color: var(--foreground);
    }
    .timeline-handle:hover .handle-tooltip,
    .timeline-handle.active .handle-tooltip {
      opacity: 1;
    }
    .timeline-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--muted-foreground);
      letter-spacing: 0.03em;
      padding: 0 4px;
      margin-top: 0.3rem;
    }
    .hours-summary {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 0.85rem;
      padding: 0.55rem 0.75rem;
      border-radius: 0.65rem;
      background: var(--muted);
      font-size: 0.75rem;
      color: var(--muted-foreground);
    }
    .hours-summary strong {
      color: var(--foreground);
      font-weight: 700;
    }
  `]
})
export class PerfilComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput')     fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('timelineTrack') trackRef!: ElementRef<HTMLDivElement>;

  profile!: EstablishmentProfile;
  form: Omit<EstablishmentProfile, 'logoUrl' | 'theme'> = { name: '', phone: '', email: '', address: '', neighborhood: '', city: '' };

  // CEP lookup state (não persistido diretamente no banco)
  cep = '';
  street = '';
  houseNumber = '';
  cepLoading = false;
  cepError = '';
  isDragging = false;
  errorMsg = '';

  cancelPolicy: CancellationPolicy = { limit_hours: 0, fee_percent: 0 };

  // Displays formatados para os inputs de máscara
  limitHoursDisplay = '00:00:00';
  feePctDisplay = '0%';

  private formatLimitHours(h: number): string {
    return `${String(h).padStart(2, '0')}:00:00`;
  }

  onLimitHoursInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const raw = el.value.replace(/\D/g, '');
    const num = raw === '' ? 0 : Math.min(999, parseInt(raw, 10));
    this.cancelPolicy.limit_hours = num;
    this.limitHoursDisplay = this.formatLimitHours(num);
    el.value = this.limitHoursDisplay;
    // Posiciona cursor após os dígitos de horas
    const cursor = String(num).padStart(2, '0').length;
    try { el.setSelectionRange(cursor, cursor); } catch {}
  }

  onLimitHoursFocus(event: Event): void {
    // Seleciona só a parte das horas ao focar
    const el = event.target as HTMLInputElement;
    const cursor = String(this.cancelPolicy.limit_hours).padStart(2, '0').length;
    setTimeout(() => { try { el.setSelectionRange(0, cursor); } catch {} });
  }

  onFeePctInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const raw = el.value.replace(/\D/g, '');
    const num = raw === '' ? 0 : Math.min(100, parseInt(raw, 10));
    this.cancelPolicy.fee_percent = num;
    this.feePctDisplay = `${num}%`;
    el.value = this.feePctDisplay;
    const cursor = String(num).length;
    try { el.setSelectionRange(cursor, cursor); } catch {}
  }

  onFeePctFocus(event: Event): void {
    const el = event.target as HTMLInputElement;
    const cursor = String(this.cancelPolicy.fee_percent).length;
    setTimeout(() => { try { el.setSelectionRange(0, cursor); } catch {} });
  }

  // ─── Horário de funcionamento ──────────────────────────────────────────────
  openHoursStart = '07:00';
  openHoursEnd   = '23:00';
  dragging: 'start' | 'end' | null = null;

  private toMinutes(hhmm: string): number {
    const [h, m] = (hhmm || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  private minutesToHhmm(min: number): string {
    const clamped = Math.max(0, Math.min(1440, min));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /** Converte clientX para minutos (snap a 30 min) */
  private clientXToMinutes(clientX: number): number {
    if (!this.trackRef) return 0;
    const rect = this.trackRef.nativeElement.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round((pct * 1440) / 30) * 30; // snap 30 min
  }

  get startPct(): number {
    return Math.max(0, Math.min(100, (this.toMinutes(this.openHoursStart) / 1440) * 100));
  }

  get widthPct(): number {
    const s    = this.toMinutes(this.openHoursStart);
    const e    = this.toMinutes(this.openHoursEnd);
    const diff = Math.max(0, e - s);
    return Math.max(0, Math.min(100 - this.startPct, (diff / 1440) * 100));
  }

  get hoursOperatingLabel(): string {
    const diff = this.toMinutes(this.openHoursEnd) - this.toMinutes(this.openHoursStart);
    if (diff <= 0) return 'Horário inválido';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
  }

  onHoursChange(): void { /* inputs digitados — getters recomputed automatically */ }

  /** Inicia drag (mouse ou touch) */
  startDrag(which: 'start' | 'end', event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    this.dragging = which;
  }

  /** Move durante o drag */
  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onDragMove(event: MouseEvent | TouchEvent): void {
    if (!this.dragging) return;
    event.preventDefault();
    const clientX = event instanceof MouseEvent
      ? event.clientX
      : event.touches[0].clientX;
    const mins = this.clientXToMinutes(clientX);
    this.zone.run(() => {
      if (this.dragging === 'start') {
        const endMins = this.toMinutes(this.openHoursEnd);
        // Garante mínimo de 30 min de abertura, máximo 30 min antes do fechamento
        this.openHoursStart = this.minutesToHhmm(Math.min(mins, endMins - 30));
      } else {
        const startMins = this.toMinutes(this.openHoursStart);
        // Garante mínimo de 30 min após abertura, máximo 24:00
        this.openHoursEnd = this.minutesToHhmm(Math.max(mins, startMins + 30));
      }
    });
  }

  /** Finaliza drag */
  @HostListener('document:mouseup')
  @HostListener('document:touchend')
  stopDrag(): void {
    this.dragging = null;
  }

  ngOnDestroy(): void {
    this.dragging = null;
  }

  get cancelPolicySummary(): string {
    const h = this.cancelPolicy.limit_hours;
    const f = this.cancelPolicy.fee_percent;
    const hLabel = this.formatLimitHours(h);
    if (h === 0) return 'Clientes podem cancelar a qualquer momento sem custo.';
    if (f === 0) return `Cancelamento gratuito até ${hLabel} (${h}h) antes do horário. Fora do prazo, ainda é gratuito.`;
    return `Cancelamento gratuito até ${hLabel} (${h}h) antes do horário. Fora do prazo, taxa de ${f}% sobre o valor já pago.`;
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
    private zone: NgZone,
  ) {}

  ngOnInit() {
    this.profileService.profile$.subscribe(p => {
      this.profile = p;
      this.form = {
        name: p.name,
        phone: p.phone || '',
        email: p.email || '',
        address: p.address || '',
        neighborhood: p.neighborhood || '',
        city: p.city || '',
      };
      // Restaura campos separados persistidos no localStorage
      this.street      = p.street      || '';
      this.houseNumber = p.houseNumber || '';
      this.cep         = p.cep         || '';
    });

    // Carrega o horário de funcionamento do estabelecimento (se existir)
    const est = this.establishmentService.establishment();
    if (est?.open_hours) {
      const parsed = this.parseOpenHours(est.open_hours);
      if (parsed) {
        this.openHoursStart = parsed.start;
        this.openHoursEnd   = parsed.end;
      }
    }

    const stored = localStorage.getItem('arenaflow_cancel_policy');
    if (stored) this.cancelPolicy = { ...this.cancelPolicy, ...JSON.parse(stored) };
    this.limitHoursDisplay = this.formatLimitHours(this.cancelPolicy.limit_hours);
    this.feePctDisplay = `${this.cancelPolicy.fee_percent}%`;
  }

  private parseOpenHours(value: string): { start: string; end: string } | null {
    const match = value.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
    if (!match) return null;
    return { start: match[1], end: match[2] };
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

  onCepInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const d = el.value.replace(/\D/g, '').slice(0, 8);
    const masked = d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
    el.value = masked;
    this.cep = masked;
    this.cepError = '';
    if (d.length === 8) {
      this.lookupCep(d);
    }
  }

  async lookupCep(raw: string): Promise<void> {
    this.cepLoading = true;
    this.cepError = '';
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const data = await res.json();
      if (data.erro) {
        this.cepError = 'CEP não encontrado';
        return;
      }
      this.street = data.logradouro || '';
      this.form.neighborhood = data.bairro || '';
      this.form.city = data.localidade && data.uf ? `${data.localidade} - ${data.uf}` : (data.localidade || '');
      this.updateAddress();
    } catch {
      this.cepError = 'Erro ao buscar CEP';
    } finally {
      this.cepLoading = false;
    }
  }

  updateAddress(): void {
    const parts = [this.street, this.houseNumber].filter(s => s.trim());
    this.form.address = parts.join(', ');
  }

  savingInfo = false;

  async saveInfo() {
    if (!this.form.name.trim()) {
      this.toast.show('O nome do estabelecimento é obrigatório.');
      return;
    }
    // Validação do horário
    if (this.toMinutes(this.openHoursEnd) <= this.toMinutes(this.openHoursStart)) {
      this.toast.show('O horário de fechamento deve ser posterior ao de abertura.');
      return;
    }

    this.savingInfo = true;
    try {
      // Salva localmente (sidebar, tema, etc.) — inclui campos separados de endereço
      this.profileService.updateProfile({
        ...this.form,
        street:      this.street,
        houseNumber: this.houseNumber,
        cep:         this.cep,
      });
      // Sincroniza com a API: perfil completo + logo atual
      await this.establishmentService.syncProfile({
        name:         this.form.name         || undefined,
        phone:        this.form.phone        || undefined,
        address:      this.form.address      || undefined,
        neighborhood: this.form.neighborhood || undefined,
        city:         this.form.city         || undefined,
        open_hours:   `${this.openHoursStart} - ${this.openHoursEnd}`,
        logo_url:     this.profile.logoUrl   ?? null,
      });
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
