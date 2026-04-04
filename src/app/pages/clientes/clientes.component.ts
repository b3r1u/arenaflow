import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { Client, Booking, Court } from '../../models/models';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="font-heading font-bold text-2xl lg:text-3xl" style="color: var(--foreground)">Clientes</h1>
          <p class="text-sm mt-1" style="color: var(--muted-foreground)">{{ clients.length }} clientes cadastrados</p>
        </div>
        <button class="btn-primary" (click)="openModal()">
          <span>+</span> Novo Cliente
        </button>
      </div>

      <!-- Search -->
      <div class="relative mb-5">
        <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2" style="font-size:1.1rem;color: var(--muted-foreground)">search</span>
        <input class="input" style="padding-left:2.25rem" [(ngModel)]="search" placeholder="Buscar por nome ou telefone...">
      </div>

      <!-- Two-column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <!-- Client list -->
        <div class="lg:col-span-2 space-y-3">
          <div *ngFor="let client of filteredClients"
               class="card p-4 cursor-pointer transition-all"
               [class.shadow-md]="selectedClient?.id === client.id"
               [style.border-color]="selectedClient?.id === client.id ? 'var(--primary)' : ''"
               (click)="selectClient(client)">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-bold text-sm flex-shrink-0"
                   style="background-color: hsl(152,69%,40%,0.1); color: var(--primary)">
                {{ client.name.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm truncate" style="color: var(--foreground)">{{ client.name }}</div>
                <div class="text-xs flex items-center gap-1 mt-0.5" style="color: var(--muted-foreground)">
                  <span class="material-icons" style="font-size:0.9rem">phone</span> {{ client.phone }}
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="font-heading font-bold text-sm" style="color: var(--primary)">
                  R\${{ getClientTotalSpent(client.name) | number:'1.0-0' }}
                </div>
                <div class="text-xs" style="color: var(--muted-foreground)">
                  {{ getClientBookings(client.name).length }} reservas
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="filteredClients.length === 0" class="text-center py-12" style="color: var(--muted-foreground)">
            <div class="mb-2" style="color:var(--border)"><span class="material-icons" style="font-size:2.5rem">group</span></div>
            <p class="text-sm">Nenhum cliente encontrado</p>
          </div>
        </div>

        <!-- Detail panel -->
        <div class="lg:col-span-3">
          <div class="card p-5 sticky top-4">
            <ng-container *ngIf="selectedClient; else noSelection">
              <div class="flex items-center justify-between mb-5">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center font-heading font-bold text-lg"
                       style="background-color: hsl(152,69%,40%,0.1); color: var(--primary)">
                    {{ selectedClient.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <h3 class="font-heading font-bold text-lg" style="color: var(--foreground)">{{ selectedClient.name }}</h3>
                    <p class="text-sm" style="color: var(--muted-foreground)">{{ selectedClient.phone }}</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button class="btn-ghost p-1.5" (click)="editClient(selectedClient)"><span class="material-icons" style="font-size:1.1rem">edit</span></button>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 mb-5">
                <div class="p-3 rounded-xl" style="background-color: var(--muted)">
                  <div class="text-xs mb-1" style="color: var(--muted-foreground)">Total gasto</div>
                  <div class="font-heading font-bold text-lg" style="color: var(--primary)">
                    R\${{ getClientTotalSpent(selectedClient.name) | number:'1.0-0' }}
                  </div>
                </div>
                <div class="p-3 rounded-xl" style="background-color: var(--muted)">
                  <div class="text-xs mb-1" style="color: var(--muted-foreground)">Reservas</div>
                  <div class="font-heading font-bold text-lg" style="color: var(--foreground)">
                    {{ getClientBookings(selectedClient.name).length }}
                  </div>
                </div>
              </div>

              <h4 class="font-heading font-semibold text-sm mb-3" style="color: var(--foreground)">Histórico de Reservas</h4>
              <div class="space-y-2 max-h-64 overflow-y-auto">
                <div *ngFor="let b of getClientBookings(selectedClient.name)"
                     class="flex items-center gap-3 p-3 rounded-xl"
                     style="background-color: var(--muted)">
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium" style="color: var(--foreground)">{{ getCourtName(b.court_id) }}</div>
                    <div class="text-xs" style="color: var(--muted-foreground)">{{ b.date | date:'dd/MM/yy' }} · {{ b.start_hour }}-{{ b.end_hour }}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-heading font-semibold text-sm" style="color: var(--foreground)">R\${{ b.total_amount }}</div>
                    <span class="badge text-xs" [ngClass]="getPaymentClass(b.payment_status)">{{ b.payment_status }}</span>
                  </div>
                </div>
                <div *ngIf="getClientBookings(selectedClient.name).length === 0"
                     class="text-center py-6 text-sm" style="color: var(--muted-foreground)">Sem reservas</div>
              </div>
            </ng-container>
            <ng-template #noSelection>
              <div class="flex flex-col items-center justify-center py-16" style="color: var(--muted-foreground)">
                <div class="mb-3" style="color:var(--border)"><span class="material-icons" style="font-size:3rem">group</span></div>
                <p class="text-sm">Selecione um cliente para ver detalhes</p>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="showModal" class="modal-overlay" (click)="closeModal($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-heading font-bold text-lg" style="color: var(--foreground)">
            {{ editingId ? 'Editar Cliente' : 'Novo Cliente' }}
          </h2>
          <button class="btn-ghost p-1" (click)="closeModal()"><span class="material-icons" style="font-size:1.1rem">close</span></button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Nome *</label>
            <input class="input" [(ngModel)]="form.name" placeholder="Ex: Lucas Silva">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Telefone *</label>
            <input class="input" [(ngModel)]="form.phone" placeholder="(99) 99999-9999">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Email</label>
            <input class="input" type="email" [(ngModel)]="form.email" placeholder="email@exemplo.com">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--foreground)">Observações</label>
            <textarea class="textarea" [(ngModel)]="form.notes" placeholder="Observações..." rows="2"></textarea>
          </div>
        </div>
        <div *ngIf="error" class="mt-3 p-3 rounded-xl text-sm" style="background-color: hsl(0,84%,60%,0.1); color: var(--destructive)">{{ error }}</div>
        <div class="flex gap-3 mt-6">
          <button class="btn-outline flex-1" (click)="closeModal()">Cancelar</button>
          <button *ngIf="editingId" class="btn-outline flex-1" style="border-color: var(--destructive); color: var(--destructive)" (click)="deleteClient()">Excluir</button>
          <button class="btn-primary flex-1" (click)="saveClient()">
            {{ editingId ? 'Salvar' : 'Cadastrar' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ClientesComponent implements OnInit {
  clients: Client[] = [];
  bookings: Booking[] = [];
  courts: Court[] = [];
  selectedClient: Client | null = null;
  showModal = false;
  editingId: string | null = null;
  search = '';
  error = '';
  form = { name: '', phone: '', email: '', notes: '' };

  constructor(private data: DataService, private toast: ToastService) {}

  ngOnInit() {
    this.data.clients$.subscribe(c => this.clients = c);
    this.data.bookings$.subscribe(b => this.bookings = b);
    this.data.courts$.subscribe(c => this.courts = c);
  }

  get filteredClients() {
    const q = this.search.toLowerCase();
    return this.clients.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }

  selectClient(c: Client) { this.selectedClient = c; }
  getClientBookings(name: string): Booking[] { return this.bookings.filter(b => b.client_name === name); }
  getClientTotalSpent(name: string): number {
    return this.getClientBookings(name).filter(b => b.payment_status === 'pago').reduce((s, b) => s + b.total_amount, 0);
  }
  getCourtName(id: string): string { return this.courts.find(c => c.id === id)?.name || 'Quadra'; }
  getPaymentClass(s: string) { return s === 'pago' ? 'badge-primary' : s === 'pendente' ? 'badge-accent' : 'badge-muted'; }

  openModal() { this.form = { name: '', phone: '', email: '', notes: '' }; this.editingId = null; this.error = ''; this.showModal = true; }
  editClient(c: Client) {
    this.form = { name: c.name, phone: c.phone, email: c.email || '', notes: c.notes || '' };
    this.editingId = c.id; this.error = ''; this.showModal = true;
  }
  saveClient() {
    if (!this.form.name || !this.form.phone) { this.error = 'Preencha nome e telefone'; return; }
    if (this.editingId) {
      this.data.updateClient(this.editingId, this.form); this.toast.show('Cliente atualizado!');
    } else {
      this.data.addClient(this.form); this.toast.show('Cliente cadastrado!');
    }
    this.closeModal();
  }
  deleteClient() {
    if (this.editingId) {
      if (this.selectedClient?.id === this.editingId) this.selectedClient = null;
      this.data.deleteClient(this.editingId); this.toast.show('Cliente excluído!'); this.closeModal();
    }
  }
  closeModal(e?: MouseEvent) {
    if (e && e.target !== e.currentTarget) return;
    this.showModal = false;
  }
}
