import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <router-outlet />

    <!-- Loading overlay global -->
    <div *ngIf="loading.isLoading()" class="sp-overlay">
      <div class="sp-wrap">
        <svg class="sp-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Trilha externa -->
          <circle cx="50" cy="50" r="36" class="sp-track"/>
          <!-- Arco externo — gira sentido horário -->
          <circle cx="50" cy="50" r="36" class="sp-arc sp-arc-outer"/>
          <!-- Trilha interna -->
          <circle cx="50" cy="50" r="22" class="sp-track sp-track-inner"/>
          <!-- Arco interno — gira anti-horário -->
          <circle cx="50" cy="50" r="22" class="sp-arc sp-arc-inner"/>
          <!-- Centro pulsante -->
          <circle cx="50" cy="50" r="5" class="sp-dot"/>
        </svg>
      </div>
    </div>

    <style>
      .sp-overlay {
        position: fixed; inset: 0; z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        background: color-mix(in srgb, var(--background) 80%, transparent);
        backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        animation: sp-fade 0.18s ease;
      }
      .sp-wrap {
        width: clamp(4.5rem, 12vw, 5.5rem);
        height: clamp(4.5rem, 12vw, 5.5rem);
      }
      .sp-svg { width: 100%; height: 100%; }

      /* Trilhas (fundo dos anéis) */
      .sp-track {
        stroke: var(--primary);
        stroke-width: 3;
        opacity: 0.1;
      }
      .sp-track-inner { stroke-width: 2.5; }

      /* Arco externo: 270° horário, 1.3s */
      .sp-arc-outer {
        stroke: var(--primary);
        stroke-width: 3;
        stroke-linecap: round;
        stroke-dasharray: 169.6 226.2;
        transform-origin: 50px 50px;
        animation: sp-cw 1.3s cubic-bezier(0.4,0,0.2,1) infinite;
      }

      /* Arco interno: 180° anti-horário, 0.9s */
      .sp-arc-inner {
        stroke: var(--primary);
        stroke-width: 2.5;
        stroke-linecap: round;
        stroke-dasharray: 69.1 138.2;
        opacity: 0.65;
        transform-origin: 50px 50px;
        animation: sp-ccw 0.9s cubic-bezier(0.4,0,0.2,1) infinite;
      }

      /* Ponto central pulsante */
      .sp-dot {
        fill: var(--primary);
        animation: sp-pulse 1.3s ease-in-out infinite;
      }

      @keyframes sp-fade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes sp-cw   { to { transform: rotate(360deg); } }
      @keyframes sp-ccw  { to { transform: rotate(-360deg); } }
      @keyframes sp-pulse {
        0%, 100% { opacity: 0.5; r: 4; }
        50%       { opacity: 1;   r: 6; }
      }
    </style>
  `
})
export class AppComponent {
  loading = inject(LoadingService);
}
