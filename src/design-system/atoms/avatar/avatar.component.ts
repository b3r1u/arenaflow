import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ds-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.css']
})
export class AvatarComponent {
  @Input() imageUrl?: string;
  @Input() initials = 'AF';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get classes(): string {
    return ['ds-avatar', `ds-avatar--${this.size}`].join(' ');
  }
}
