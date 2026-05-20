import { Component, Input, OnChanges, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import ApexCharts from 'apexcharts';

export interface HourStat {
  hour: string;
  count: number;
}

@Component({
  selector: 'ds-chart-weekdays',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-weekdays.component.html',
  styleUrls: ['./chart-weekdays.component.css']
})
export class ChartWeekdaysComponent implements AfterViewInit, OnChanges {
  @Input() data: HourStat[] = [];
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
    this.chart = new ApexCharts(this.chartEl.nativeElement, {
      series: [{ name: 'Reservas', data: this.data.map(d => d.count) }],
      chart: { type: 'bar', height: 180, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'Inter, sans-serif', animations: { enabled: true, speed: 500 } },
      plotOptions: { bar: { borderRadius: 4, columnWidth: '68%' } },
      colors: ['#22a55c'],
      fill: { type: 'gradient', gradient: { shadeIntensity: 0.4, opacityFrom: 1, opacityTo: 0.75, stops: [0, 100] } },
      grid: { borderColor: 'hsl(150,12%,90%)', strokeDashArray: 4, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } }, padding: { top: 0, right: 0, bottom: 0, left: 4 } },
      xaxis: { categories: this.data.map(d => d.hour), axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: 'hsl(160,10%,55%)', fontSize: '10px', fontFamily: 'Inter, sans-serif' } } },
      yaxis: { min: 0, tickAmount: 4, labels: { formatter: (v: number) => Math.round(v).toString(), style: { colors: 'hsl(160,10%,55%)', fontSize: '11px', fontFamily: 'Inter, sans-serif' } } },
      tooltip: { theme: 'dark', y: { formatter: (v: number) => `${v} reserva${v !== 1 ? 's' : ''}` }, marker: { show: false } },
      dataLabels: { enabled: false },
    });
    this.chart.render();
  }
}
