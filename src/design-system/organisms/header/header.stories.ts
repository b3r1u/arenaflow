import type { Meta, StoryObj } from '@storybook/angular';
import { HeaderComponent } from './header.component';

const meta: Meta<HeaderComponent> = {
  title: 'Organisms/Header',
  component: HeaderComponent,
  tags: ['autodocs'],
  argTypes: {
    establishmentName: { control: 'text' },
    establishmentInitials: { control: 'text' },
    logoUrl: { control: 'text' },
    menuClick: { action: 'menuClick' },
  },
};

export default meta;
type Story = StoryObj<HeaderComponent>;

export const Default: Story = {
  args: {
    establishmentName: 'Arena Solve TI',
    establishmentInitials: 'AS',
  },
};

export const ComLogo: Story = {
  args: {
    establishmentName: 'Arena Solve TI',
    establishmentInitials: 'AS',
    logoUrl: 'https://i.pravatar.cc/150?img=10',
  },
};
