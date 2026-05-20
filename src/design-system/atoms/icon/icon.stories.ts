import type { Meta, StoryObj } from '@storybook/angular';
import { IconComponent } from './icon.component';

const meta: Meta<IconComponent> = {
  title: 'Atoms/Icon',
  component: IconComponent,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    color: {
      control: 'select',
      options: ['default', 'primary', 'muted', 'accent', 'destructive'],
    },
  },
};

export default meta;
type Story = StoryObj<IconComponent>;

export const Default: Story = {
  args: { name: 'star', size: 'md', color: 'default' },
};

export const Primary: Story = {
  args: { name: 'sports_tennis', size: 'md', color: 'primary' },
};

export const Muted: Story = {
  args: { name: 'calendar_today', size: 'md', color: 'muted' },
};

export const Accent: Story = {
  args: { name: 'attach_money', size: 'md', color: 'accent' },
};

export const Destructive: Story = {
  args: { name: 'delete', size: 'md', color: 'destructive' },
};

export const Large: Story = {
  args: { name: 'dashboard', size: 'xl', color: 'primary' },
};
