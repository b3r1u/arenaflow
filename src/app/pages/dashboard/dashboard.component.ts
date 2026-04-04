import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexChart, ApexAxisChartSeries, ApexFill, ApexStroke,
         ApexGrid, ApexXAxis, ApexYAxis, ApexTooltip, ApexDataLabels, ApexMarkers } from 'ng-apexcharts';
import { DataService } from '../../services/data.service';
import { Court, Booking } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div>
      <!-- Page header -->
      <div class="mb-5">
        <h1 class="font-heading font-bold text-2xl lg:text-3xl" style="color:var(--foreground)">Dashboard</h1>
        <p class="text-sm mt-0.5" style="color:var(--muted-foreground)">Visão geral das suas quadras</p>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div class="card p-4 lg:p-5">
          <div class="flex items-start justify-between mb-2">
            <span class="text-xs font-medium leading-tight" style="color:var(--muted-foreground)">Reservas Hoje</span>
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color:hsl(152,69%,40%,0.1);color:hsl(152,69%,40%)"><span class="material-icons" style="font-size:1.1rem">calendar_today</span></div>
          </div>
          <div class="font-heading font-bold text-2xl lg:text-3xl mt-1" style="color:var(--foreground)">{{ todayBookings.length }}</div>
          <div class="text-xs mt-1 flex items-center gap-1" style="color:var(--muted-foreground)">
            <span class="inline-block w-1.5 h-1.5 rounded-full" style="background:var(--primary)"></span>
            {{ paidToday }} pagas
          </div>
        </div>

        <div class="card p-4 lg:p-5">
          <div class="flex items-start justify-between mb-2">
            <span class="text-xs font-medium leading-tight" style="color:var(--muted-foreground)">Receita Hoje</span>
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color:hsl(36,95%,55%,0.1);color:hsl(36,95%,55%)"><span class="material-icons" style="font-size:1.1rem">payments</span></div>
          </div>
          <div class="font-heading font-bold text-2xl lg:text-3xl mt-1" style="color:var(--foreground)">R\${{ todayRevenue | number:'1.0-0' }}</div>
          <div class="text-xs mt-1 flex items-center gap-1" style="color:var(--muted-foreground)">
            <span class="inline-block w-1.5 h-1.5 rounded-full" style="background:hsl(36,95%,55%)"></span>
            {{ pendingToday }} pendentes
          </div>
        </div>

        <div class="card p-4 lg:p-5">
          <div class="flex items-start justify-between mb-2">
            <span class="text-xs font-medium leading-tight" style="color:var(--muted-foreground)">Receita Mensal</span>
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color:hsl(221,83%,53%,0.1);color:hsl(221,83%,53%)"><span class="material-icons" style="font-size:1.1rem">trending_up</span></div>
          </div>
          <div class="font-heading font-bold text-2xl lg:text-3xl mt-1" style="color:var(--foreground)">R\${{ monthlyRevenue | number:'1.0-0' }}</div>
          <div class="text-xs mt-1 flex items-center gap-1" style="color:var(--muted-foreground)">
            <span class="inline-block w-1.5 h-1.5 rounded-full" style="background:hsl(221,83%,53%)"></span>
            {{ monthlyBookings }} reservas
          </div>
        </div>

        <div class="card p-4 lg:p-5">
          <div class="flex items-start justify-between mb-2">
            <span class="text-xs font-medium leading-tight" style="color:var(--muted-foreground)">Clientes</span>
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color:hsl(0,84%,60%,0.1);color:hsl(0,84%,60%)"><span class="material-icons" style="font-size:1.1rem">group</span></div>
          </div>
          <div class="font-heading font-bold text-2xl lg:text-3xl mt-1" style="color:var(--foreground)">{{ clientsCount }}</div>
          <div class="text-xs mt-1" style="color:var(--muted-foreground)">cadastrados</div>
        </div>
      </div>

      <!-- Revenue ApexChart -->
      <div class="card mb-4" style="padding:1.25rem 1.25rem 0.5rem">
        <div class="flex items-center justify-between mb-0">
          <div>
            <h2 class="font-heading font-semibold text-base" style="color:var(--foreground)">Faturamento (7 dias)</h2>
            <p class="text-xs mt-0.5" style="color:var(--muted-foreground)">Total: <span class="font-heading font-bold" style="color:var(--primary)">R\${{ totalLast7 | number:'1.0-0' }}</span></p>
          </div>
        </div>
        <apx-chart
          [series]="chartSeries"
          [chart]="chartOptions"
          [fill]="chartFill"
          [stroke]="chartStroke"
          [colors]="chartColors"
          [grid]="chartGrid"
          [xaxis]="chartXAxis"
          [yaxis]="chartYAxis"
          [tooltip]="chartTooltip"
          [dataLabels]="chartDataLabels"
          [markers]="chartMarkers">
        </apx-chart>
      </div>

      <!-- Courts + Bookings -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div class="card p-5">
          <h2 class="font-heading font-semibold text-base mb-3" style="color:var(--foreground)">Status das Quadras</h2>
          <div class="space-y-2">
            <div *ngFor="let court of courts" class="flex items-center justify-between p-3 rounded-xl" style="background-color:var(--muted)">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style="background-color:hsl(152,69%,40%,0.1);color:hsl(152,69%,40%)"><span class="material-icons" style="font-size:1.15rem">sports_volleyball</span></div>
                <div class="min-w-0">
                  <div class="font-semibold text-sm font-heading truncate" style="color:var(--foreground)">{{ court.name }}</div>
                  <div class="text-xs" style="color:var(--muted-foreground)">R\${{ court.hourly_rate }}/h · {{ court.sport_type }}</div>
                </div>
              </div>
              <span class="badge ml-2 flex-shrink-0" [ngClass]="getCourtStatusClass(court.status)">{{ court.status }}</span>
            </div>
            <div *ngIf="courts.length === 0" class="text-center py-4 text-sm" style="color:var(--muted-foreground)">
              Nenhuma quadra cadastrada
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h2 class="font-heading font-semibold text-base mb-3" style="color:var(--foreground)">Reservas de Hoje</h2>
          <div class="space-y-2">
            <div *ngFor="let booking of todayBookings" class="flex items-center gap-3 p-3 rounded-xl" style="background-color:var(--surface-raised)">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center font-heading font-bold text-sm flex-shrink-0"
                   style="background-color:hsl(152,69%,40%,0.12);color:var(--primary)">
                {{ booking.client_name.charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm truncate" style="color:var(--foreground)">{{ booking.client_name }}</div>
                <div class="text-xs" style="color:var(--muted-foreground)">{{ booking.start_hour }}–{{ booking.end_hour }} · {{ getCourtName(booking.court_id) }}</div>
              </div>
              <span class="badge flex-shrink-0" [ngClass]="getPaymentStatusClass(booking.payment_status)">{{ booking.payment_status }}</span>
            </div>
            <div *ngIf="todayBookings.length === 0" class="text-center py-8 text-sm" style="color:var(--muted-foreground)">
              Nenhuma reserva para hoje
            </div>
          </div>
        </div>
      </div>

      <!-- Popular hours bar chart -->
      <div class="card p-5">
        <h2 class="font-heading font-semibold text-base mb-4" style="color:var(--foreground)">Horários Populares</h2>
        <div class="overflow-x-auto mobile-scroll">
          <div style="min-width:420px">
            <div style="height:130px">
              <svg width="100%" height="100%" viewBox="0 0 760 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stop-color="hsl(152,69%,42%)"/>
                    <stop offset="100%" stop-color="hsl(152,69%,55%)"/>
                  </linearGradient>
                </defs>
                <ng-container *ngFor="let h of popularHours; let i = index">
                  <rect [attr.x]="i * barW + 2" [attr.y]="120 - getBarH(h.count)"
                        [attr.width]="barW - 4" [attr.height]="getBarH(h.count)"
                        rx="4" ry="4"
                        [attr.fill]="h.count > 0 ? 'url(#barGrad)' : svgEmpty"/>
                  <text *ngIf="h.count > 0"
                        [attr.x]="i * barW + barW/2" y="115"
                        text-anchor="middle" fill="white"
                        font-size="7.5" font-weight="700" font-family="Space Grotesk,sans-serif">
                    {{ h.count }}
                  </text>
                </ng-container>
              </svg>
            </div>
            <div class="flex" style="min-width:420px">
              <div *ngFor="let h of popularHours" class="flex-1 text-center" style="font-size:9px;color:var(--muted-foreground)">
                {{ h.hour.replace(':00','h') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  courts: Court[] = [];
  get svgEmpty(): string {
    return getComputedStyle(document.documentElement).getPropertyValue('--svg-empty').trim() || 'hsl(150,12%,88%)';
  }
  todayBookings: Booking[] = [];
  paidToday = 0;
  pendingToday = 0;
  todayRevenue = 0;
  monthlyRevenue = 0;
  monthlyBookings = 0;
  clientsCount = 0;
  totalLast7 = 0;
  last7Days: { day: string; revenue: number }[] = [];
  popularHours: { hour: string; count: number }[] = [];
  maxCount = 1;
  barW = 760 / 16;

  // ApexCharts options
  chartSeries: ApexAxisChartSeries = [];
  chartOptions: ApexChart = {
    type: 'area',
    height: 220,
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'Inter, sans-serif',
    sparkline: { enabled: false },
    animations: {
      enabled: true,
      speed: 600
    }
  };
  chartFill: ApexFill = {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.45,
      opacityTo: 0.0,
      stops: [0, 95, 100]
    }
  };
  chartStroke: ApexStroke = {
    curve: 'smooth',
    width: 3
  };
  chartColors = ['#22a55c'];
  chartGrid: ApexGrid = {
    borderColor: 'hsl(150,12%,90%)',
    strokeDashArray: 4,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
    padding: { top: 0, right: 0, bottom: 0, left: 8 }
  };
  chartXAxis: ApexXAxis = {
    categories: [],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: { colors: 'hsl(160,10%,55%)', fontSize: '11px', fontFamily: 'Inter, sans-serif' }
    }
  };
  chartYAxis: ApexYAxis = {
    labels: {
      formatter: (val: number) => val === 0 ? '0' : `R\$${Math.round(val)}`,
      style: { colors: 'hsl(160,10%,55%)', fontSize: '11px', fontFamily: 'Inter, sans-serif' }
    }
  };
  chartTooltip: ApexTooltip = {
    theme: 'dark',
    x: { show: true },
    y: {
      formatter: (val: number) => `R\$${val.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
    },
    marker: { show: true }
  };
  chartDataLabels: ApexDataLabels = { enabled: false };
  chartMarkers: ApexMarkers = {
    size: 0,
    hover: { size: 6, sizeOffset: 2 }
  };

  constructor(private data: DataService) {}

  ngOnInit() {
    this.courts = this.data.getCourts();
    this.todayBookings = this.data.getTodayBookings();
    this.paidToday = this.todayBookings.filter(b => b.payment_status === 'pago').length;
    this.pendingToday = this.todayBookings.filter(b => b.payment_status === 'pendente').length;
    this.todayRevenue = this.data.getTodayRevenue();
    this.monthlyRevenue = this.data.getMonthlyRevenue();
    this.monthlyBookings = this.data.getBookings().filter(b => {
      const d = new Date(b.date), now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    this.clientsCount = this.data.getClients().length;
    this.last7Days = this.data.getLast7DaysRevenue();
    this.popularHours = this.data.getPopularHours();
    this.totalLast7 = this.last7Days.reduce((s, d) => s + d.revenue, 0);
    this.maxCount = Math.max(...this.popularHours.map(h => h.count), 1);
    this.buildChart();
  }

  buildChart() {
    this.chartSeries = [{
      name: 'Faturamento',
      data: this.last7Days.map(d => d.revenue)
    }];
    this.chartXAxis = {
      ...this.chartXAxis,
      categories: this.last7Days.map(d => d.day)
    };
  }

  getBarH(count: number): number { return Math.max(4, (count / this.maxCount) * 105); }
  getCourtName(id: string): string { return this.courts.find(c => c.id === id)?.name || 'Quadra'; }
  getCourtStatusClass(s: string) { return s === 'disponível' ? 'badge-primary' : s === 'bloqueada' ? 'badge-destructive' : 'badge-accent'; }
  getPaymentStatusClass(s: string) { return s === 'pago' ? 'badge-primary' : s === 'pendente' ? 'badge-accent' : 'badge-muted'; }
}
