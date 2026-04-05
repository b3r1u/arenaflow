import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type Mode = 'login' | 'register' | 'reset';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        <div class="card p-6 rounded-2xl">

          <!-- Tabs Entrar / Cadastrar -->
          <div *ngIf="mode !== 'reset'" class="flex rounded-xl p-1 mb-5" style="background:var(--muted)">
            <button class="flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all"
                    [style.background]="mode === 'login' ? 'var(--card)' : 'transparent'"
                    [style.color]="mode === 'login' ? 'var(--foreground)' : 'var(--muted-foreground)'"
                    [style.box-shadow]="mode === 'login' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'"
                    (click)="setMode('login')">Entrar</button>
            <button class="flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all"
                    [style.background]="mode === 'register' ? 'var(--card)' : 'transparent'"
                    [style.color]="mode === 'register' ? 'var(--foreground)' : 'var(--muted-foreground)'"
                    [style.box-shadow]="mode === 'register' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'"
                    (click)="setMode('register')">Cadastrar</button>
          </div>

          <!-- Reset password header -->
          <div *ngIf="mode === 'reset'" class="mb-5">
            <button (click)="setMode('login')" class="flex items-center gap-1 text-sm mb-3"
                    style="background:none;border:none;cursor:pointer;color:var(--muted-foreground);padding:0">
              <span class="material-icons" style="font-size:1rem">arrow_back</span> Voltar
            </button>
            <h2 class="font-heading font-semibold text-base" style="color:var(--foreground)">Redefinir senha</h2>
            <p class="text-xs mt-0.5" style="color:var(--muted-foreground)">Enviaremos um link para o seu e-mail</p>
          </div>

          <!-- Campos -->
          <div class="space-y-3">

            <!-- Nome (só no cadastro) -->
            <div *ngIf="mode === 'register'" style="position:relative">
              <span class="material-icons" style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);font-size:1rem;color:var(--muted-foreground);pointer-events:none">person</span>
              <input class="input" style="padding-left:2.4rem" [(ngModel)]="name"
                     type="text" placeholder="Seu nome completo" autocomplete="name">
            </div>

            <!-- Email -->
            <div style="position:relative">
              <span class="material-icons" style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);font-size:1rem;color:var(--muted-foreground);pointer-events:none">mail</span>
              <input class="input" style="padding-left:2.4rem" [(ngModel)]="email"
                     type="email" placeholder="E-mail" autocomplete="email">
            </div>

            <!-- Senha (não aparece no reset) -->
            <div *ngIf="mode !== 'reset'" style="position:relative">
              <span class="material-icons" style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);font-size:1rem;color:var(--muted-foreground);pointer-events:none">lock</span>
              <input class="input" style="padding-left:2.4rem;padding-right:2.75rem"
                     [(ngModel)]="password"
                     [type]="showPass ? 'text' : 'password'"
                     [placeholder]="mode === 'register' ? 'Senha (mín. 6 caracteres)' : 'Senha'"
                     autocomplete="current-password">
              <button (click)="showPass = !showPass" type="button"
                      style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--muted-foreground);padding:0;display:flex">
                <span class="material-icons" style="font-size:1rem">{{ showPass ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>

            <!-- Esqueci a senha -->
            <div *ngIf="mode === 'login'" class="text-right">
              <button (click)="setMode('reset')"
                      class="text-xs" style="background:none;border:none;cursor:pointer;color:var(--primary)">
                Esqueci minha senha
              </button>
            </div>
          </div>

          <!-- Erro / sucesso -->
          <p *ngIf="error" class="text-xs mt-3" style="color:#ef4444">{{ error }}</p>
          <p *ngIf="success" class="text-xs mt-3" style="color:var(--primary)">{{ success }}</p>

          <!-- Botão principal -->
          <button (click)="submit()" [disabled]="loading"
                  class="w-full py-2.5 rounded-xl font-semibold text-sm mt-4 transition-all"
                  style="background:var(--primary);color:white;border:none;cursor:pointer;opacity:1"
                  [style.opacity]="loading ? '0.7' : '1'">
            <span *ngIf="loading" class="material-icons" style="font-size:1rem;vertical-align:middle;animation:spin 1s linear infinite">refresh</span>
            {{ loading ? 'Aguarde...' : submitLabel }}
          </button>

          <!-- Divisor (não aparece no reset) -->
          <div *ngIf="mode !== 'reset'" class="flex items-center gap-3 my-4">
            <div class="flex-1 h-px" style="background:var(--border)"></div>
            <span class="text-xs" style="color:var(--muted-foreground)">ou</span>
            <div class="flex-1 h-px" style="background:var(--border)"></div>
          </div>

          <!-- Google -->
          <button *ngIf="mode !== 'reset'" (click)="loginWithGoogle()" [disabled]="loading"
                  class="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
                  style="border:1.5px solid var(--border);background:white;color:#3c4043;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.08)"
                  onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.15)'"
                  onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.08)'">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6c1.8-5.4 6.9-9.8 13.6-9.8z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
              <path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/>
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.6 0-12.2-4.4-14.2-10.4l-7.8 6C6.6 42.6 14.6 48 24 48z"/>
            </svg>
            Continuar com Google
          </button>
        </div>

        <p class="text-xs text-center mt-6" style="color:var(--muted-foreground)">
          Ao entrar, você concorda com os termos de uso da plataforma.
        </p>
      </div>
    </div>

    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  mode: Mode = 'login';
  name = '';
  email = '';
  password = '';
  showPass = false;
  loading = false;
  error = '';
  success = '';

  get submitLabel() {
    if (this.mode === 'login')    return 'Entrar';
    if (this.mode === 'register') return 'Criar conta';
    return 'Enviar link de redefinição';
  }

  setMode(m: Mode) {
    this.mode = m;
    this.error = '';
    this.success = '';
  }

  async submit() {
    this.error = '';
    this.success = '';
    this.loading = true;
    try {
      if (this.mode === 'login') {
        await this.auth.loginWithEmail(this.email, this.password);
        this.router.navigate(['/']);
      } else if (this.mode === 'register') {
        await this.auth.registerWithEmail(this.name, this.email, this.password);
        this.router.navigate(['/']);
      } else {
        await this.auth.resetPassword(this.email);
        this.success = 'Link enviado! Verifique sua caixa de entrada.';
      }
    } catch (e: any) {
      this.error = this.friendlyError(e.code);
    } finally {
      this.loading = false;
    }
  }

  async loginWithGoogle() {
    this.loading = true;
    this.error = '';
    try {
      await this.auth.loginWithGoogle();
      this.router.navigate(['/']);
    } catch (e: any) {
      this.error = 'Não foi possível entrar com Google. Tente novamente.';
    } finally {
      this.loading = false;
    }
  }

  private friendlyError(code: string): string {
    switch (code) {
      case 'auth/invalid-email':            return 'E-mail inválido.';
      case 'auth/user-not-found':           return 'Nenhuma conta encontrada com este e-mail.';
      case 'auth/wrong-password':           return 'Senha incorreta.';
      case 'auth/invalid-credential':       return 'E-mail ou senha incorretos.';
      case 'auth/email-already-in-use':     return 'Este e-mail já está em uso.';
      case 'auth/weak-password':            return 'A senha deve ter pelo menos 6 caracteres.';
      case 'auth/too-many-requests':        return 'Muitas tentativas. Tente novamente mais tarde.';
      default:                              return 'Ocorreu um erro. Tente novamente.';
    }
  }
}
