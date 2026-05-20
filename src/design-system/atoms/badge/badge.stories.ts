import type { Meta, StoryObj } from '@storybook/angular';
import { BadgeComponent } from './badge.component';

const meta: Meta<BadgeComponent> = {
  title: 'Atoms/Badge',
  component: BadgeComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'accent', 'destructive', 'muted', 'blue'],
    },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<BadgeComponent>;

export const Confirmado: Story = {
  args: { variant: 'primary', label: 'Confirmado' },
};

export const Pendente: Story = {
  args: { variant: 'accent', label: 'Pendente' },
};

export const Cancelado: Story = {
  args: { variant: 'destructive', label: 'Cancelado' },
};

export const Inativo: Story = {
  args: { variant: 'muted', label: 'Inativo' },
};

export const Informativo: Story = {
  args: { variant: 'blue', label: 'Novo' },
};
