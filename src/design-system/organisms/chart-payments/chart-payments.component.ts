import { Component, Input, OnChanges, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import ApexCharts from 'apexcharts';

export interface PaymentDay {
  date: string;
  value: number;
}

@Component({
  selector: 'ds-chart-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-payments.component.html',
  styleUrls: ['./chart-payments.component.css']
})
export class ChartPaymentsComponent implements AfterViewInit, OnChanges {
  @Input() data: PaymentDay[] = [];
  @Input() total = 'R$0,00';
  @ViewChild('chartEl') chartEl!: ElementRef;

  private chart?: ApexCharts;
  private viewReady = false;
  private dataReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.dataReady) setTimeout(() => this.renderChart(), 0);
  }

  ngOnChanges(): void {
    this.dataReady = true;
    if (this.viewReady) setTimeout(() => this.renderChart(), 0);
  }

  private renderChart(): void {
    this.chart?.destroy();
    const categories = this.data.map(d => d.date);
    const values = this.data.map(d => d.value);

    this.chart = new ApexCharts(this.chartEl.nativeElement, {
      series: [{ name: 'Receita', data: values }],
      chart: { type: 'area', height: 220, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'Inter, sans-serif', animations: { enabled: true, speed: 600 } },
      fill: { type: 'gradient', gradient: { shadeIntensity: 0.4, opacityFrom: 0.5, opacityTo: 0.05, stops: [0, 100] } },
      stroke: { curve: 'smooth', width: 2, colors: ['#22a55c'] },
      colors: ['#22a55c'],
      grid: { borderColor: 'hsl(150,12%,90%)', strokeDashArray: 4, xaxis: { lines: { show: false } }, padding: { left: 4, right: 4 } },
      xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: 'hsl(160,10%,55%)', fontSize: '10px', fontFamily: 'Inter, sans-serif' } } },
      yaxis: { labels: { formatter: (v: number) => `R$${v}`, style: { colors: 'hsl(160,10%,55%)', fontSize: '11px', fontFamily: 'Inter, sans-serif' } } },
      tooltip: { theme: 'dark', y: { formatter: (v: number) => `R$${v.toFixed(2)}` } },
      dataLabels: { enabled: false },
      markers: { size: 3, colors: ['#22a55c'], strokeWidth: 0, hover: { size: 5 } },
    });
    this.chart.render();
  }
}
