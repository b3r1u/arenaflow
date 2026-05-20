import type { Meta, StoryObj } from '@storybook/angular';
import { SidebarComponent } from './sidebar.component';

const meta: Meta<SidebarComponent> = {
  title: 'Organisms/Sidebar',
  component: SidebarComponent,
  tags: ['autodocs'],
  decorators: [
    (story) => ({ ...story(), styles: ['body { margin: 0; }'] }),
  ],
};

export default meta;
type Story = StoryObj<SidebarComponent>;

const defaultNavItems = [
  { label: 'Dashboard',    icon: 'dashboard',        path: '/',            active: true  },
  { label: 'Agendamentos', icon: 'calendar_today',   path: '/agendamentos'               },
  { label: 'Quadras',      icon: 'sports_tennis',    path: '/quadras'                    },
  { label: 'Clientes',     icon: 'group',            path: '/clientes'                   },
  { label: 'Mensalistas',  icon: 'repeat',           path: '/mensalistas'                },
  { label: 'Financeiro',   icon: 'account_balance',  path: '/financeiro'                 },
  { label: 'Relatórios',   icon: 'bar_chart',        path: '/relatorios'                 },
  { label: 'Promoções',    icon: 'local_offer',      path: '/promocoes'                  },
  { label: 'Planos',       icon: 'workspace_premium', path: '/planos',   accent: true    },
];

export const Default: Story = {
  args: {
    establishmentName: 'Arena Solve TI',
    establishmentInitials: 'AS',
    navItems: defaultNavItems,
    user: {
      name: 'Robério Albuquerque',
      email: 'roberio@arenasolve.com',
      initials: 'RA',
    },
  },
};

export const ComLogo: Story = {
  args: {
    establishmentName: 'Arena Solve TI',
    establishmentInitials: 'AS',
    logoUrl: 'https://i.pravatar.cc/150?img=10',
    navItems: defaultNavItems,
    user: {
      name: 'Robério Albuquerque',
      email: 'roberio@arenasolve.com',
      initials: 'RA',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
    },
  },
};
