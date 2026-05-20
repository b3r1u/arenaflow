import type { Meta, StoryObj } from '@storybook/angular';
import { StatsSectionComponent } from './stats-section.component';

const meta: Meta<StatsSectionComponent> = {
  title: 'Organisms/StatsSection',
  component: StatsSectionComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<StatsSectionComponent>;

export const Dashboard: Story = {
  args: {
    stats: [
      { label: 'Reservas Hoje',  value: '12',        hint: '8 pagas',     icon: 'calendar_today', iconColor: 'primary'     },
      { label: 'Receita Hoje',   value: 'R$450,00',  hint: '3 pendentes', icon: 'payments',       iconColor: 'accent'      },
      { label: 'Receita Mensal', value: 'R$6.200,00', hint: '87 reservas', icon: 'trending_up',    iconColor: 'blue'        },
      { label: 'Clientes',       value: '34',         hint: 'cadastrados', icon: 'group',          iconColor: 'destructive' },
    ],
  },
};

export const Vazio: Story = {
  args: { stats: [] },
};
