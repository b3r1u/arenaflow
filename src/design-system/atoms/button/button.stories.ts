import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent } from './button.component';

const meta: Meta<ButtonComponent> = {
  title: 'Atoms/Button',
  component: ButtonComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'outline', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<ButtonComponent>;

export const Primary: Story = {
  args: { variant: 'primary', size: 'md', label: 'Confirmar', loading: false, disabled: false },
};

export const Outline: Story = {
  args: { variant: 'outline', size: 'md', label: 'Cancelar', loading: false, disabled: false },
};

export const Ghost: Story = {
  args: { variant: 'ghost', size: 'md', label: 'Ver mais', loading: false, disabled: false },
};

export const Loading: Story = {
  args: { variant: 'primary', size: 'md', label: 'Salvando...', loading: true, disabled: false },
};

export const Disabled: Story = {
  args: { variant: 'primary', size: 'md', label: 'Indisponível', loading: false, disabled: true },
};

export const Small: Story = {
  args: { variant: 'outline', size: 'sm', label: 'Filtrar', loading: false, disabled: false },
};

export const Large: Story = {
  args: { variant: 'primary', size: 'lg', label: 'Criar agendamento', loading: false, disabled: false },
};
