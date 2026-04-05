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
  styles: [`
    .login-bg {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
      background: #0a0f0d;
    }

    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.55;
      pointer-events: none;
    }
    .blob-1 {
      width: 520px; height: 520px;
      background: radial-gradient(circle, #1a7a3f, #0d3d20);
      top: -160px; left: -160px;
      animation: float1 10s ease-in-out infinite;
    }
    .blob-2 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, #22a55c, #145c34);
      bottom: -120px; right: -120px;
      animation: float2 13s ease-in-out infinite;
    }
    .blob-3 {
      width: 300px; height: 300px;
      background: radial-gradient(circle, #4ade80, #16a34a);
      top: 40%; left: 55%;
      animation: float3 9s ease-in-out infinite;
      opacity: 0.25;
    }

    @keyframes float1 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50%       { transform: translate(60px, 50px) scale(1.08); }
    }
    @keyframes float2 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50%       { transform: translate(-50px, -60px) scale(1.1); }
    }
    @keyframes float3 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33%       { transform: translate(-40px, 30px) scale(1.05); }
      66%       { transform: translate(30px, -40px) scale(0.95); }
    }

    .glass-card {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 400px;
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 1.5rem;
      padding: 2rem;
      box-shadow: 0 24px 64px rgba(0,0,0,0.4);
      animation: cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
    }

    @keyframes cardIn {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .tab-bar {
      display: flex;
      border-radius: 0.75rem;
      padding: 0.25rem;
      background: rgba(255,255,255,0.08);
      margin-bottom: 1.25rem;
    }
    .tab-btn {
      flex: 1;
      padding: 0.375rem 0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      color: rgba(255,255,255,0.5);
      background: transparent;
    }
    .tab-btn.active {
      background: rgba(255,255,255,0.14);
      color: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }

    .glass-input {
      width: 100%;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 0.75rem;
      padding: 0.7rem 0.9rem 0.7rem 2.4rem;
      color: #fff;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s, background 0.2s;
      box-sizing: border-box;
    }
    .glass-input::placeholder { color: rgba(255,255,255,0.35); }
    .glass-input:focus {
      border-color: #22a55c;
      background: rgba(255,255,255,0.1);
    }

    .input-wrap {
      position: relative;
      margin-bottom: 0.75rem;
    }
    .input-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1rem;
      color: rgba(255,255,255,0.4);
      pointer-events: none;
    }
    .eye-btn {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(255,255,255,0.4);
      padding: 0;
      display: flex;
    }

    .btn-primary {
      width: 100%;
      padding: 0.7rem;
      border-radius: 0.75rem;
      background: #22a55c;
      color: #fff;
      font-weight: 700;
      font-size: 0.9rem;
      border: none;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s, opacity 0.2s;
      margin-top: 1rem;
    }
    .btn-primary:hover:not(:disabled) { background: #1a8f4e; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .divider {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 1rem 0;
    }
    .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.1); }
    .divider-text { font-size: 0.75rem; color: rgba(255,255,255,0.35); }

    .btn-google {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 0.65rem;
      border-radius: 0.75rem;
      background: rgba(255,255,255,0.95);
      color: #3c4043;
      font-weight: 600;
      font-size: 0.875rem;
      border: none;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    .btn-google:hover:not(:disabled) { background: #fff; transform: translateY(-1px); }
    .btn-google:disabled { opacity: 0.6; cursor: not-allowed; }

    .forgot-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #4ade80;
      font-size: 0.75rem;
      padding: 0;
    }
    .back-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(255,255,255,0.5);
      font-size: 0.875rem;
      padding: 0;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-bottom: 0.75rem;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; vertical-align: middle; }
  `],
  template: `
    <div class="login-bg">
      <!-- Blobs animados -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>

      <!-- Card glassmorphism -->
      <div class="glass-card">

        <!-- Logo -->
        <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:1.75rem">
          <div style="width:3.5rem;height:3.5rem;border-radius:1rem;background:#22a55c;display:flex;align-items:center;justify-content:center;margin-bottom:0.75rem;box-shadow:0 8px 24px rgba(34,165,92,0.4)">
            <svg viewBox="0 0 64 64" width="30" height="30" fill="none">
              <rect x="6" y="8" width="52" height="48" rx="3" stroke="white" stroke-width="3" fill="none"/>
              <line x1="6" y1="32" x2="58" y2="32" stroke="white" stroke-width="2.5"/>
              <circle cx="32" cy="32" r="8" stroke="white" stroke-width="2.5" fill="none"/>
              <path d="M6 20 Q18 32 6 44" stroke="white" stroke-width="2.5" fill="none"/>
              <path d="M58 20 Q46 32 58 44" stroke="white" stroke-width="2.5" fill="none"/>
            </svg>
          </div>
          <h1 style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:1.35rem;color:#fff;margin:0">ArenaFlow</h1>
          <p style="font-size:0.8rem;color:rgba(255,255,255,0.45);margin:0.2rem 0 0">Gestão de arenas esportivas</p>
        </div>

        <!-- Tabs -->
        <div *ngIf="mode !== 'reset'" class="tab-bar">
          <button class="tab-btn" [class.active]="mode === 'login'"    (click)="setMode('login')">Entrar</button>
          <button class="tab-btn" [class.active]="mode === 'register'" (click)="setMode('register')">Cadastrar</button>
        </div>

        <!-- Reset header -->
        <div *ngIf="mode === 'reset'" style="margin-bottom:1.25rem">
          <button class="back-btn" (click)="setMode('login')">
            <span class="material-icons" style="font-size:1rem">arrow_back</span> Voltar
          </button>
          <p style="font-family:'Space Grotesk',sans-serif;font-weight:600;color:#fff;margin:0">Redefinir senha</p>
          <p style="font-size:0.78rem;color:rgba(255,255,255,0.45);margin:0.2rem 0 0">Enviaremos um link para o seu e-mail</p>
        </div>

        <!-- Campos -->
        <div *ngIf="mode === 'register'" class="input-wrap">
          <span class="material-icons input-icon">person</span>
          <input class="glass-input" [(ngModel)]="name" type="text" placeholder="Seu nome completo" autocomplete="name">
        </div>

        <div class="input-wrap">
          <span class="material-icons input-icon">mail</span>
          <input class="glass-input" [(ngModel)]="email" type="email" placeholder="E-mail" autocomplete="email">
        </div>

        <div *ngIf="mode !== 'reset'" class="input-wrap" style="margin-bottom:0.25rem">
          <span class="material-icons input-icon">lock</span>
          <input class="glass-input" style="padding-right:2.75rem"
                 [(ngModel)]="password"
                 [type]="showPass ? 'text' : 'password'"
                 [placeholder]="mode === 'register' ? 'Senha (mín. 6 caracteres)' : 'Senha'"
                 autocomplete="current-password">
          <button class="eye-btn" type="button" (click)="showPass = !showPass">
            <span class="material-icons" style="font-size:1rem">{{ showPass ? 'visibility_off' : 'visibility' }}</span>
          </button>
        </div>

        <div *ngIf="mode === 'login'" style="text-align:right;margin-bottom:0.25rem">
          <button class="forgot-btn" (click)="setMode('reset')">Esqueci minha senha</button>
        </div>

        <!-- Erro / sucesso -->
        <p *ngIf="error"   style="font-size:0.78rem;color:#f87171;margin:0.5rem 0 0">{{ error }}</p>
        <p *ngIf="success" style="font-size:0.78rem;color:#4ade80;margin:0.5rem 0 0">{{ success }}</p>

        <!-- Botão principal -->
        <button class="btn-primary" (click)="submit()" [disabled]="loading">
          <span *ngIf="loading" class="material-icons spin" style="font-size:1rem">refresh</span>
          {{ loading ? 'Aguarde...' : submitLabel }}
        </button>

        <!-- Divisor + Google -->
        <ng-container *ngIf="mode !== 'reset'">
          <div class="divider">
            <div class="divider-line"></div>
            <span class="divider-text">ou</span>
            <div class="divider-line"></div>
          </div>
          <button class="btn-google" (click)="loginWithGoogle()" [disabled]="loading">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6c1.8-5.4 6.9-9.8 13.6-9.8z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
              <path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/>
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.6 0-12.2-4.4-14.2-10.4l-7.8 6C6.6 42.6 14.6 48 24 48z"/>
            </svg>
            Continuar com Google
          </button>
        </ng-container>

        <p style="font-size:0.7rem;text-align:center;color:rgba(255,255,255,0.25);margin-top:1.25rem;margin-bottom:0">
          Ao entrar, você concorda com os termos de uso da plataforma.
        </p>
      </div>
    </div>
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

  setMode(m: Mode) { this.mode = m; this.error = ''; this.success = ''; }

  async submit() {
    this.error = ''; this.success = ''; this.loading = true;
    try {
      if (this.mode === 'login')         await this.auth.loginWithEmail(this.email, this.password), this.router.navigate(['/']);
      else if (this.mode === 'register') await this.auth.registerWithEmail(this.name, this.email, this.password), this.router.navigate(['/']);
      else { await this.auth.resetPassword(this.email); this.success = 'Link enviado! Verifique sua caixa de entrada.'; }
    } catch (e: any) {
      this.error = this.friendlyError(e.code);
    } finally { this.loading = false; }
  }

  async loginWithGoogle() {
    this.loading = true; this.error = '';
    try { await this.auth.loginWithGoogle(); this.router.navigate(['/']); }
    catch { this.error = 'Não foi possível entrar com Google. Tente novamente.'; this.loading = false; }
  }

  private friendlyError(code: string): string {
    const map: Record<string,string> = {
      'auth/invalid-email':        'E-mail inválido.',
      'auth/user-not-found':       'Nenhuma conta encontrada com este e-mail.',
      'auth/wrong-password':       'Senha incorreta.',
      'auth/invalid-credential':   'E-mail ou senha incorretos.',
      'auth/email-already-in-use': 'Este e-mail já está em uso.',
      'auth/weak-password':        'A senha deve ter pelo menos 6 caracteres.',
      'auth/too-many-requests':    'Muitas tentativas. Tente novamente mais tarde.',
    };
    return map[code] ?? 'Ocorreu um erro. Tente novamente.';
  }
}
