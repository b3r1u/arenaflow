import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../molecules/stat-card/stat-card.component';

export interface StatItem {
  label: string;
  value: string;
  hint: string;
  icon: string;
  iconColor: 'primary' | 'accent' | 'blue' | 'destructive';
}

@Component({
  selector: 'ds-stats-section',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  templateUrl: './stats-section.component.html',
  styleUrls: ['./stats-section.component.css']
})
export class StatsSectionComponent {
  @Input() stats: StatItem[] = [];
}
