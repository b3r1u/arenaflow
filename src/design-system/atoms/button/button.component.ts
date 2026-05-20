import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ds-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css']
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'outline' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() label = 'Botão';

  get classes(): string {
    return [
      'ds-btn',
      `ds-btn--${this.variant}`,
      `ds-btn--${this.size}`,
      this.loading ? 'ds-btn--loading' : '',
    ].filter(Boolean).join(' ');
  }
}
