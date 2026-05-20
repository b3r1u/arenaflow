import type { Meta, StoryObj } from '@storybook/angular';
import { PageHeaderComponent } from './page-header.component';

const meta: Meta<PageHeaderComponent> = {
  title: 'Molecules/PageHeader',
  component: PageHeaderComponent,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<PageHeaderComponent>;

export const Default: Story = {
  args: {
    title: 'Agendamentos',
    subtitle: 'Gerencie as reservas das quadras',
  },
};

export const SemSubtitulo: Story = {
  args: {
    title: 'Dashboard',
    subtitle: '',
  },
};

export const Clientes: Story = {
  args: {
    title: 'Clientes',
    subtitle: 'Gerencie os clientes cadastrados',
  },
};

export const Financeiro: Story = {
  args: {
    title: 'Financeiro',
    subtitle: 'Acompanhe entradas e saídas',
  },
};
