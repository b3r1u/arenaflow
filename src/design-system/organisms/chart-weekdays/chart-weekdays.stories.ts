import type { Meta, StoryObj } from '@storybook/angular';
import { ChartWeekdaysComponent } from './chart-weekdays.component';

const meta: Meta<ChartWeekdaysComponent> = {
  title: 'Organisms/ChartWeekdays',
  component: ChartWeekdaysComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<ChartWeekdaysComponent>;

export const Default: Story = {
  args: {
    data: [
      { hour: '07h', count: 4  },
      { hour: '08h', count: 12 },
      { hour: '09h', count: 18 },
      { hour: '10h', count: 9  },
      { hour: '11h', count: 6  },
      { hour: '12h', count: 14 },
      { hour: '13h', count: 7  },
      { hour: '14h', count: 11 },
      { hour: '15h', count: 16 },
      { hour: '16h', count: 22 },
      { hour: '17h', count: 28 },
      { hour: '18h', count: 35 },
      { hour: '19h', count: 31 },
      { hour: '20h', count: 19 },
      { hour: '21h', count: 8  },
    ],
  },
};
