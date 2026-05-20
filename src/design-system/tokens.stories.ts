import type { Meta, StoryObj } from '@storybook/angular';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

const colorTokens = [
  { token: '--primary',          label: 'Primary',           description: 'Verde principal — ações e destaques' },
  { token: '--primary-foreground', label: 'Primary Foreground', description: 'Texto sobre fundo primary' },
  { token: '--background',       label: 'Background',        description: 'Fundo geral da aplicação' },
  { token: '--foreground',       label: 'Foreground',        description: 'Texto principal' },
  { token: '--card',             label: 'Card',              description: 'Fundo de cards e painéis' },
  { token: '--border',           label: 'Border',            description: 'Bordas e divisores' },
  { token: '--muted',            label: 'Muted',             description: 'Fundos sutis e desabilitados' },
  { token: '--muted-foreground', label: 'Muted Foreground',  description: 'Textos secundários e labels' },
  { token: '--accent',           label: 'Accent',            description: 'Amarelo — alertas e pendências' },
  { token: '--destructive',      label: 'Destructive',       description: 'Vermelho — erros e exclusões' },
];

const spacingTokens = [
  { token: '--radius', label: 'Radius', description: 'Border radius padrão dos componentes' },
];

const sidebarTokens = [
  { token: '--sidebar-background', label: 'Sidebar Background', description: 'Fundo da sidebar' },
  { token: '--sidebar-foreground', label: 'Sidebar Foreground', description: 'Texto e ícones da sidebar' },
  { token: '--sidebar-primary',    label: 'Sidebar Primary',    description: 'Cor de destaque da sidebar' },
  { token: '--sidebar-accent',     label: 'Sidebar Accent',     description: 'Hover e item ativo da sidebar' },
  { token: '--sidebar-border',     label: 'Sidebar Border',     description: 'Divisores da sidebar' },
];

@Component({
  selector: 'ds-tokens-story',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 2rem; font-family: Inter, sans-serif; color: var(--foreground); background: var(--background); min-height: 100vh">

      <h1 style="font-family: Space Grotesk, sans-serif; font-size: 1.75rem; font-weight: 700; margin: 0 0 0.5rem">Design Tokens</h1>
      <p style="color: var(--muted-foreground); margin: 0 0 2.5rem; font-size: 0.9rem">
        Variáveis CSS que definem a identidade visual do ArenaFlow. Suportam tema claro e escuro automaticamente.
      </p>

      <h2 style="font-family: Space Grotesk, sans-serif; font-size: 1.1rem; font-weight: 600; margin: 0 0 1rem">Cores</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem; margin-bottom: 2.5rem">
        <div *ngFor="let c of colorTokens" style="background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden">
          <div [style.background]="'var(' + c.token + ')'" style="height: 3.5rem"></div>
          <div style="padding: 0.75rem">
            <div style="font-weight: 600; font-size: 0.8rem">{{ c.label }}</div>
            <div style="font-family: monospace; font-size: 0.72rem; color: var(--primary); margin: 0.15rem 0">{{ c.token }}</div>
            <div style="font-size: 0.72rem; color: var(--muted-foreground)">{{ c.description }}</div>
          </div>
        </div>
      </div>

      <h2 style="font-family: Space Grotesk, sans-serif; font-size: 1.1rem; font-weight: 600; margin: 0 0 1rem">Sidebar</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem; margin-bottom: 2.5rem">
        <div *ngFor="let c of sidebarTokens" style="background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden">
          <div [style.background]="'var(' + c.token + ')'" style="height: 3.5rem"></div>
          <div style="padding: 0.75rem">
            <div style="font-weight: 600; font-size: 0.8rem">{{ c.label }}</div>
            <div style="font-family: monospace; font-size: 0.72rem; color: var(--primary); margin: 0.15rem 0">{{ c.token }}</div>
            <div style="font-size: 0.72rem; color: var(--muted-foreground)">{{ c.description }}</div>
          </div>
        </div>
      </div>

      <h2 style="font-family: Space Grotesk, sans-serif; font-size: 1.1rem; font-weight: 600; margin: 0 0 1rem">Espaçamento</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem">
        <div *ngFor="let s of spacingTokens" style="background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 0.75rem">
          <div style="font-weight: 600; font-size: 0.8rem">{{ s.label }}</div>
          <div style="font-family: monospace; font-size: 0.72rem; color: var(--primary); margin: 0.15rem 0">{{ s.token }}</div>
          <div style="font-size: 0.72rem; color: var(--muted-foreground)">{{ s.description }}</div>
        </div>
      </div>

    </div>
  `
})
class TokensStoryComponent {
  colorTokens = colorTokens;
  sidebarTokens = sidebarTokens;
  spacingTokens = spacingTokens;
}

const meta: Meta<TokensStoryComponent> = {
  title: 'Design Tokens',
  component: TokensStoryComponent,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<TokensStoryComponent>;

export const Tokens: Story = {};
