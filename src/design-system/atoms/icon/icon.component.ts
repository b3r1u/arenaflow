import { Component, Input } from '@angular/core';

@Component({
  selector: 'ds-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.css']
})
export class IconComponent {
  @Input() name = 'star';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() color: 'default' | 'primary' | 'muted' | 'accent' | 'destructive' = 'default';

  get classes(): string {
    return ['material-icons', 'ds-icon', `ds-icon--${this.size}`, `ds-icon--${this.color}`].join(' ');
  }
}
