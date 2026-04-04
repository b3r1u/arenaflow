import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="min-h-screen flex items-center justify-center p-4" style="background:var(--background)">
      <div class="w-full max-w-sm">

        <!-- Logo -->
        <div class="flex flex-col items-center mb-8">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
               style="background:var(--primary);box-shadow:0 8px 24px rgba(34,197,94,0.35)">
            <svg viewBox="0 0 64 64" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="8" width="52" height="48" rx="3" stroke="white" stroke-width="3" fill="none"/>
              <line x1="6" y1="32" x2="58" y2="32" stroke="white" stroke-width="2.5"/>
              <circle cx="32" cy="32" r="8" stroke="white" stroke-width="2.5" fill="none"/>
              <path d="M6 20 Q18 32 6 44" stroke="white" stroke-width="2.5" fill="none"/>
              <path d="M58 20 Q46 32 58 44" stroke="white" stroke-width="2.5" fill="none"/>
            </svg>
          </div>
          <h1 class="font-heading font-bold text-2xl" style="color:var(--foreground)">ArenaFlow</h1>
          <p class="text-sm mt-1" style="color:var(--muted-foreground)">Gestão de arenas esportivas</p>
        </div>

        <!-- Card -->
        <div class="card p-8">
          <h2 class="font-heading font-semibold text-lg mb-1 text-center" style="color:var(--foreground)">Bem-vindo</h2>
          <p class="text-sm text-center mb-6" style="color:var(--muted-foreground)">Entre com sua conta Google para acessar</p>

          <button (click)="loginWithGoogle()" [disabled]="loading"
                  class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150"
                  style="border:1.5px solid var(--border);background:white;color:#3c4043;box-shadow:0 1px 3px rgba(0,0,0,0.08)"
                  onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.15)'"
                  onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.08)'">
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6c1.8-5.4 6.9-9.8 13.6-9.8z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
              <path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/>
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.6 0-12.2-4.4-14.2-10.4l-7.8 6C6.6 42.6 14.6 48 24 48z"/>
            </svg>
            {{ loading ? 'Entrando...' : 'Entrar com Google' }}
          </button>

          <p *ngIf="error" class="text-xs text-center mt-4" style="color:hsl(0,84%,60%)">{{ error }}</p>
        </div>

        <p class="text-xs text-center mt-6" style="color:var(--muted-foreground)">
          Ao entrar, você concorda com os termos de uso da plataforma.
        </p>
      </div>
    </div>
  `,
  imports: [CommonModule]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  loading = false;
  error = '';

  async loginWithGoogle() {
    this.loading = true;
    this.error = '';
    try {
      await this.auth.loginWithGoogle();
      this.router.navigate(['/']);
    } catch (e: any) {
      this.error = 'Não foi possível fazer login. Tente novamente.';
    } finally {
      this.loading = false;
    }
  }
}
