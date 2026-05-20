import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ds-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.css']
})
export class StatCardComponent {
  @Input() label = 'Label';
  @Input() value = '0';
  @Input() hint = '';
  @Input() icon = 'bar_chart';
  @Input() iconColor: 'primary' | 'accent' | 'blue' | 'destructive' = 'primary';

  get iconBgStyle(): Record<string, string> {
    const colors: Record<string, { bg: string; color: string }> = {
      primary:    { bg: 'hsl(152,69%,40%,0.1)', color: 'hsl(152,69%,40%)' },
      accent:     { bg: 'hsl(36,95%,55%,0.1)',  color: 'hsl(36,95%,55%)'  },
      blue:       { bg: 'hsl(221,83%,53%,0.1)', color: 'hsl(221,83%,53%)' },
      destructive:{ bg: 'hsl(0,84%,60%,0.1)',   color: 'hsl(0,84%,60%)'   },
    };
    const c = colors[this.iconColor];
    return { 'background-color': c.bg, color: c.color };
  }

  get dotColor(): string {
    const colors: Record<string, string> = {
      primary:     'hsl(152,69%,40%)',
      accent:      'hsl(36,95%,55%)',
      blue:        'hsl(221,83%,53%)',
      destructive: 'hsl(0,84%,60%)',
    };
    return colors[this.iconColor];
  }
}
