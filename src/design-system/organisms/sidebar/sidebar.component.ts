import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface NavItem {
  label: string;
  icon: string;
  path: string;
  active?: boolean;
  accent?: boolean;
  locked?: boolean;
}

export interface SidebarUser {
  name: string;
  email: string;
  initials: string;
  avatarUrl?: string;
}

@Component({
  selector: 'ds-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() establishmentName = 'ArenaFlow';
  @Input() establishmentInitials = 'AF';
  @Input() logoUrl?: string;
  @Input() navItems: NavItem[] = [];
  @Input() user: SidebarUser = { name: 'Usuário', email: 'usuario@email.com', initials: 'U' };
}
