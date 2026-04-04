import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule, ApexChart, ApexAxisChartSeries, ApexFill, ApexStroke,
         ApexGrid, ApexXAxis, ApexYAxis, ApexTooltip, ApexDataLabels, ApexMarkers } from 'ng-apexcharts';
import { DataService } from '../../services/data.service';
import { Booking } from '../../models/models';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  template: `
    <div>
      <!-- Header -->
      <div class="flex items-start justify-between mb-6 gap-3">
        <div>
          <h1 class="font-heading font-bold text-2xl lg:text-3xl" style="color:var(--foreground)">Relatórios</h1>
          <p class="text-sm mt-1" style="color:var(--muted-foreground)">Análise de desempenho das quadras</p>
        </div>
        <select class="select" style="width:auto;min-width:140px;flex-shrink:0" [(ngModel)]="period" (ngModelChange)="calcStats()">
          <option [ngValue]="7">Últimos 7 dias</option>
          <option [ngValue]="15">Últimos 15 dias</option>
          <option [ngValue]="30">Últimos 30 dias</option>
          <option [ngValue]="90">Últimos 90 dias</option>
        </select>
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div class="card p-4 lg:p-5">
          <div class="text-xs font-medium mb-2" style="color:var(--muted-foreground)">Faturamento</div>
          <div class="font-heading font-bold text-xl" style="color:var(--primary)">R\${{ totalRevenue | number:'1.0-0' }}</div>
        </div>
        <div class="card p-4 lg:p-5">
          <div class="text-xs font-medium mb-2" style="color:var(--muted-foreground)">Média/dia</div>
          <div class="font-heading font-bold text-xl" style="color:hsl(36,95%,40%)">R\${{ avgDaily | number:'1.0-0' }}</div>
        </div>
        <div class="card p-4 lg:p-5">
          <div class="text-xs font-medium mb-2" style="color:var(--muted-foreground)">Reservas</div>
          <div class="font-heading font-bold text-xl" style="color:hsl(221,83%,53%)">{{ totalBookings }}</div>
        </div>
        <div class="card p-4 lg:p-5">
          <div class="text-xs font-medium mb-2" style="color:var(--muted-foreground)">Pendente</div>
          <div class="font-heading font-bold text-xl" style="color:var(--destructive)">R\${{ pendingRevenue | number:'1.0-0' }}</div>
        </div>
      </div>

      <!-- Charts row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        <!-- ApexCharts — Faturamento Diário -->
        <div class="card" style="padding:1.25rem 1.25rem 0.5rem">
          <div class="flex items-center justify-between mb-0">
            <div>
              <h2 class="font-heading font-semibold text-base" style="color:var(--foreground)">Faturamento Diário</h2>
              <p class="text-xs mt-0.5" style="color:var(--muted-foreground)">Últimos {{ period }} dias</p>
            </div>
            <span class="font-heading font-bold text-sm" style="color:var(--primary)">R\${{ totalRevenue | number:'1.0-0' }}</span>
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

        <!-- Horários Populares (SVG bar) -->
        <div class="card p-5">
          <h2 class="font-heading font-semibold text-base mb-4" style="color:var(--foreground)">Horários Populares</h2>
          <div class="overflow-x-auto mobile-scroll">
            <div style="min-width:340px">
              <div style="height:130px">
                <svg width="100%" height="100%" viewBox="0 0 760 115" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="rBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stop-color="hsl(152,69%,42%)"/>
                      <stop offset="100%" stop-color="hsl(152,69%,56%)"/>
                    </linearGradient>
                  </defs>
                  <ng-container *ngFor="let h of popularHours; let i = index">
                    <rect [attr.x]="i * rBarW + 2" [attr.y]="115 - getRBarH(h.count)"
                          [attr.width]="rBarW - 4" [attr.height]="getRBarH(h.count)"
                          rx="4" ry="4"
                          [attr.fill]="h.count > 0 ? 'url(#rBarGrad)' : svgEmpty"/>
                    <text *ngIf="h.count > 0"
                          [attr.x]="i * rBarW + rBarW / 2" y="112"
                          text-anchor="middle" fill="white"
                          font-size="7" font-weight="700" font-family="Space Grotesk,sans-serif">
                      {{ h.count }}
                    </text>
                  </ng-container>
                </svg>
              </div>
              <div class="flex mt-0.5" style="min-width:340px">
                <div *ngFor="let h of popularHours"
                     class="flex-1 text-center"
                     style="font-size:8px;color:var(--muted-foreground)">
                  {{ h.hour.replace(':00','') }}h
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Court occupation -->
        <div class="card p-5">
          <h2 class="font-heading font-semibold text-base mb-4" style="color:var(--foreground)">Ocupação por Quadra</h2>
          <div class="space-y-4">
            <div *ngFor="let stat of courtStats">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-sm font-medium" style="color:var(--foreground)">{{ stat.name }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-xs" style="color:var(--muted-foreground)">{{ stat.hours }}h</span>
                  <span class="font-heading font-bold text-sm" style="color:var(--primary)">{{ stat.rate }}%</span>
                </div>
              </div>
              <div class="w-full rounded-full h-2" style="background-color:var(--muted)">
                <div class="h-2 rounded-full" style="background-color:var(--primary);transition:width 0.5s"
                     [style.width.%]="stat.rate"></div>
              </div>
              <div class="text-xs mt-1" style="color:var(--muted-foreground)">R\${{ stat.revenue | number:'1.0-0' }} faturados</div>
            </div>
          </div>
        </div>

        <!-- Payment methods -->
        <div class="card p-5">
          <h2 class="font-heading font-semibold text-base mb-4" style="color:var(--foreground)">Formas de Pagamento</h2>
          <div class="space-y-4">
            <div *ngFor="let pm of paymentMethods">
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-2">
                  <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" [style.background-color]="pm.color"></div>
                  <span class="text-sm" style="color:var(--foreground)">{{ pm.label }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs" style="color:var(--muted-foreground)">{{ pm.count }}x</span>
                  <span class="font-heading font-semibold text-sm" style="color:var(--foreground)">{{ pm.percent }}%</span>
                </div>
              </div>
              <div class="w-full rounded-full h-2" style="background-color:var(--muted)">
                <div class="h-2 rounded-full" style="transition:width 0.5s"
                     [style.width.%]="pm.percent" [style.background-color]="pm.color"></div>
              </div>
              <div class="text-xs mt-1" style="color:var(--muted-foreground)">R\${{ pm.total | number:'1.0-0' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RelatoriosComponent implements OnInit {
  period = 30;
  get svgEmpty(): string {
    return getComputedStyle(document.documentElement).getPropertyValue('--svg-empty').trim() || 'hsl(150,12%,88%)';
  }
  totalRevenue = 0;
  avgDaily = 0;
  totalBookings = 0;
  pendingRevenue = 0;
  dailyData: { label: string; revenue: number }[] = [];
  popularHours: { hour: string; count: number }[] = [];
  courtStats: { name: string; hours: number; rate: number; revenue: number }[] = [];
  paymentMethods: { label: string; count: number; total: number; percent: number; color: string }[] = [];
  rBarW = 760 / 16;
  maxCount = 1;

  // ApexCharts
  chartSeries: ApexAxisChartSeries = [];
  chartOptions: ApexChart = {
    type: 'area',
    height: 230,
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'Inter, sans-serif',
    animations: { enabled: true, speed: 700 }
  };
  chartFill: ApexFill = {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.42,
      opacityTo: 0.0,
      stops: [0, 95, 100]
    }
  };
  chartStroke: ApexStroke = { curve: 'smooth', width: 3 };
  chartColors = ['#22a55c'];
  chartGrid: ApexGrid = {
    borderColor: 'hsl(150,12%,90%)',
    strokeDashArray: 4,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
    padding: { top: 0, right: 4, bottom: 0, left: 8 }
  };
  chartXAxis: ApexXAxis = {
    categories: [],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: { colors: 'hsl(160,10%,55%)', fontSize: '11px', fontFamily: 'Inter, sans-serif' },
      rotate: 0,
      hideOverlappingLabels: true
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
    y: { formatter: (val: number) => `R\$${val.toLocaleString('pt-BR')}` },
    marker: { show: true }
  };
  chartDataLabels: ApexDataLabels = { enabled: false };
  chartMarkers: ApexMarkers = { size: 0, hover: { size: 6, sizeOffset: 2 } };

  constructor(private data: DataService) {}
  ngOnInit() { this.calcStats(); }

  calcStats() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.period);
    const bookings = this.data.getBookings().filter(b => new Date(b.date) >= cutoff);
    const paid = bookings.filter(b => b.payment_status === 'pago');
    this.totalRevenue = paid.reduce((s, b) => s + b.total_amount, 0);
    this.avgDaily = this.totalRevenue / this.period;
    this.totalBookings = bookings.length;
    this.pendingRevenue = bookings.filter(b => b.payment_status === 'pendente').reduce((s, b) => s + b.total_amount, 0);
    this.buildDailyData(bookings);
    this.buildCourtStats(bookings);
    this.buildPaymentStats(bookings);
    this.popularHours = this.data.getPopularHours();
    this.maxCount = Math.max(...this.popularHours.map(h => h.count), 1);
  }

  buildDailyData(bookings: Booking[]) {
    const days = Math.min(this.period, 14);
    this.dailyData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const revenue = bookings
        .filter(b => b.date === dateStr && b.payment_status === 'pago')
        .reduce((s, b) => s + b.total_amount, 0);
      this.dailyData.push({ label, revenue });
    }
    this.buildChart();
  }

  buildChart() {
    this.chartSeries = [{
      name: 'Faturamento',
      data: this.dailyData.map(d => d.revenue)
    }];
    this.chartXAxis = {
      ...this.chartXAxis,
      categories: this.dailyData.map(d => d.label)
    };
  }

  buildCourtStats(bookings: Booking[]) {
    const courts = this.data.getCourts();
    const maxHours = this.period * 16;
    this.courtStats = courts.map(c => {
      const cb = bookings.filter(b => b.court_id === c.id);
      const hours = cb.reduce((s, b) => s + (b.duration_hours || 0), 0);
      const revenue = cb.filter(b => b.payment_status === 'pago').reduce((s, b) => s + b.total_amount, 0);
      return { name: c.name, hours, revenue, rate: Math.min(100, Math.round((hours / maxHours) * 100)) };
    });
  }

  buildPaymentStats(bookings: Booking[]) {
    const methods = [
      { key: 'pix',     label: 'Pix',           color: 'hsl(152,69%,40%)' },
      { key: 'cartão',  label: 'Cartão',         color: 'hsl(221,83%,53%)' },
      { key: 'dinheiro',label: 'Dinheiro',       color: 'hsl(36,95%,55%)'  },
      { key: '',        label: 'Não informado',  color: 'hsl(160,10%,65%)' },
    ];
    const total = bookings.length || 1;
    this.paymentMethods = methods.map(m => {
      const mb = bookings.filter(b => (b.payment_method || '') === m.key);
      return {
        label: m.label, color: m.color, count: mb.length,
        total: mb.reduce((s, b) => s + b.total_amount, 0),
        percent: Math.round((mb.length / total) * 100)
      };
    }).filter(m => m.count > 0);
  }

  getRBarH(count: number): number { return Math.max(4, (count / this.maxCount) * 100); }
}
