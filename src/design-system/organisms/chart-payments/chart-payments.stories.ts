import type { Meta, StoryObj } from '@storybook/angular';
import { ChartPaymentsComponent } from './chart-payments.component';

const meta: Meta<ChartPaymentsComponent> = {
  title: 'Organisms/ChartPayments',
  component: ChartPaymentsComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<ChartPaymentsComponent>;

export const Default: Story = {
  args: {
    total: 'R$6.200,00',
    data: [
      { date: 'Seg', value: 780 },
      { date: 'Ter', value: 950 },
      { date: 'Qua', value: 620 },
      { date: 'Qui', value: 1100 },
      { date: 'Sex', value: 1380 },
      { date: 'Sáb', value: 890 },
      { date: 'Dom', value: 480 },
    ],
  },
};
