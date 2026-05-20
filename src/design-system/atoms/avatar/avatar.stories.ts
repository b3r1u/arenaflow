import type { Meta, StoryObj } from '@storybook/angular';
import { AvatarComponent } from './avatar.component';

const meta: Meta<AvatarComponent> = {
  title: 'Atoms/Avatar',
  component: AvatarComponent,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    initials: { control: 'text' },
    imageUrl: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<AvatarComponent>;

export const ComIniciais: Story = {
  args: { initials: 'AF', size: 'md' },
};

export const ComImagem: Story = {
  args: {
    imageUrl: 'https://i.pravatar.cc/150?img=3',
    size: 'md',
  },
};

export const Pequeno: Story = {
  args: { initials: 'RN', size: 'sm' },
};

export const Grande: Story = {
  args: { initials: 'CS', size: 'lg' },
};
