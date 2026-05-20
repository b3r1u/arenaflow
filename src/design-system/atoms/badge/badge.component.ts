import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ds-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.css']
})
export class BadgeComponent {
  @Input() variant: 'primary' | 'accent' | 'destructive' | 'muted' | 'blue' = 'primary';
  @Input() label = 'Badge';

  get classes(): string {
    return ['ds-badge', `ds-badge--${this.variant}`].join(' ');
  }
}
