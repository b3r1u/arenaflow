import type { Meta, StoryObj } from '@storybook/angular';
import { StatCardComponent } from './stat-card.component';

const meta: Meta<StatCardComponent> = {
  title: 'Molecules/StatCard',
  component: StatCardComponent,
  tags: ['autodocs'],
  argTypes: {
    iconColor: {
      control: 'select',
      options: ['primary', 'accent', 'blue', 'destructive'],
    },
    icon: { control: 'text' },
    label: { control: 'text' },
    value: { control: 'text' },
    hint: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<StatCardComponent>;

export const ReservasHoje: Story = {
  args: {
    label: 'Reservas Hoje',
    value: '12',
    hint: '8 pagas',
    icon: 'calendar_today',
    iconColor: 'primary',
  },
};

export const ReceitaHoje: Story = {
  args: {
    label: 'Receita Hoje',
    value: 'R$450,00',
    hint: '3 pendentes',
    icon: 'payments',
    iconColor: 'accent',
  },
};

export const ReceitaMensal: Story = {
  args: {
    label: 'Receita Mensal',
    value: 'R$6.200,00',
    hint: '87 reservas',
    icon: 'trending_up',
    iconColor: 'blue',
  },
};

export const Clientes: Story = {
  args: {
    label: 'Clientes',
    value: '34',
    hint: 'cadastrados',
    icon: 'group',
    iconColor: 'destructive',
  },
};
