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
    <div *ngIf="loading.isLoading()"
         style="position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.35);backdrop-filter:blur(2px)">
      <div style="display:flex;flex-direction:column;align-items:center;gap:0.75rem">
        <svg width="56" height="56" viewBox="0 0 56 56" style="animation:vb-spin 0.9s linear infinite">
          <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="4"/>
          <circle cx="28" cy="28" r="24" fill="none" stroke="#22c55e" stroke-width="4"
                  stroke-dasharray="38 113" stroke-linecap="round"
                  style="animation:vb-dash 1.4s ease-in-out infinite"/>
          <!-- linhas do vôlei -->
          <line x1="28" y1="4"  x2="28" y2="52" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
          <path d="M4 28 Q16 18 28 28 Q40 38 52 28" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
          <path d="M4 28 Q16 38 28 28 Q40 18 52 28" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
        </svg>
        <span style="color:white;font-size:0.75rem;opacity:0.7;letter-spacing:0.05em">Carregando...</span>
      </div>
    </div>

    <style>
      @keyframes vb-spin { to { transform: rotate(360deg); } }
      @keyframes vb-dash  { 0%,100% { stroke-dashoffset: 0; } 50% { stroke-dashoffset: -75; } }
    </style>
  `
})
export class AppComponent {
  loading = inject(LoadingService);
}
