import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ds-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() establishmentName = 'ArenaFlow';
  @Input() establishmentInitials = 'AF';
  @Input() logoUrl?: string;
  @Output() menuClick = new EventEmitter<void>();
}
