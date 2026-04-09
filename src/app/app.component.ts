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
    <div *ngIf="loading.isLoading()" class="vb-overlay">
      <div class="vb-center">
        <div class="vb-ball-wrap">
          <div class="vb-glow"></div>
          <svg class="vb-ball" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="43" fill="none" stroke="var(--primary)" stroke-width="3"/>
            <circle cx="50" cy="50" r="43" fill="var(--primary)" opacity="0.08"/>
            <path d="M 7,50 C 7,22 93,22 93,50" fill="none" stroke="var(--primary)" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M 7,50 C 7,78 93,78 93,50" fill="none" stroke="var(--primary)" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M 31,9 C 12,38 12,62 31,91"  fill="none" stroke="var(--primary)" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M 69,9 C 88,38 88,62 69,91"  fill="none" stroke="var(--primary)" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        </div>
        <p class="vb-label">Carregando...</p>
      </div>
    </div>

    <style>
      .vb-overlay {
        position: fixed; inset: 0; z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        background: color-mix(in srgb, var(--background) 82%, transparent);
        backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
        animation: vb-fade-in 0.18s ease;
      }
      .vb-center { display: flex; flex-direction: column; align-items: center; gap: 1.1rem; }
      .vb-ball-wrap {
        position: relative;
        width: clamp(4rem, 12vw, 6rem);
        height: clamp(4rem, 12vw, 6rem);
      }
      .vb-glow {
        position: absolute; inset: -0.6rem; border-radius: 50%;
        background: radial-gradient(circle, var(--primary), transparent 70%);
        animation: vb-glow-pulse 1.6s ease-in-out infinite;
      }
      .vb-ball {
        width: 100%; height: 100%;
        animation: vb-spin-open 2s ease-in-out infinite;
        position: relative; z-index: 1;
      }
      .vb-label {
        font-size: clamp(0.7rem, 2vw, 0.82rem); font-weight: 600;
        letter-spacing: 0.06em; color: var(--muted-foreground);
        text-transform: uppercase; margin: 0;
      }
      @keyframes vb-fade-in    { from { opacity: 0; } to { opacity: 1; } }
      @keyframes vb-glow-pulse { 0%,100% { transform:scale(1);   opacity:0.18; } 50% { transform:scale(1.4); opacity:0.06; } }
      @keyframes vb-spin-open  {
        0%   { transform: rotate(0deg)   scale(1);    }
        25%  { transform: rotate(90deg)  scale(1.14); }
        50%  { transform: rotate(180deg) scale(1);    }
        75%  { transform: rotate(270deg) scale(1.14); }
        100% { transform: rotate(360deg) scale(1);    }
      }
    </style>
  `
})
export class AppComponent {
  loading = inject(LoadingService);
}
