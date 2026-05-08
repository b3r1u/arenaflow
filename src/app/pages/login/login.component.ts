import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EstablishmentService } from '../../services/establishment.service';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';

type Mode = 'login' | 'reset';
type Phase = 'browse' | 'selected' | 'payment';
type MobileStep = 'landing' | 'auth' | 'payment';

// Mapeamento de feature-key → { icon, title, desc } para o painel de detalhes
const FEATURE_MAP: Record<string, { icon: string; title: string; desc: string }> = {
  app_cliente:        { icon: 'smartphone',      title: 'App Cliente',           desc: 'Clientes reservam online 24h' },
  mensalistas:        { icon: 'card_membership', title: 'Mensalistas',           desc: 'Horários fixos semanais com PIX recorrente' },
  promotions:         { icon: 'local_offer',     title: 'Promoções & Eventos',   desc: 'Descontos e eventos exibidos no app' },
  advanced_reports:   { icon: 'bar_chart',       title: 'Relatórios Avançados',  desc: 'Faturamento, ocupação e performance' },
  split_payment:      { icon: 'group',           title: 'Divisão de Pagamento',  desc: 'Clientes dividem o custo da quadra' },
  dashboard_advanced: { icon: 'dashboard',       title: 'Dashboard Avançado',    desc: 'Métricas em tempo real completas' },
  multi_user:         { icon: 'manage_accounts', title: 'Multi-usuário',         desc: 'Múltiplos colaboradores no painel' },
};

function featureToDisplay(key: string): { icon: string; title: string; desc: string } {
  return FEATURE_MAP[key] ?? { icon: 'check_circle', title: key, desc: '' };
}

const PLAN_DESCS: Record<string, string> = {
  free:       'Para gestores que estão dando os primeiros passos na gestão esportiva.',
  pro:        'Para arenas em crescimento com mais quadras e recursos avançados.',
  enterprise: 'Para redes de arenas e operações profissionais de alto volume.',
};

interface PlanOption {
  id: string; name: string; priceLabel: string; price: number;
  courts: string; features: { icon: string; title: string; desc: string }[];
  available: boolean; popular: boolean; desc?: string;
  commission_pct: number;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    :host { display: block; }

    /* ── Globals ─────────────────────────────────── */
    * { box-sizing: border-box; }

    .login-root {
      height: 100vh; overflow: hidden;
      display: flex; position: relative;
      background: #050e09;
    }

    /* ── Blobs ───────────────────────────────────── */
    .blob { position:absolute; border-radius:50%; filter:blur(100px); pointer-events:none; z-index:0; }
    .b1 { width:600px; height:600px; background:radial-gradient(circle,#1a6b35,#062010); opacity:0.55; top:-200px; left:-200px; animation:f1 13s ease-in-out infinite; }
    .b2 { width:500px; height:500px; background:radial-gradient(circle,#145e2a,#031509); opacity:0.5; bottom:-180px; right:-180px; animation:f2 16s ease-in-out infinite; }
    .b3 { width:350px; height:350px; background:radial-gradient(circle,#4ade80,#16a34a); opacity:0.07; top:35%; left:45%; animation:f3 9s ease-in-out infinite; }
    @keyframes f1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(80px,60px) scale(1.12)} }
    @keyframes f2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-60px,-70px) scale(1.09)} }
    @keyframes f3 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-30px,20px)} 66%{transform:translate(22px,-28px)} }

    /* ── Animations ──────────────────────────────── */
    @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideInR  { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
    @keyframes slideInL  { from{opacity:0;transform:translateX(-28px)} to{opacity:1;transform:translateX(0)} }
    @keyframes featureIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.6} }
    @keyframes spin      { to{transform:rotate(360deg)} }

    .anim-fade-up  { animation: fadeUp   0.75s cubic-bezier(0.22,1,0.36,1) both; }
    .anim-slide-r  { animation: slideInR 0.75s cubic-bezier(0.22,1,0.36,1) both; }
    .anim-slide-l  { animation: slideInL 0.75s cubic-bezier(0.22,1,0.36,1) both; }
    .anim-card     { animation: fadeUp   0.65s cubic-bezier(0.22,1,0.36,1) both; }

    /* ─────────────────────────────────────────────
       MOBILE VIEW
    ───────────────────────────────────────────── */
    .mobile-view {
      display: flex; flex-direction: column;
      width: 100%; height: 100vh;
      position: relative; z-index: 10; overflow: hidden;
    }
    @media (min-width: 1024px) { .mobile-view { display: none; } }

    /* Mobile: landing (scrollable) */
    .m-landing { flex: 1; overflow-y: auto; overflow-x: hidden; transition: opacity 0.35s ease, transform 0.35s ease; }
    .m-landing.exiting { opacity: 0; transform: translateY(-12px); pointer-events: none; }
    .m-landing::-webkit-scrollbar { width: 3px; }
    .m-landing::-webkit-scrollbar-thumb { background: rgba(34,165,92,0.3); border-radius:2px; }

    /* Mobile: sticky top bar */
    .m-topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.875rem 1.25rem; position: sticky; top: 0; z-index: 20;
      background: rgba(5,14,9,0.85); backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    /* Mobile: hero */
    .m-hero {
      padding: 2.5rem 1.5rem 2rem; text-align: center;
    }
    .m-hero-icon {
      width: 4rem; height: 4rem; border-radius: 1.25rem;
      background: linear-gradient(135deg,#22a55c,#16a34a);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1rem;
      box-shadow: 0 12px 40px rgba(34,165,92,0.45);
    }

    /* Mobile: section */
    .m-section { padding: 1.75rem 1.25rem; }
    .m-section-title { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:1.1rem; color:#fff; margin:0 0 1.25rem; }

    /* Mobile: steps */
    .m-step {
      display: flex; align-items: flex-start; gap: 0.875rem; margin-bottom: 1.25rem;
    }
    .m-step-num {
      width: 2rem; height: 2rem; border-radius: 50%; flex-shrink: 0;
      background: rgba(34,165,92,0.15); border: 1.5px solid rgba(34,165,92,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.78rem; font-weight: 800; color: #4ade80; margin-top: 0.1rem;
    }

    /* Mobile: feature grid */
    .m-feat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; }
    .m-feat-card {
      padding: 1rem; border-radius: 1rem;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    }
    .m-feat-icon {
      width: 2.25rem; height: 2.25rem; border-radius: 0.625rem;
      background: rgba(34,165,92,0.14); display: flex; align-items: center; justify-content: center;
      margin-bottom: 0.5rem;
    }

    /* Mobile: plan section */
    .m-free-card {
      border-radius: 1.25rem; padding: 1.5rem;
      background: rgba(34,165,92,0.07); border: 1.5px solid rgba(34,165,92,0.28);
      position: relative; overflow: hidden; margin-bottom: 0.75rem;
    }
    .m-free-card::before {
      content:''; position:absolute; top:-80px; right:-80px;
      width:200px; height:200px; border-radius:50%;
      background: radial-gradient(circle,rgba(34,165,92,0.12),transparent);
    }
    .m-btn-free {
      width:100%; padding:0.85rem; border-radius:0.875rem;
      background:transparent; color:#fff;
      font-weight:700; font-size:0.9rem; border:1px solid rgba(255,255,255,0.2); cursor:pointer;
      transition:background 0.2s,border-color 0.2s,transform 0.15s;
      display:flex; align-items:center; justify-content:center; gap:0.5rem;
    }
    .m-btn-free:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.35); transform:translateY(-1px); }
    .m-paid-row { display:flex; gap:0.5rem; }
    .m-paid-chip {
      flex:1; padding:0.75rem 0.5rem; border-radius:0.875rem; text-align:center;
      background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07);
    }

    /* Mobile: footer */
    .m-footer {
      padding: 1rem 1.5rem 1.25rem;
      border-top: 1px solid rgba(255,255,255,0.07);
      background: rgba(255,255,255,0.015);
    }
    .solve-wordmark {
      display: inline-flex; align-items: center;
      font-family: 'Space Grotesk', system-ui, sans-serif;
      font-weight: 900; letter-spacing: -0.03em;
      line-height: 1;
    }

    /* Mobile: trial badge */
    .trial-badge {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.3rem 0.8rem; border-radius: 2rem;
      background: rgba(34,165,92,0.12); border: 1px solid rgba(34,165,92,0.28);
      color: #4ade80; font-size: 0.75rem; font-weight: 600;
    }

    /* Mobile: auth step */
    .m-auth {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 1.5rem 1.25rem; overflow-y: auto;
      animation: slideInR 0.55s cubic-bezier(0.22,1,0.36,1) both;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .m-auth.exiting { opacity: 0; transform: translateX(20px); pointer-events: none; }
    .m-plan-chip {
      width:100%; max-width:390px; display:flex; align-items:center;
      justify-content:space-between; gap:0.65rem; padding:0.7rem 1rem;
      border-radius:0.875rem; background:rgba(34,165,92,0.1);
      border:1px solid rgba(34,165,92,0.25); cursor:pointer;
      transition:background 0.2s; margin-bottom:0.75rem;
    }
    .m-plan-chip:hover { background:rgba(34,165,92,0.16); }

    /* ─────────────────────────────────────────────
       DESKTOP VIEW
    ───────────────────────────────────────────── */
    .desktop-view {
      display: none; width: 100%; height: 100%;
      position: relative; z-index: 10;
    }
    @media (min-width: 1024px) { .desktop-view { display: flex; } }

    /* Marketing column */
    .d-marketing {
      flex: 1 1 0; min-width: 0;
      overflow: hidden;
      display: flex; flex-direction: column;
      transition: flex-grow 1.4s cubic-bezier(0.16,1,0.3,1),
                  opacity 0.9s ease;
      will-change: flex-grow, opacity;
    }
    .d-marketing.collapsed { flex-grow: 0; opacity: 0; pointer-events: none; }
    .d-mkt-scroll {
      flex: 1; overflow-y: auto; overflow-x: hidden;
    }
    .d-mkt-scroll::-webkit-scrollbar { width: 3px; }
    .d-mkt-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px; }

    /* Login column */
    .d-login {
      flex: 0 0 420px; display: flex; align-items: center; justify-content: center;
      padding: 2rem; position: relative;
      border-left: 1px solid rgba(255,255,255,0.07);
      transition: flex-basis 1.2s cubic-bezier(0.16,1,0.3,1),
                  opacity 0.7s ease,
                  padding 1.2s ease,
                  border-color 1s ease;
      overflow: hidden;
    }
    .d-login.left-mode { border-left: none; border-right: 1px solid rgba(255,255,255,0.07); }
    .d-login.hidden { flex-basis: 0; opacity: 0; padding: 0; border-color: transparent; pointer-events: none; }

    /* Plan detail column */
    .d-detail {
      flex: 0 1 0; min-width: 0; overflow: hidden;
      position: relative;
      transition: flex-grow 1.4s cubic-bezier(0.16,1,0.3,1),
                  opacity 0.9s ease 0.55s;
      will-change: flex-grow, opacity;
      opacity: 0;
    }
    .d-detail.visible { flex-grow: 1; opacity: 1; }

    /* Desktop: marketing inner */
    .d-mkt-inner {
      padding: 2.5rem 3rem; flex: 1;
      display: flex; flex-direction: column; gap: 0;
    }

    .d-step-row { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    .d-step-card {
      flex: 1; padding: 0.875rem 0.75rem; border-radius: 0.875rem;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
      text-align: center;
    }
    .d-step-badge {
      width: 1.75rem; height: 1.75rem; border-radius: 50%;
      background: rgba(34,165,92,0.15); border: 1px solid rgba(34,165,92,0.25);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.72rem; font-weight: 800; color: #4ade80;
      margin: 0 auto 0.5rem;
    }

    .d-feat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1.5rem; }
    .d-feat-card {
      padding: 0.875rem; border-radius: 0.875rem;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
      display: flex; gap: 0.6rem; align-items: flex-start;
    }
    .d-feat-icon {
      width: 1.75rem; height: 1.75rem; flex-shrink: 0; border-radius: 0.45rem;
      background: rgba(34,165,92,0.14); display: flex; align-items: center; justify-content: center;
    }

    .d-plan-row { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    .d-plan-chip {
      flex: 1; padding: 0.7rem 0.5rem; border-radius: 0.75rem; text-align: center;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
      cursor: default; transition: all 0.2s;
    }
    .d-plan-chip.avail {
      background: rgba(34,165,92,0.08); border-color: rgba(34,165,92,0.28); cursor: pointer;
    }
    .d-plan-chip.avail:hover { background: rgba(34,165,92,0.14); border-color: rgba(34,165,92,0.45); transform: translateY(-1px); }

    .d-footer-strip {
      margin-top: 1.25rem; padding-top: 0.6rem;
      border-top: 1px solid rgba(255,255,255,0.06);
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 0.75rem;
    }

    /* ────────────────────────────────────────────
       DESKTOP: Plan detail creative panel
    ──────────────────────────────────────────── */
    .d-detail-bg {
      position: absolute; inset: 0; z-index: 0;
      background:
        radial-gradient(ellipse at 85% 10%, rgba(34,165,92,0.18) 0%, transparent 55%),
        radial-gradient(ellipse at 15% 90%, rgba(34,165,92,0.1) 0%, transparent 45%);
    }
    .d-detail-bg::after {
      content: ''; position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
      background-size: 44px 44px;
    }
    .d-detail-orb {
      position: absolute; top: -120px; right: -120px;
      width: 420px; height: 420px; border-radius: 50%;
      background: radial-gradient(circle, rgba(34,165,92,0.12) 0%, transparent 70%);
      filter: blur(40px); pointer-events: none;
    }

    .d-detail-content {
      position: relative; z-index: 1;
      padding: 2.5rem 3rem;
      height: 100%; display: flex; flex-direction: column;
      overflow-y: auto;
    }
    .d-detail-content::-webkit-scrollbar { width:3px; }
    .d-detail-content::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px; }

    .d-back-btn {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,0.35); font-size: 0.8rem; padding: 0;
      margin-bottom: 2rem; transition: color 0.2s; align-self: flex-start;
    }
    .d-back-btn:hover { color: rgba(255,255,255,0.7); }

    /* Plan hero section */
    .d-plan-hero {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 2rem; gap: 1rem;
    }
    .d-plan-tag {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.35rem 0.8rem; border-radius: 2rem; margin-bottom: 0.75rem;
      background: rgba(34,165,92,0.15); border: 1px solid rgba(34,165,92,0.3);
      color: #4ade80; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .d-plan-price-display {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(3rem, 5vw, 4.5rem);
      font-weight: 900; color: #fff; line-height: 0.95;
      letter-spacing: -0.02em;
    }
    .d-plan-price-sub { font-size: 0.85rem; color: rgba(255,255,255,0.4); margin-top: 0.35rem; font-weight: 400; }

    /* Trial callout */
    .d-trial-card {
      border-radius: 1.25rem; padding: 1.25rem 1.5rem; margin-bottom: 2rem;
      background: rgba(34,165,92,0.08);
      border: 1px solid rgba(34,165,92,0.22);
      display: flex; align-items: flex-start; gap: 1rem;
      position: relative; overflow: hidden;
    }
    .d-trial-card::before {
      content: ''; position: absolute; right: -20px; top: -20px;
      width: 120px; height: 120px; border-radius: 50%;
      background: radial-gradient(circle,rgba(34,165,92,0.15),transparent);
    }
    .d-trial-icon-wrap {
      width: 2.75rem; height: 2.75rem; flex-shrink: 0; border-radius: 0.875rem;
      background: rgba(34,165,92,0.18); display: flex; align-items: center; justify-content: center;
    }

    /* Feature cards 2x2 */
    .d-feature-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 2rem;
    }
    .d-feature-card {
      padding: 1.1rem; border-radius: 1rem;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      transition: background 0.2s, border-color 0.2s;
      animation: featureIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
    }
    .d-feature-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.13); }
    .d-feature-card-icon {
      width: 2.5rem; height: 2.5rem; border-radius: 0.75rem;
      background: rgba(34,165,92,0.14); display: flex; align-items: center; justify-content: center;
      margin-bottom: 0.65rem;
    }

    /* Other plans */
    /* Plan detail redesign */
    .d-plan-header-card {
      padding:1.25rem; border-radius:1rem;
      background:linear-gradient(135deg,rgba(34,165,92,0.14),rgba(16,163,74,0.05));
      border:1px solid rgba(34,165,92,0.22); margin-bottom:1.25rem;
      animation:slideInR 0.55s cubic-bezier(0.22,1,0.36,1) both;
    }
    .d-plan-feat-row {
      display:flex; align-items:flex-start; gap:0.75rem;
      padding:0.6rem 0; border-bottom:1px solid rgba(255,255,255,0.05);
      animation:featureIn 0.45s cubic-bezier(0.22,1,0.36,1) both;
    }
    .d-plan-feat-row:last-child { border-bottom:none; }
    .d-plan-feat-ico {
      width:2rem; height:2rem; border-radius:0.5rem;
      background:rgba(34,165,92,0.12);
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .plan-nav-strip {
      display:flex; gap:0.4rem; padding-top:1rem;
      margin-top:auto; border-top:1px solid rgba(255,255,255,0.07);
    }
    .plan-nav-pill {
      flex:1; padding:0.5rem 0.2rem; border-radius:0.65rem; text-align:center;
      font-size:0.68rem; font-weight:700; cursor:pointer; transition:all 0.18s;
      border:1px solid rgba(255,255,255,0.08); background:transparent;
      color:rgba(255,255,255,0.35); font-family:'Space Grotesk',sans-serif; line-height:1.3;
    }
    .plan-nav-pill.active {
      background:rgba(34,165,92,0.15); border-color:rgba(34,165,92,0.4); color:#4ade80;
    }
    .plan-nav-pill:hover:not(.active) { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.65); }
    .plan-nav-pill.unavail { opacity:0.35; cursor:default; pointer-events:none; }
    .d-other-section { margin-top: auto; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.07); }
    .d-other-grid { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
    .d-other-chip {
      flex: 1; padding: 0.65rem 0.5rem; border-radius: 0.75rem; text-align: center;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    }

    /* ── Auth card ──────────────────────────────── */
    .glass-card {
      width: 100%; max-width: 390px;
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
      border: 1px solid rgba(255,255,255,0.1); border-radius: 1.75rem;
      padding: 2rem 1.75rem; box-shadow: 0 32px 80px rgba(0,0,0,0.55);
    }

    .tab-bar { display:flex; border-radius:0.75rem; padding:0.25rem; background:rgba(255,255,255,0.07); margin-bottom:1.25rem; }
    .tab-btn { flex:1; padding:0.4rem 0; border-radius:0.55rem; font-size:0.875rem; font-weight:600; border:none; cursor:pointer; transition:all 0.2s; color:rgba(255,255,255,0.45); background:transparent; }
    .tab-btn.active { background:rgba(255,255,255,0.13); color:#fff; box-shadow:0 1px 6px rgba(0,0,0,0.25); }

    .glass-input { width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:0.75rem; padding:0.7rem 0.9rem 0.7rem 2.4rem; color:#fff; font-size:0.9rem; outline:none; transition:border-color 0.2s,background 0.2s; }
    .glass-input::placeholder { color:rgba(255,255,255,0.3); }
    .glass-input:focus { border-color:#22a55c; background:rgba(255,255,255,0.09); }

    .input-wrap { position:relative; margin-bottom:0.75rem; }
    .input-icon { position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); font-size:1rem; color:rgba(255,255,255,0.35); pointer-events:none; }
    .eye-btn { position:absolute; right:0.75rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:rgba(255,255,255,0.35); padding:0; display:flex; }

    .btn-primary { width:100%; padding:0.72rem; border-radius:0.75rem; background:linear-gradient(135deg,#22a55c,#16a34a); color:#fff; font-weight:700; font-size:0.9rem; border:none; cursor:pointer; transition:opacity 0.2s,transform 0.15s; margin-top:0.9rem; box-shadow:0 4px 16px rgba(34,165,92,0.35); display:flex; align-items:center; justify-content:center; gap:0.4rem; }
    .btn-primary:hover:not(:disabled) { opacity:0.9; transform:translateY(-1px); }
    .btn-primary:disabled { opacity:0.55; cursor:not-allowed; }

    .divider { display:flex; align-items:center; gap:0.75rem; margin:1rem 0; }
    .divider-line { flex:1; height:1px; background:rgba(255,255,255,0.1); }
    .divider-text { font-size:0.75rem; color:rgba(255,255,255,0.3); }

    .btn-google { width:100%; display:flex; align-items:center; justify-content:center; gap:0.75rem; padding:0.65rem; border-radius:0.75rem; background:rgba(255,255,255,0.92); color:#3c4043; font-weight:600; font-size:0.875rem; border:none; cursor:pointer; transition:background 0.2s,transform 0.15s; }
    .btn-google:hover:not(:disabled) { background:#fff; transform:translateY(-1px); }
    .btn-google:disabled { opacity:0.55; cursor:not-allowed; }

    .forgot-btn { background:none; border:none; cursor:pointer; color:#4ade80; font-size:0.75rem; padding:0; }
    .back-form-btn { background:none; border:none; cursor:pointer; color:rgba(255,255,255,0.45); font-size:0.875rem; padding:0; display:flex; align-items:center; gap:0.25rem; margin-bottom:0.75rem; }
    .spin-icon { animation:spin 1s linear infinite; }

    /* ── Stats strip ────────────────────────────── */
    .stats-strip { display:grid; grid-template-columns:repeat(4,1fr); background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:1.25rem; overflow:hidden; }
    .stats-col { padding:1.25rem 1rem; border-right:1px solid rgba(255,255,255,0.07); display:flex; flex-direction:column; align-items:flex-start; gap:0.35rem; }
    .stats-col:last-child { border-right:none; }
    @media (max-width:700px) {
      .stats-strip { grid-template-columns:repeat(2,1fr); }
      .stats-col:nth-child(2) { border-right:none; }
      .stats-col:nth-child(3), .stats-col:nth-child(4) { border-top:1px solid rgba(255,255,255,0.07); }
    }

    /* ── Feature cards ──────────────────────────── */
    .feat-grid-new { display:grid; grid-template-columns:repeat(2,1fr); gap:0.75rem; }
    .feat-card-new {
      border-radius:1rem; overflow:hidden; position:relative; aspect-ratio:4/3;
      display:flex; flex-direction:column; justify-content:flex-end; padding:1rem;
      background:linear-gradient(145deg,rgba(13,50,26,0.9),rgba(4,15,9,0.95));
      border:1px solid rgba(34,165,92,0.12); transition:border-color 0.2s,transform 0.2s;
    }
    .feat-card-new:hover { border-color:rgba(34,165,92,0.35); transform:translateY(-2px); }

    /* ── CTA block ──────────────────────────────── */
    .cta-block { border-radius:1.5rem; background:linear-gradient(135deg,#1c9e54,#127838); padding:2.5rem; position:relative; overflow:hidden; }
    @media (max-width:1023px) { .cta-block { padding:1.75rem 1.5rem; border-radius:1.25rem; } }
  `],
  template: `
    <div class="login-root">
      <div class="blob b1"></div>
      <div class="blob b2"></div>
      <div class="blob b3"></div>

      <!-- ══════════════════════════════════
           MOBILE
      ══════════════════════════════════ -->
      <div class="mobile-view">

        <!-- Landing (step: landing) -->
        <div *ngIf="mobileStep === 'landing'" class="m-landing" [class.exiting]="landingExiting">

          <!-- Top bar -->
          <div class="m-topbar">
            <div style="display:flex;align-items:center;gap:0.5rem">
              <div style="width:1.75rem;height:1.75rem;border-radius:0.45rem;background:linear-gradient(135deg,#22a55c,#16a34a);display:flex;align-items:center;justify-content:center">
                <span class="material-icons" style="font-size:1rem;color:white">sports_volleyball</span>
              </div>
              <div>
                <div style="font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:0.88rem;color:#fff;line-height:1">ArenaFlow</div>
                <div style="font-size:0.55rem;color:rgba(255,255,255,0.3);line-height:1.3">por Solve</div>
              </div>
            </div>
            <button (click)="goToLogin()" style="display:inline-flex;align-items:center;gap:0.3rem;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14);color:#fff;padding:0.38rem 0.9rem;border-radius:2rem;font-size:0.78rem;font-weight:600;cursor:pointer">
              Entrar <span class="material-icons" style="font-size:0.82rem">north_east</span>
            </button>
          </div>

          <!-- Hero + Stats com imagem de fundo -->
          <div style="position:relative;overflow:hidden">
            <img src="assets/quadraFTV.jpg" alt=""
                 style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:center 70%;z-index:0;opacity:0.58;pointer-events:none;display:block">
            <div style="position:absolute;inset:0;z-index:1;pointer-events:none;
                        background:linear-gradient(to right, rgba(5,14,9,0.9) 0%, rgba(5,14,9,0.55) 55%, rgba(5,14,9,0.1) 100%)"></div>
            <div style="position:absolute;inset:0;z-index:2;pointer-events:none;
                        background:linear-gradient(to bottom, transparent 40%, rgba(5,14,9,0.75) 72%, #050e09 100%)"></div>

            <div style="position:relative;z-index:3">

          <!-- Hero -->
          <div class="m-hero anim-fade-up" style="text-align:left;padding:2rem 1.5rem 1.5rem">
            <!-- Badge -->
            <div style="display:inline-flex;align-items:center;gap:0.42rem;background:rgba(34,165,92,0.1);border:1px solid rgba(34,165,92,0.28);border-radius:2rem;padding:0.25rem 0.75rem;margin-bottom:1.25rem">
              <span style="width:0.4rem;height:0.4rem;border-radius:50%;background:#4ade80;display:inline-block;animation:pulse 2s ease-in-out infinite"></span>
              <span style="font-size:0.65rem;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:0.07em">Software de Gestão</span>
            </div>
            <!-- Headline grande -->
            <h1 style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:2.5rem;color:#fff;margin:0 0 0.875rem;line-height:1.04;letter-spacing:-0.025em">
              GERENCIE<br>SUA ARENA<br><span style="color:#4ade80">COM<br>INTELIGÊNCIA</span>
            </h1>
            <p style="font-size:0.88rem;color:rgba(255,255,255,0.5);margin:0 0 1.75rem;line-height:1.6">
              Reservas online, gestão de quadras e relatórios em uma única plataforma.
            </p>
            <button class="m-btn-free" (click)="selectPlan(freePlan)">
              Começar gratuitamente
              <span class="material-icons" style="font-size:1rem">north_east</span>
            </button>
          </div>

          <!-- Etapa 2: Stats -->
          <div style="padding:0 1.25rem 2.5rem">
            <div class="stats-strip">
              <div class="stats-col">
                <span class="material-icons" style="font-size:1.1rem;color:#4ade80">emoji_events</span>
                <div style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.5rem;color:#fff;line-height:1">500+</div>
                <div style="font-size:0.6rem;font-weight:600;color:rgba(255,255,255,0.36);text-transform:uppercase;letter-spacing:0.04em">Arenas ativas</div>
              </div>
              <div class="stats-col">
                <span class="material-icons" style="font-size:1.1rem;color:#4ade80">schedule</span>
                <div style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.5rem;color:#fff;line-height:1">24h</div>
                <div style="font-size:0.6rem;font-weight:600;color:rgba(255,255,255,0.36);text-transform:uppercase;letter-spacing:0.04em">Reservas online</div>
              </div>
              <div class="stats-col">
                <span class="material-icons" style="font-size:1.1rem;color:#4ade80">verified_user</span>
                <div style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.5rem;color:#fff;line-height:1">99.9%</div>
                <div style="font-size:0.6rem;font-weight:600;color:rgba(255,255,255,0.36);text-transform:uppercase;letter-spacing:0.04em">Uptime</div>
              </div>
              <div class="stats-col">
                <span class="material-icons" style="font-size:1.1rem;color:#4ade80">bolt</span>
                <div style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.5rem;color:#fff;line-height:1">14d</div>
                <div style="font-size:0.6rem;font-weight:600;color:rgba(255,255,255,0.36);text-transform:uppercase;letter-spacing:0.04em">Trial grátis</div>
              </div>
            </div>
          </div>

            </div><!-- fim z-index:3 -->
          </div><!-- fim wrapper imagem hero mobile -->

          <!-- Etapa 3: Features -->
          <div style="padding:0 1.25rem 1.75rem">
            <div style="margin-bottom:1rem">
              <div style="display:inline-flex;align-items:center;gap:0.3rem;margin-bottom:0.4rem">
                <span style="width:0.45rem;height:0.45rem;background:#4ade80;border-radius:2px;display:inline-block"></span>
                <span style="font-size:0.62rem;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:0.07em">Recursos</span>
              </div>
              <h2 style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.6rem;color:#fff;margin:0;line-height:1.08;letter-spacing:-0.02em">
                TUDO QUE SUA<br><span style="color:#4ade80">ARENA PRECISA</span>
              </h2>
            </div>
            <div class="feat-grid-new">
              <div class="feat-card-new" *ngFor="let f of features | slice:0:4; let i = index">
                <img *ngIf="i === 0" src="assets/reservas-quadra.jpg" alt=""
                     style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;z-index:0;opacity:0.75;pointer-events:none">
                <img *ngIf="i === 1" src="assets/volei-quadra.jpg" alt=""
                     style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;z-index:0;opacity:0.75;pointer-events:none">
                <img *ngIf="i === 2" src="assets/grafico-quadra.jpg" alt=""
                     style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;z-index:0;opacity:0.75;pointer-events:none">
                <img *ngIf="i === 3" src="assets/jogadores-cadastro.jpg" alt=""
                     style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;z-index:0;opacity:0.75;pointer-events:none">
                <div style="position:absolute;inset:0;z-index:1;pointer-events:none"
                     [style.background]="'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.38) 45%, rgba(0,0,0,0.82) 100%)'">
                </div>
                <div style="position:absolute;top:0.75rem;left:0.75rem;width:2rem;height:2rem;border-radius:0.5rem;background:rgba(34,165,92,0.14);border:1px solid rgba(34,165,92,0.25);display:flex;align-items:center;justify-content:center;z-index:2">
                  <span class="material-icons" style="font-size:0.95rem;color:#4ade80">{{ f.icon }}</span>
                </div>
                <div style="position:relative;z-index:2">
                  <p style="margin:0 0 0.1rem;font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:0.72rem;color:#fff;text-transform:uppercase;letter-spacing:0.03em">{{ f.title }}</p>
                  <p style="margin:0;font-size:0.62rem;color:rgba(255,255,255,0.45);line-height:1.35">{{ f.desc }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Etapa 4: CTA -->
          <div style="padding:0 1.25rem 1.75rem">
            <div class="cta-block">
              <div style="position:absolute;top:-50px;right:-50px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.07);pointer-events:none"></div>
              <div style="position:absolute;bottom:-30px;left:-20px;width:130px;height:130px;border-radius:50%;background:rgba(0,0,0,0.08);pointer-events:none"></div>
              <div style="position:relative;z-index:1">
                <h2 style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.8rem;color:#fff;margin:0 0 0.65rem;line-height:1.06;letter-spacing:-0.02em">
                  PRONTO PARA<br>COMEÇAR?
                </h2>
                <p style="font-size:0.82rem;color:rgba(255,255,255,0.68);margin:0 0 1.25rem;line-height:1.55">
                  14 dias grátis, sem cartão de crédito. Cancele quando quiser.
                </p>
                <button (click)="selectPlan(freePlan)" style="display:inline-flex;align-items:center;gap:0.5rem;background:#050e09;border:none;color:#fff;padding:0.7rem 1.35rem;border-radius:2rem;font-size:0.85rem;font-weight:700;cursor:pointer;letter-spacing:0.01em">
                  Começar gratuitamente
                  <span class="material-icons" style="font-size:0.9rem">north_east</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Sobre (mobile) -->
          <div class="m-section" style="padding-top:0">
            <div style="display:inline-flex;align-items:center;gap:0.3rem;margin-bottom:0.75rem">
              <span style="width:0.45rem;height:0.45rem;background:#4ade80;border-radius:2px;display:inline-block"></span>
              <span style="font-size:0.62rem;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:0.07em">Sobre o ArenaFlow</span>
            </div>
            <h2 style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.55rem;color:#fff;margin:0 0 0.85rem;line-height:1.08;letter-spacing:-0.02em">
              UMA PLATAFORMA CRIADA PARA QUEM <span style="color:#4ade80">GERENCIA ARENAS</span>
            </h2>
            <p style="font-size:0.82rem;color:rgba(255,255,255,0.48);margin:0 0 0.75rem;line-height:1.6">
              O ArenaFlow nasceu de uma necessidade real: gestores perdiam horas com reservas por telefone, planilhas e anotações manuais. Queríamos mudar isso.
            </p>
            <p style="font-size:0.82rem;color:rgba(255,255,255,0.48);margin:0 0 1.25rem;line-height:1.6">
              Centralizamos tudo — reservas online 24h, financeiro, clientes e mensalistas — em um único painel acessível de qualquer dispositivo.
            </p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.55rem;margin-bottom:1.25rem">
              <div *ngFor="let p of sobrePilares" style="border-radius:0.875rem;padding:0.85rem 0.85rem 1rem;background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.07)">
                <div style="width:2rem;height:2rem;border-radius:0.5rem;background:rgba(34,165,92,0.14);border:1px solid rgba(34,165,92,0.22);display:flex;align-items:center;justify-content:center;margin-bottom:0.5rem">
                  <span class="material-icons" style="font-size:0.95rem;color:#4ade80">{{ p.icon }}</span>
                </div>
                <p style="margin:0 0 0.2rem;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:0.75rem;color:#fff">{{ p.title }}</p>
                <p style="margin:0;font-size:0.67rem;color:rgba(255,255,255,0.45);line-height:1.45">{{ p.desc }}</p>
              </div>
            </div>
            <!-- Card Solve mobile -->
            <div style="border-radius:1.25rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:1.25rem;display:flex;align-items:center;gap:1rem">
              <img src="assets/Solve_logo_fundo.png" alt="Solve" style="height:4.5rem;width:auto;flex-shrink:0">
              <div>
                <p style="margin:0 0 0.3rem;font-size:0.78rem;color:rgba(255,255,255,0.55);line-height:1.5">
                  Desenvolvido pela <strong style="color:rgba(255,255,255,0.8)">Solve</strong> — tecnologia para pequenos e médios negócios
                </p>
                <a href="mailto:connectsolve.ti@gmail.com" style="display:inline-flex;align-items:center;gap:0.35rem;color:#4ade80;font-size:0.7rem;text-decoration:none">
                  <span class="material-icons" style="font-size:0.78rem">mail</span>connectsolve.ti&#64;gmail.com
                </a>
              </div>
            </div>
          </div>

          <!-- Planos -->
          <div class="m-section" style="padding-top:0">
            <div style="display:inline-flex;align-items:center;gap:0.3rem;margin-bottom:0.5rem">
              <span style="width:0.42rem;height:0.42rem;background:#4ade80;border-radius:2px;display:inline-block"></span>
              <span style="font-size:0.6rem;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:0.07em">Planos</span>
            </div>
            <h2 style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.45rem;color:#fff;margin:0 0 1.1rem;line-height:1.08;letter-spacing:-0.02em">
              ESCOLHA SEU <span style="color:#4ade80">PLANO</span>
            </h2>

            <!-- Card Free -->
            <div (click)="selectPlan(freePlan)"
                 style="border-radius:1.25rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);padding:1.25rem;display:flex;flex-direction:column;margin-bottom:1rem;cursor:pointer">
              <p style="margin:0 0 0.5rem;font-size:0.65rem;font-weight:700;color:rgba(255,255,255,0.38);text-transform:uppercase;letter-spacing:0.07em">Free</p>
              <div style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:2.2rem;color:#fff;line-height:1;margin-bottom:0.15rem">Grátis</div>
              <p style="margin:0 0 0.85rem;font-size:0.65rem;color:rgba(255,255,255,0.3)">para sempre</p>
              <p style="margin:0 0 1rem;font-size:0.72rem;color:rgba(255,255,255,0.48);line-height:1.5">{{ freePlan.desc }}</p>
              <div style="display:flex;flex-direction:column;gap:0.45rem;margin-bottom:1rem">
                <div *ngFor="let f of freePlan.features" style="display:flex;align-items:center;gap:0.5rem">
                  <span class="material-icons" style="font-size:0.85rem;color:#4ade80;flex-shrink:0">check</span>
                  <span style="font-size:0.75rem;color:rgba(255,255,255,0.65)">{{ f.title }}</span>
                </div>
              </div>
              <!-- Taxa ArenaFlow -->
              <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.05);border-radius:0.65rem;padding:0.45rem 0.7rem;margin-bottom:1rem">
                <div style="display:flex;align-items:center;gap:0.4rem">
                  <span class="material-icons" style="font-size:0.8rem;color:rgba(255,255,255,0.35)">percent</span>
                  <span style="font-size:0.7rem;color:rgba(255,255,255,0.45)">Taxa sobre reservas</span>
                </div>
                <span style="font-size:0.7rem;font-weight:700;color:rgba(255,255,255,0.7)">{{ freePlan.commission_pct }}%</span>
              </div>
              <button class="m-btn-free">
                Escolher plano
              </button>
            </div>

            <!-- Cards pagos -->
            <div *ngFor="let p of paidPlans"
                 (click)="p.available && selectPlan(p)"
                 [style.cursor]="p.available ? 'pointer' : 'default'"
                 [style.border]="p.popular ? '1px solid rgba(34,165,92,0.4)' : '1px solid rgba(255,255,255,0.09)'"
                 [style.background]="p.popular ? 'rgba(34,165,92,0.06)' : 'rgba(255,255,255,0.04)'"
                 style="border-radius:1.25rem;padding:1.25rem;display:flex;flex-direction:column;margin-bottom:1rem;position:relative">
              <div *ngIf="p.popular" style="position:absolute;top:-0.6rem;left:1.25rem;background:linear-gradient(135deg,#22a55c,#16a34a);border-radius:2rem;padding:0.18rem 0.7rem;white-space:nowrap;display:flex;align-items:center">
                <span style="font-size:0.58rem;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:0.06em;line-height:1">Mais popular</span>
              </div>
              <p style="margin:0 0 0.5rem;font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em"
                 [style.color]="p.available ? '#4ade80' : 'rgba(255,255,255,0.28)'">{{ p.name }}</p>
              <div style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:2rem;line-height:1;margin-bottom:0.15rem"
                   [style.color]="p.available ? '#fff' : 'rgba(255,255,255,0.4)'">{{ p.priceLabel }}</div>
              <p style="margin:0 0 0.85rem;font-size:0.65rem;color:rgba(255,255,255,0.3)">/mês</p>
              <p style="margin:0 0 1rem;font-size:0.72rem;color:rgba(255,255,255,0.48);line-height:1.5">{{ p.desc || p.courts }}</p>
              <div style="display:flex;flex-direction:column;gap:0.45rem;margin-bottom:1rem">
                <div *ngFor="let f of p.features" style="display:flex;align-items:center;gap:0.5rem">
                  <span class="material-icons" style="font-size:0.85rem;flex-shrink:0"
                        [style.color]="p.available ? '#4ade80' : 'rgba(255,255,255,0.2)'">check</span>
                  <span style="font-size:0.75rem"
                        [style.color]="p.available ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.28)'">{{ f.title }}</span>
                </div>
              </div>
              <!-- Taxa ArenaFlow -->
              <div style="display:flex;align-items:center;justify-content:space-between;border-radius:0.65rem;padding:0.45rem 0.7rem;margin-bottom:1rem"
                   [style.background]="p.commission_pct === 0 ? 'rgba(34,165,92,0.12)' : 'rgba(255,255,255,0.05)'">
                <div style="display:flex;align-items:center;gap:0.4rem">
                  <span class="material-icons" style="font-size:0.8rem"
                        [style.color]="p.commission_pct === 0 ? '#4ade80' : 'rgba(255,255,255,0.35)'">
                    {{ p.commission_pct === 0 ? 'check_circle' : 'percent' }}
                  </span>
                  <span style="font-size:0.7rem;color:rgba(255,255,255,0.45)">Taxa sobre reservas</span>
                </div>
                <span style="font-size:0.7rem;font-weight:700"
                      [style.color]="p.commission_pct === 0 ? '#4ade80' : 'rgba(255,255,255,0.7)'">
                  {{ p.commission_pct === 0 ? 'Isento' : p.commission_pct + '%' }}
                </span>
              </div>
              <button [disabled]="!p.available"
                      [style.color]="p.available ? '#fff' : 'rgba(255,255,255,0.28)'"
                      [style.cursor]="p.available ? 'pointer' : 'default'"
                      [style.border]="p.available ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.08)'"
                      style="width:100%;padding:0.7rem;border-radius:0.875rem;font-weight:700;font-size:0.82rem;font-family:'Space Grotesk',sans-serif;background:transparent;transition:background 0.2s,border-color 0.2s,transform 0.15s"
                      onmouseover="if(!this.disabled){this.style.background='rgba(255,255,255,0.08)';this.style.borderColor='rgba(255,255,255,0.35)';this.style.transform='translateY(-1px)'}"
                      onmouseout="this.style.background='transparent';this.style.borderColor='rgba(255,255,255,0.2)';this.style.transform='translateY(0)'">
                {{ p.available ? 'Escolher plano' : 'Em breve' }}
              </button>
            </div>
          </div>

          <!-- Footer Solve -->
          <div class="m-footer">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem">
              <img src="assets/Solve_logo_fundo.png" alt="Solve" style="height:10rem;width:auto;display:block">
              <p style="margin:0;font-size:0.75rem;color:rgba(255,255,255,0.35)">Tecnologia para o seu negócio</p>
            </div>
            <p style="font-size:0.78rem;color:rgba(255,255,255,0.4);margin:0 0 1.25rem;line-height:1.5">
              ArenaFlow é desenvolvido e mantido pela <strong style="color:rgba(255,255,255,0.6)">Solve</strong>, uma empresa focada em criar soluções tecnológicas acessíveis para pequenos e médios negócios.
            </p>
            <div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1.25rem">
              <a href="mailto:connectsolve.ti@gmail.com" style="display:flex;align-items:center;gap:0.5rem;color:rgba(255,255,255,0.45);font-size:0.78rem;text-decoration:none;transition:color 0.2s" onmouseover="this.style.color='rgba(255,255,255,0.75)'" onmouseout="this.style.color='rgba(255,255,255,0.45)'">
                <span class="material-icons" style="font-size:0.9rem">mail</span>
                connectsolve.ti&#64;gmail.com
              </a>
              <a href="https://www.instagram.com/solve.ti" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:0.5rem;color:rgba(255,255,255,0.45);font-size:0.78rem;text-decoration:none;transition:color 0.2s" onmouseover="this.style.color='rgba(255,255,255,0.75)'" onmouseout="this.style.color='rgba(255,255,255,0.45)'">
                <span class="material-icons" style="font-size:0.9rem">photo_camera</span>
                &#64;solve.ti
              </a>
            </div>
            <p style="font-size:0.68rem;color:rgba(255,255,255,0.18);margin:0">© 2025 Solve. Todos os direitos reservados.</p>
          </div>
        </div>

        <!-- Auth step -->
        <div *ngIf="mobileStep === 'auth'" class="m-auth" [class.exiting]="authExiting">
          <div *ngIf="selectedPlan" class="m-plan-chip anim-slide-r" (click)="backToLanding()">
            <div style="display:flex;align-items:center;gap:0.65rem">
              <div style="width:2rem;height:2rem;border-radius:0.5rem;background:rgba(34,165,92,0.18);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span class="material-icons" style="font-size:1rem;color:#4ade80">check</span>
              </div>
              <div>
                <p style="margin:0;font-size:0.78rem;font-weight:700;color:#fff">Plano {{ selectedPlan.name }} selecionado</p>
                <p style="margin:0;font-size:0.7rem;color:rgba(255,255,255,0.38)">Toque para trocar o plano</p>
              </div>
            </div>
            <span class="material-icons" style="font-size:1rem;color:rgba(255,255,255,0.28)">chevron_right</span>
          </div>
          <div *ngIf="!selectedPlan" style="width:100%;max-width:390px;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:0.5rem">
              <div style="width:1.75rem;height:1.75rem;border-radius:0.45rem;background:linear-gradient(135deg,#22a55c,#16a34a);display:flex;align-items:center;justify-content:center">
                <span class="material-icons" style="font-size:1rem;color:white">sports_volleyball</span>
              </div>
              <div>
                <div style="font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:0.88rem;color:#fff;line-height:1">ArenaFlow</div>
                <div style="font-size:0.55rem;color:rgba(255,255,255,0.3);line-height:1.3">por Solve</div>
              </div>
            </div>
            <button (click)="backToLanding()" style="display:inline-flex;align-items:center;gap:0.3rem;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14);color:rgba(255,255,255,0.7);padding:0.35rem 0.85rem;border-radius:2rem;font-size:0.75rem;font-weight:600;cursor:pointer;transition:background 0.2s" onmouseover="this.style.background='rgba(255,255,255,0.13)'" onmouseout="this.style.background='rgba(255,255,255,0.07)'">
              <span class="material-icons" style="font-size:0.85rem">arrow_back</span> Voltar
            </button>
          </div>
          <div class="glass-card anim-slide-r" style="margin-top:0.75rem">
            <ng-container *ngTemplateOutlet="selectedPlan && selectedPlan.price > 0 ? cardForm : authForm"></ng-container>
          </div>
        </div>

        <!-- Payment step (mobile) -->
        <div *ngIf="mobileStep === 'payment'" class="m-auth">
          <div class="glass-card anim-slide-r" style="margin-top:0.75rem">
            <ng-container *ngTemplateOutlet="cardForm"></ng-container>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════
           DESKTOP
      ══════════════════════════════════ -->
      <div class="desktop-view">

        <!-- Col 1: Marketing -->
        <div class="d-marketing" [class.collapsed]="phase === 'selected'">
          <!-- ── Nav (fora do scroll) ──────────────── -->
          <nav style="flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:1.1rem 2.5rem;z-index:10;background:rgba(5,14,9,0.92);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,0.05)">
            <div style="display:flex;align-items:center;gap:0.55rem">
              <div style="width:2rem;height:2rem;border-radius:0.5rem;background:linear-gradient(135deg,#22a55c,#16a34a);display:flex;align-items:center;justify-content:center">
                <span class="material-icons" style="font-size:1.1rem;color:#fff">sports_volleyball</span>
              </div>
              <div>
                <div style="font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:0.92rem;color:#fff;line-height:1">ArenaFlow</div>
                <div style="font-size:0.57rem;color:rgba(255,255,255,0.3);line-height:1.3">por Solve</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:1.75rem">
              <span (click)="scrollToSection('section-planos')" style="font-size:0.78rem;color:rgba(255,255,255,0.38);letter-spacing:0.01em;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='rgba(255,255,255,0.8)'" onmouseout="this.style.color='rgba(255,255,255,0.38)'">Planos</span>
              <span (click)="scrollToSection('section-recursos')" style="font-size:0.78rem;color:rgba(255,255,255,0.38);letter-spacing:0.01em;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='rgba(255,255,255,0.8)'" onmouseout="this.style.color='rgba(255,255,255,0.38)'">Recursos</span>
              <span (click)="scrollToSection('section-sobre')" style="font-size:0.78rem;color:rgba(255,255,255,0.38);letter-spacing:0.01em;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='rgba(255,255,255,0.8)'" onmouseout="this.style.color='rgba(255,255,255,0.38)'">Sobre</span>
            </div>
            <button (click)="goToLogin()" style="display:inline-flex;align-items:center;gap:0.35rem;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14);color:#fff;padding:0.38rem 1rem;border-radius:2rem;font-size:0.78rem;font-weight:600;cursor:pointer;transition:background 0.2s" onmouseover="this.style.background='rgba(255,255,255,0.13)'" onmouseout="this.style.background='rgba(255,255,255,0.07)'">
              <ng-container *ngIf="showLoginForm && phase === 'browse'">Fechar <span class="material-icons" style="font-size:0.85rem">close</span></ng-container>
              <ng-container *ngIf="!(showLoginForm && phase === 'browse')">Entrar <span class="material-icons" style="font-size:0.85rem">north_east</span></ng-container>
            </button>
          </nav>

          <!-- ── Conteúdo rolável ───────────────────── -->
          <div class="d-mkt-scroll">
          <div class="d-mkt-inner anim-fade-up" style="padding:0">

            <!-- ══════════════════════════════════════════
                 HERO + STATS — wrapper com imagem de fundo
            ══════════════════════════════════════════ -->
            <div style="position:relative;overflow:hidden">

              <!-- Imagem de fundo: ocupa todo o wrapper (hero + stats) -->
              <img src="assets/quadraFTV.jpg" alt=""
                   style="position:absolute;top:0;left:0;width:100%;height:100%;
                          object-fit:cover;object-position:center 70%;
                          z-index:0;opacity:0.62;pointer-events:none;
                          display:block">

              <!-- Camada 1 – escurece a esquerda p/ legibilidade do texto -->
              <div style="position:absolute;inset:0;z-index:1;pointer-events:none;
                          background:linear-gradient(to right,
                            rgba(5,14,9,0.92) 0%,
                            rgba(5,14,9,0.70) 28%,
                            rgba(5,14,9,0.20) 58%,
                            transparent      100%)">
              </div>

              <!-- Camada 2 – degradê vertical: visível no topo, some completamente no fundo -->
              <div style="position:absolute;inset:0;z-index:2;pointer-events:none;
                          background:linear-gradient(to bottom,
                            transparent           0%,
                            rgba(5,14,9,0.0)     40%,
                            rgba(5,14,9,0.55)    68%,
                            rgba(5,14,9,0.92)    84%,
                            #050e09              100%)">
              </div>

              <!-- Conteúdo: hero + stats em z-index:3 acima de tudo -->
              <div style="position:relative;z-index:3">

                <!-- ── Hero ──────────────────────────── -->
                <div style="display:flex;align-items:center;gap:2rem;padding:3.5rem 2.5rem 2.5rem">

                  <!-- Texto -->
                  <div style="flex:1;min-width:0">
                    <div style="display:inline-flex;align-items:center;gap:0.45rem;background:rgba(34,165,92,0.1);border:1px solid rgba(34,165,92,0.28);border-radius:2rem;padding:0.28rem 0.8rem;margin-bottom:1.5rem">
                      <span style="width:0.42rem;height:0.42rem;border-radius:50%;background:#4ade80;display:inline-block;animation:pulse 2s ease-in-out infinite"></span>
                      <span style="font-size:0.67rem;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:0.08em">Software de Gestão Esportiva</span>
                    </div>
                    <h1 style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:clamp(2.1rem,3vw,3.4rem);color:#fff;margin:0 0 1rem;line-height:1.04;letter-spacing:-0.025em">
                      GERENCIE<br>SUA ARENA<br><span style="color:#4ade80">COM INTELIGÊNCIA</span>
                    </h1>
                    <p style="font-size:0.875rem;color:rgba(255,255,255,0.5);margin:0 0 2rem;line-height:1.65;max-width:360px">
                      Reservas online, gestão de quadras, mensalistas e relatórios em uma plataforma completa para sua arena esportiva.
                    </p>
                    <button (click)="selectPlan(freePlan)" style="display:inline-flex;align-items:center;gap:0.5rem;background:linear-gradient(135deg,#22a55c,#16a34a);border:none;color:#fff;padding:0.8rem 1.75rem;border-radius:2rem;font-size:0.9rem;font-weight:700;cursor:pointer;letter-spacing:0.01em;box-shadow:0 6px 28px rgba(34,165,92,0.38);transition:opacity 0.2s,transform 0.15s" onmouseover="this.style.opacity='0.88';this.style.transform='translateY(-2px)'" onmouseout="this.style.opacity='1';this.style.transform='translateY(0)'">
                      Começar gratuitamente
                      <span class="material-icons" style="font-size:1rem">north_east</span>
                    </button>
                  </div>

                  <!-- Visual card -->
                  <div style="flex:0 0 auto;width:clamp(180px,24%,250px);position:relative">
                    <div style="border-radius:1.5rem;overflow:hidden;position:relative;aspect-ratio:3/4;background:linear-gradient(150deg,#0d3320 0%,#072414 50%,#040f09 100%);border:1px solid rgba(34,165,92,0.18)">
                      <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(34,165,92,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(34,165,92,0.05) 1px,transparent 1px);background-size:28px 28px"></div>
                      <div style="position:absolute;top:-50px;right:-50px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(34,165,92,0.22),transparent 70%);filter:blur(24px)"></div>
                      <div style="position:absolute;bottom:-40px;left:-40px;width:140px;height:140px;border-radius:50%;background:radial-gradient(circle,rgba(34,165,92,0.12),transparent 70%);filter:blur(20px)"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:0.5rem">
                        <span class="material-icons" style="font-size:4.5rem;color:rgba(34,165,92,0.45)">sports_volleyball</span>
                        <span style="font-family:'Space Grotesk',sans-serif;font-size:0.6rem;font-weight:700;color:rgba(255,255,255,0.12);text-transform:uppercase;letter-spacing:0.14em">ArenaFlow</span>
                      </div>
                      <div style="position:absolute;bottom:0;left:12%;right:12%;height:32%;border-top:1.5px solid rgba(34,165,92,0.13);border-left:1.5px solid rgba(34,165,92,0.08);border-right:1.5px solid rgba(34,165,92,0.08)"></div>
                    </div>
                    <!-- Mini card: reservas -->
                    <div style="position:absolute;top:-14px;left:-24px;background:rgba(5,14,9,0.93);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.09);border-radius:0.875rem;padding:0.5rem 0.8rem;box-shadow:0 8px 28px rgba(0,0,0,0.45);white-space:nowrap;animation:fadeUp 0.6s 0.4s both">
                      <div style="font-size:0.52rem;font-weight:600;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:0.15rem">Reservas hoje</div>
                      <div style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.05rem;color:#4ade80">24</div>
                    </div>
                    <!-- Mini card: faturamento -->
                    <div style="position:absolute;bottom:24px;right:-28px;background:rgba(5,14,9,0.93);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.09);border-radius:0.875rem;padding:0.5rem 0.8rem;box-shadow:0 8px 28px rgba(0,0,0,0.45);white-space:nowrap;animation:fadeUp 0.6s 0.6s both">
                      <div style="font-size:0.52rem;font-weight:600;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:0.15rem">Faturamento mês</div>
                      <div style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.05rem;color:#fff">R$ 4.800</div>
                    </div>
                  </div>
                </div><!-- fim hero row -->

                <!-- ── Stats ──────────────────────────── -->
                <div style="padding:0 2.5rem 3.5rem">
                  <div class="stats-strip">
                    <div class="stats-col">
                      <span class="material-icons" style="font-size:1.25rem;color:#4ade80">emoji_events</span>
                      <div style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.7rem;color:#fff;line-height:1">500+</div>
                      <div style="font-size:0.62rem;font-weight:600;color:rgba(255,255,255,0.36);text-transform:uppercase;letter-spacing:0.05em">Arenas ativas</div>
                    </div>
                    <div class="stats-col">
                      <span class="material-icons" style="font-size:1.25rem;color:#4ade80">schedule</span>
                      <div style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.7rem;color:#fff;line-height:1">24h</div>
                      <div style="font-size:0.62rem;font-weight:600;color:rgba(255,255,255,0.36);text-transform:uppercase;letter-spacing:0.05em">Reservas online</div>
                    </div>
                    <div class="stats-col">
                      <span class="material-icons" style="font-size:1.25rem;color:#4ade80">verified_user</span>
                      <div style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.7rem;color:#fff;line-height:1">99.9%</div>
                      <div style="font-size:0.62rem;font-weight:600;color:rgba(255,255,255,0.36);text-transform:uppercase;letter-spacing:0.05em">Uptime garantido</div>
                    </div>
                    <div class="stats-col">
                      <span class="material-icons" style="font-size:1.25rem;color:#4ade80">bolt</span>
                      <div style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.7rem;color:#fff;line-height:1">14d</div>
                      <div style="font-size:0.62rem;font-weight:600;color:rgba(255,255,255,0.36);text-transform:uppercase;letter-spacing:0.05em">Trial gratuito</div>
                    </div>
                  </div>
                </div><!-- fim stats -->

              </div><!-- fim z-index:3 -->
            </div><!-- fim wrapper com imagem de fundo -->

            <!-- ── Etapa 3: Features ──────────────── -->
            <div id="section-recursos" style="padding:0 2.5rem 2rem">
              <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;margin-bottom:1.25rem">
                <div>
                  <div style="display:inline-flex;align-items:center;gap:0.3rem;margin-bottom:0.5rem">
                    <span style="width:0.5rem;height:0.5rem;background:#4ade80;border-radius:2px;display:inline-block"></span>
                    <span style="font-size:0.63rem;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:0.07em">Recursos</span>
                  </div>
                  <h2 style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:clamp(1.35rem,2vw,1.8rem);color:#fff;margin:0;line-height:1.08;letter-spacing:-0.02em">
                    TUDO QUE SUA<br><span style="color:#4ade80">ARENA PRECISA</span>
                  </h2>
                </div>
                <p style="font-size:0.72rem;color:rgba(255,255,255,0.32);max-width:190px;text-align:right;line-height:1.5;flex-shrink:0;margin:0">
                  Uma plataforma completa para gestão esportiva profissional
                </p>
              </div>
              <div class="feat-grid-new">
                <div class="feat-card-new" *ngFor="let f of features | slice:0:4; let i = index" [style.animation-delay]="(i * 0.08) + 's'">
                  <!-- Imagem de fundo apenas no card de Reservas Online 24h (i=0) -->
                  <img *ngIf="i === 0" src="assets/reservas-quadra.jpg" alt=""
                       style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;z-index:0;opacity:0.75;pointer-events:none">
                  <img *ngIf="i === 1" src="assets/volei-quadra.jpg" alt=""
                       style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;z-index:0;opacity:0.75;pointer-events:none">
                  <img *ngIf="i === 2" src="assets/grafico-quadra.jpg" alt=""
                       style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;z-index:0;opacity:0.75;pointer-events:none">
                  <img *ngIf="i === 3" src="assets/jogadores-cadastro.jpg" alt=""
                       style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;z-index:0;opacity:0.75;pointer-events:none">
                  <!-- Overlay: sombra geral + degradê mais forte no bottom -->
                  <div style="position:absolute;inset:0;z-index:1;pointer-events:none"
                       [style.background]="'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.38) 45%, rgba(0,0,0,0.82) 100%)'">
                  </div>
                  <div style="position:absolute;top:0.85rem;left:0.85rem;width:2.1rem;height:2.1rem;border-radius:0.55rem;background:rgba(34,165,92,0.14);border:1px solid rgba(34,165,92,0.25);display:flex;align-items:center;justify-content:center;z-index:2">
                    <span class="material-icons" style="font-size:1rem;color:#4ade80">{{ f.icon }}</span>
                  </div>
                  <div style="position:relative;z-index:2">
                    <p style="margin:0 0 0.15rem;font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:0.78rem;color:#fff;text-transform:uppercase;letter-spacing:0.03em">{{ f.title }}</p>
                    <p style="margin:0;font-size:0.65rem;color:rgba(255,255,255,0.45);line-height:1.35">{{ f.desc }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── Etapa 4: CTA ───────────────────── -->
            <div style="padding:0 2.5rem 2rem">
              <div class="cta-block">
                <div style="position:absolute;top:-70px;right:-70px;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,0.07);pointer-events:none"></div>
                <div style="position:absolute;bottom:-50px;left:-30px;width:180px;height:180px;border-radius:50%;background:rgba(0,0,0,0.08);pointer-events:none"></div>
                <div style="position:relative;z-index:1">
                  <h2 style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:clamp(1.6rem,2.4vw,2.2rem);color:#fff;margin:0 0 0.7rem;line-height:1.06;letter-spacing:-0.025em">
                    PRONTO PARA<br>COMEÇAR?
                  </h2>
                  <p style="font-size:0.85rem;color:rgba(255,255,255,0.68);margin:0 0 1.5rem;line-height:1.6;max-width:320px">
                    Comece a gerenciar sua arena de forma profissional. 14 dias grátis, sem cartão de crédito.
                  </p>
                  <button (click)="selectPlan(freePlan)" style="display:inline-flex;align-items:center;gap:0.5rem;background:#050e09;border:none;color:#fff;padding:0.75rem 1.5rem;border-radius:2rem;font-size:0.88rem;font-weight:700;cursor:pointer;transition:opacity 0.2s,transform 0.15s;letter-spacing:0.01em" onmouseover="this.style.opacity='0.82';this.style.transform='translateY(-2px)'" onmouseout="this.style.opacity='1';this.style.transform='translateY(0)'">
                    Começar gratuitamente
                    <span class="material-icons" style="font-size:0.95rem">north_east</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- ── Sobre ──────────────────────────── -->
            <div id="section-sobre" style="padding:0 2.5rem 2rem">
              <div style="display:inline-flex;align-items:center;gap:0.3rem;margin-bottom:0.75rem">
                <span style="width:0.5rem;height:0.5rem;background:#4ade80;border-radius:2px;display:inline-block"></span>
                <span style="font-size:0.63rem;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:0.07em">Sobre o ArenaFlow</span>
              </div>

              <!-- Título + texto (largura total) -->
              <h2 style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:clamp(1.35rem,2vw,1.8rem);color:#fff;margin:0 0 1rem;line-height:1.08;letter-spacing:-0.02em">
                UMA PLATAFORMA CRIADA<br>PARA QUEM <span style="color:#4ade80">GERENCIA ARENAS</span>
              </h2>
              <p style="font-size:0.82rem;color:rgba(255,255,255,0.5);margin:0 0 1.25rem;line-height:1.65;max-width:680px">
                O ArenaFlow nasceu de uma necessidade real: gestores perdiam horas com reservas por telefone e planilhas. Nossa plataforma centraliza tudo — reservas 24h, financeiro, clientes e mensalistas — em um único painel acessível de qualquer dispositivo.
              </p>

              <!-- Pilares + Card Solve alinhados na mesma linha -->
              <div style="display:flex;gap:0.65rem;align-items:stretch">

                <!-- Grid 2×2 de pilares -->
                <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:0.65rem">
                  <div *ngFor="let p of sobrePilares" style="border-radius:1rem;padding:1rem 1rem 1.1rem;background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.07);transition:border-color 0.2s,background 0.2s" onmouseover="this.style.background='rgba(255,255,255,0.06)';this.style.borderColor='rgba(34,165,92,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.035)';this.style.borderColor='rgba(255,255,255,0.07)'">
                    <div style="width:2.25rem;height:2.25rem;border-radius:0.625rem;background:rgba(34,165,92,0.14);border:1px solid rgba(34,165,92,0.22);display:flex;align-items:center;justify-content:center;margin-bottom:0.65rem">
                      <span class="material-icons" style="font-size:1.05rem;color:#4ade80">{{ p.icon }}</span>
                    </div>
                    <p style="margin:0 0 0.25rem;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:0.8rem;color:#fff">{{ p.title }}</p>
                    <p style="margin:0;font-size:0.71rem;color:rgba(255,255,255,0.45);line-height:1.5">{{ p.desc }}</p>
                  </div>
                </div>

                <!-- Card Solve — mesma altura do grid -->
                <div style="flex:0 0 185px;border-radius:1rem;background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.07);padding:1.25rem;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:0.7rem">
                  <img src="assets/Solve_logo_fundo.png" alt="Solve" style="height:5rem;width:auto">
                  <div style="width:2rem;height:1px;background:rgba(255,255,255,0.1)"></div>
                  <p style="margin:0;font-size:0.7rem;color:rgba(255,255,255,0.38);line-height:1.5">
                    Desenvolvido pela <strong style="color:rgba(255,255,255,0.65)">Solve</strong>
                  </p>
                  <div style="display:flex;flex-direction:column;gap:0.4rem;width:100%">
                    <a href="mailto:connectsolve.ti@gmail.com" style="display:flex;align-items:center;gap:0.4rem;color:rgba(255,255,255,0.35);font-size:0.65rem;text-decoration:none" onmouseover="this.style.color='rgba(255,255,255,0.7)'" onmouseout="this.style.color='rgba(255,255,255,0.35)'">
                      <span class="material-icons" style="font-size:0.75rem">mail</span>connectsolve.ti&#64;gmail.com
                    </a>
                    <a href="https://www.instagram.com/solve.ti" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:0.4rem;color:rgba(255,255,255,0.35);font-size:0.65rem;text-decoration:none" onmouseover="this.style.color='rgba(255,255,255,0.7)'" onmouseout="this.style.color='rgba(255,255,255,0.35)'">
                      <span class="material-icons" style="font-size:0.75rem">photo_camera</span>&#64;solve.ti
                    </a>
                  </div>
                </div>

              </div>
            </div>

            <!-- ── Planos ─────────────────────────── -->
            <div id="section-planos" style="padding:0 2.5rem 2.5rem">
              <div style="display:inline-flex;align-items:center;gap:0.3rem;margin-bottom:0.6rem">
                <span style="width:0.5rem;height:0.5rem;background:#4ade80;border-radius:2px;display:inline-block"></span>
                <span style="font-size:0.63rem;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:0.07em">Planos</span>
              </div>
              <h2 style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:clamp(1.35rem,2vw,1.8rem);color:#fff;margin:0 0 1.5rem;line-height:1.08;letter-spacing:-0.02em">
                ESCOLHA SEU <span style="color:#4ade80">PLANO</span>
              </h2>

              <!-- Grid de cards -->
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:1.25rem;align-items:stretch">

                <!-- Card Free -->
                <div (click)="selectPlan(freePlan)"
                     style="border-radius:1.5rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);padding:2rem 1.75rem;display:flex;flex-direction:column;cursor:pointer;transition:border-color 0.2s,transform 0.18s;min-height:380px"
                     onmouseover="this.style.borderColor='rgba(255,255,255,0.22)';this.style.transform='translateY(-4px)'"
                     onmouseout="this.style.borderColor='rgba(255,255,255,0.09)';this.style.transform='translateY(0)'">
                  <p style="margin:0 0 0.75rem;font-size:0.68rem;font-weight:700;color:rgba(255,255,255,0.38);text-transform:uppercase;letter-spacing:0.07em">Free</p>
                  <div style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:2.6rem;color:#fff;line-height:1;margin-bottom:0.2rem">Grátis</div>
                  <p style="margin:0 0 1rem;font-size:0.67rem;color:rgba(255,255,255,0.3)">para sempre</p>
                  <p style="margin:0 0 1.25rem;font-size:0.73rem;color:rgba(255,255,255,0.48);line-height:1.55">{{ freePlan.desc }}</p>
                  <div style="display:flex;flex-direction:column;gap:0.55rem;flex:1;margin-bottom:1.25rem">
                    <div *ngFor="let f of freePlan.features" style="display:flex;align-items:flex-start;gap:0.55rem">
                      <span class="material-icons" style="font-size:0.88rem;color:#4ade80;flex-shrink:0;margin-top:0.1rem">check</span>
                      <span style="font-size:0.73rem;color:rgba(255,255,255,0.62);line-height:1.4">{{ f.title }}</span>
                    </div>
                  </div>
                  <!-- Taxa ArenaFlow -->
                  <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.05);border-radius:0.65rem;padding:0.5rem 0.75rem;margin-bottom:1.25rem">
                    <div style="display:flex;align-items:center;gap:0.4rem">
                      <span class="material-icons" style="font-size:0.85rem;color:rgba(255,255,255,0.35)">percent</span>
                      <span style="font-size:0.72rem;color:rgba(255,255,255,0.45)">Taxa sobre reservas</span>
                    </div>
                    <span style="font-size:0.72rem;font-weight:700;color:rgba(255,255,255,0.7)">{{ freePlan.commission_pct }}%</span>
                  </div>
                  <button style="width:100%;padding:0.72rem;border-radius:0.875rem;background:transparent;border:1px solid rgba(255,255,255,0.2);color:#fff;font-weight:700;font-size:0.8rem;cursor:pointer;font-family:'Space Grotesk',sans-serif;letter-spacing:0.01em;transition:background 0.2s,border-color 0.2s"
                          onmouseover="this.style.background='rgba(255,255,255,0.08)';this.style.borderColor='rgba(255,255,255,0.35)'"
                          onmouseout="this.style.background='transparent';this.style.borderColor='rgba(255,255,255,0.2)'">
                    Escolher plano
                  </button>
                </div>

                <!-- Cards pagos -->
                <div *ngFor="let p of paidPlans"
                     (click)="p.available && selectPlan(p)"
                     [style.cursor]="p.available ? 'pointer' : 'default'"
                     [style.border]="p.popular ? '1px solid rgba(34,165,92,0.42)' : '1px solid rgba(255,255,255,0.09)'"
                     [style.background]="p.popular ? 'rgba(34,165,92,0.06)' : 'rgba(255,255,255,0.04)'"
                     style="border-radius:1.5rem;padding:2rem 1.75rem;display:flex;flex-direction:column;position:relative;transition:border-color 0.2s,transform 0.18s;min-height:380px"
                     onmouseover="this.style.transform='translateY(-4px)'"
                     onmouseout="this.style.transform='translateY(0)'">

                  <!-- Badge popular -->
                  <div *ngIf="p.popular" style="position:absolute;top:-0.7rem;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#22a55c,#16a34a);border-radius:2rem;padding:0.22rem 0.85rem;white-space:nowrap;box-shadow:0 4px 14px rgba(34,165,92,0.35);display:flex;align-items:center">
                    <span style="font-size:0.6rem;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:0.07em;line-height:1">Mais popular</span>
                  </div>

                  <p style="margin:0 0 0.75rem;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em"
                     [style.color]="p.available ? '#4ade80' : 'rgba(255,255,255,0.28)'">{{ p.name }}</p>
                  <div style="font-family:'Space Grotesk',sans-serif;font-weight:900;line-height:1;margin-bottom:0.2rem"
                       [style.font-size]="p.priceLabel.length > 10 ? '1.7rem' : '2.2rem'"
                       [style.color]="p.available ? '#fff' : 'rgba(255,255,255,0.4)'">{{ p.priceLabel }}</div>
                  <p style="margin:0 0 1rem;font-size:0.67rem;color:rgba(255,255,255,0.3)">/mês</p>
                  <p style="margin:0 0 1.25rem;font-size:0.73rem;color:rgba(255,255,255,0.48);line-height:1.55">{{ p.desc || p.courts }}</p>

                  <div style="display:flex;flex-direction:column;gap:0.55rem;flex:1;margin-bottom:1.25rem">
                    <div *ngFor="let f of p.features" style="display:flex;align-items:flex-start;gap:0.55rem">
                      <span class="material-icons" style="font-size:0.88rem;flex-shrink:0;margin-top:0.1rem"
                            [style.color]="p.available ? '#4ade80' : 'rgba(255,255,255,0.2)'">check</span>
                      <span style="font-size:0.73rem;line-height:1.4"
                            [style.color]="p.available ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.28)'">{{ f.title }}</span>
                    </div>
                  </div>

                  <!-- Taxa ArenaFlow -->
                  <div style="display:flex;align-items:center;justify-content:space-between;border-radius:0.65rem;padding:0.5rem 0.75rem;margin-bottom:1.25rem"
                       [style.background]="p.commission_pct === 0 ? 'rgba(34,165,92,0.12)' : 'rgba(255,255,255,0.05)'">
                    <div style="display:flex;align-items:center;gap:0.4rem">
                      <span class="material-icons" style="font-size:0.85rem"
                            [style.color]="p.commission_pct === 0 ? '#4ade80' : 'rgba(255,255,255,0.35)'">
                        {{ p.commission_pct === 0 ? 'check_circle' : 'percent' }}
                      </span>
                      <span style="font-size:0.72rem;color:rgba(255,255,255,0.45)">Taxa sobre reservas</span>
                    </div>
                    <span style="font-size:0.72rem;font-weight:700"
                          [style.color]="p.commission_pct === 0 ? '#4ade80' : 'rgba(255,255,255,0.7)'">
                      {{ p.commission_pct === 0 ? 'Isento' : p.commission_pct + '%' }}
                    </span>
                  </div>

                  <button [disabled]="!p.available"
                          [style.color]="p.available ? '#fff' : 'rgba(255,255,255,0.25)'"
                          [style.cursor]="p.available ? 'pointer' : 'default'"
                          [style.border]="p.available ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.08)'"
                          style="width:100%;padding:0.72rem;border-radius:0.875rem;font-weight:700;font-size:0.8rem;font-family:'Space Grotesk',sans-serif;letter-spacing:0.01em;transition:background 0.2s,border-color 0.2s;background:transparent"
                          onmouseover="if(!this.disabled){this.style.background='rgba(255,255,255,0.08)';this.style.borderColor='rgba(255,255,255,0.35)';this.style.transform='translateY(-1px)'}"
                          onmouseout="this.style.background='transparent';this.style.borderColor='rgba(255,255,255,0.2)';this.style.transform='translateY(0)'">
                    {{ p.available ? 'Escolher plano' : 'Em breve' }}
                  </button>
                </div>

              </div>

              <!-- Footer -->
              <div style="margin-top:1.75rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between">
                <p style="font-size:0.62rem;color:rgba(255,255,255,0.18);margin:0">© 2025 Solve. Todos os direitos reservados.</p>
                <p style="font-size:0.62rem;color:rgba(255,255,255,0.18);margin:0">ArenaFlow v1.0</p>
              </div>
            </div>

          </div>
          </div><!-- fim d-mkt-scroll -->
        </div>

        <!-- Col 2: Login form -->
        <div class="d-login" [class.left-mode]="phase === 'selected'" [class.hidden]="!showLoginForm && phase === 'browse'">
          <div class="glass-card" [class.anim-slide-l]="phase === 'selected'">

            <!-- Plan chip (desktop, when selected) -->
            <div *ngIf="phase === 'selected' && selectedPlan"
                 style="display:flex;align-items:center;gap:0.6rem;padding:0.65rem 0.9rem;border-radius:0.75rem;background:rgba(34,165,92,0.08);border:1px solid rgba(34,165,92,0.2);margin-bottom:1.25rem">
              <span class="material-icons" style="font-size:0.95rem;color:#4ade80;flex-shrink:0">check_circle</span>
              <div style="flex:1">
                <p style="margin:0;font-size:0.77rem;font-weight:700;color:#fff">Plano {{ selectedPlan.name }}</p>
                <p style="margin:0;font-size:0.68rem;color:rgba(255,255,255,0.38)">{{ selectedPlan.priceLabel }}</p>
              </div>
              <button (click)="clearSelection()" style="background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.3);padding:0;display:flex;font-size:0.7rem;align-items:center;gap:0.2rem;transition:color 0.2s" onmouseover="this.style.color='rgba(255,255,255,0.6)'" onmouseout="this.style.color='rgba(255,255,255,0.3)'">
                <span class="material-icons" style="font-size:0.85rem">swap_horiz</span>
              </button>
            </div>

            <ng-container *ngTemplateOutlet="selectedPlan && selectedPlan.price > 0 ? cardForm : authForm"></ng-container>
          </div>
        </div>

        <!-- Col 3: Plan detail -->
        <div class="d-detail" [class.visible]="phase === 'selected'">
          <div class="d-detail-bg"></div>
          <div class="d-detail-orb"></div>

          <div *ngIf="selectedPlan" class="d-detail-content" style="padding:2rem 2.5rem">

            <!-- ── Hero header ────────────────────── -->
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1.5rem">
              <div>
                <!-- Badge -->
                <div style="display:inline-flex;align-items:center;gap:0.35rem;background:rgba(34,165,92,0.14);border:1px solid rgba(34,165,92,0.32);border-radius:2rem;padding:0.25rem 0.75rem;margin-bottom:0.75rem">
                  <span style="width:0.45rem;height:0.45rem;border-radius:50%;background:#4ade80;display:inline-block;animation:pulse 2s ease-in-out infinite"></span>
                  <span style="font-size:0.62rem;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:0.07em">Plano selecionado</span>
                </div>
                <!-- Nome -->
                <h1 style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:clamp(2rem,3.5vw,3rem);color:#fff;margin:0 0 0.35rem;line-height:1;letter-spacing:-0.03em">
                  {{ selectedPlan.name }}
                </h1>
                <p style="margin:0;font-size:0.8rem;color:rgba(255,255,255,0.38)">{{ selectedPlan.courts }} · gestão completa</p>
              </div>
              <!-- Preço destaque -->
              <div style="text-align:right;flex-shrink:0">
                <div style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:clamp(2rem,3.5vw,3rem);color:#fff;line-height:1;letter-spacing:-0.025em">
                  {{ selectedPlan.priceLabel }}
                </div>
                <div style="font-size:0.78rem;color:rgba(255,255,255,0.35);margin-top:0.2rem">{{ selectedPlan.price === 0 ? 'para sempre' : '/mês' }}</div>
                <div *ngIf="selectedPlan.popular" style="display:inline-flex;align-items:center;gap:0.25rem;background:rgba(34,165,92,0.15);border:1px solid rgba(34,165,92,0.3);border-radius:2rem;padding:0.15rem 0.6rem;margin-top:0.4rem">
                  <span class="material-icons" style="font-size:0.65rem;color:#4ade80">star</span>
                  <span style="font-size:0.6rem;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:0.05em">Mais popular</span>
                </div>
              </div>
            </div>

            <!-- ── Callout trial / segurança ─────── -->
            <div *ngIf="selectedPlan.price === 0"
                 style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;border-radius:1rem;background:rgba(34,165,92,0.1);border:1px solid rgba(34,165,92,0.25);margin-bottom:1.5rem">
              <div style="width:2.25rem;height:2.25rem;border-radius:0.625rem;background:rgba(34,165,92,0.18);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span class="material-icons" style="font-size:1.1rem;color:#4ade80">auto_awesome</span>
              </div>
              <div>
                <p style="margin:0;font-size:0.8rem;font-weight:700;color:#4ade80">14 dias grátis com o Plano Pro</p>
                <p style="margin:0;font-size:0.7rem;color:rgba(255,255,255,0.45)">Sem cartão de crédito — explore tudo gratuitamente</p>
              </div>
            </div>
            <div *ngIf="selectedPlan.price > 0"
                 style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;border-radius:1rem;background:rgba(34,165,92,0.07);border:1px solid rgba(34,165,92,0.18);margin-bottom:1.5rem">
              <div style="width:2.25rem;height:2.25rem;border-radius:0.625rem;background:rgba(34,165,92,0.14);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span class="material-icons" style="font-size:1.1rem;color:#4ade80">verified_user</span>
              </div>
              <div>
                <p style="margin:0;font-size:0.8rem;font-weight:700;color:#fff">Pagamento seguro via Pagar.me</p>
                <p style="margin:0;font-size:0.7rem;color:rgba(255,255,255,0.42)">Cancele quando quiser, sem taxas ou multas</p>
              </div>
            </div>

            <!-- ── Features em grid 2×N ──────────── -->
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.85rem">
              <span style="width:0.45rem;height:0.45rem;background:#4ade80;border-radius:2px;display:inline-block"></span>
              <p style="margin:0;font-size:0.63rem;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.07em">O que está incluso</p>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;flex:1;margin-bottom:1.5rem">
              <div *ngFor="let f of selectedPlan.features; let i = index"
                   style="border-radius:1rem;padding:1rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);display:flex;flex-direction:column;gap:0.5rem;animation:featureIn 0.4s cubic-bezier(0.22,1,0.36,1) both"
                   [style.animation-delay]="(i * 0.06) + 's'">
                <div style="width:2.25rem;height:2.25rem;border-radius:0.625rem;background:rgba(34,165,92,0.14);border:1px solid rgba(34,165,92,0.22);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <span class="material-icons" style="font-size:1.05rem;color:#4ade80">{{ f.icon }}</span>
                </div>
                <div>
                  <p style="margin:0 0 0.2rem;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:0.8rem;color:#fff;line-height:1.25">{{ f.title }}</p>
                  <p *ngIf="f.desc" style="margin:0;font-size:0.68rem;color:rgba(255,255,255,0.38);line-height:1.4">{{ f.desc }}</p>
                </div>
              </div>
            </div>

            <!-- ── Stats strip ────────────────────── -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;margin-bottom:1.5rem">
              <div style="border-radius:0.875rem;padding:0.85rem 0.75rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);text-align:center">
                <span class="material-icons" style="font-size:1.1rem;color:#4ade80;display:block;margin-bottom:0.3rem">store</span>
                <p style="margin:0;font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1rem;color:#fff;line-height:1">{{ selectedPlan.courts.split(' ')[0] }}</p>
                <p style="margin:0.15rem 0 0;font-size:0.58rem;color:rgba(255,255,255,0.32);text-transform:uppercase;letter-spacing:0.04em">Quadra{{ selectedPlan.courts.split(' ')[0] !== '1' ? 's' : '' }}</p>
              </div>
              <div style="border-radius:0.875rem;padding:0.85rem 0.75rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);text-align:center">
                <span class="material-icons" style="font-size:1.1rem;color:#4ade80;display:block;margin-bottom:0.3rem">{{ selectedPlan.price === 0 ? 'auto_awesome' : 'sync' }}</span>
                <p style="margin:0;font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1rem;color:#fff;line-height:1">{{ selectedPlan.price === 0 ? '14 dias' : 'Mensal' }}</p>
                <p style="margin:0.15rem 0 0;font-size:0.58rem;color:rgba(255,255,255,0.32);text-transform:uppercase;letter-spacing:0.04em">{{ selectedPlan.price === 0 ? 'Trial Pro' : 'Recorrência' }}</p>
              </div>
              <div style="border-radius:0.875rem;padding:0.85rem 0.75rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);text-align:center">
                <span class="material-icons" style="font-size:1.1rem;color:#4ade80;display:block;margin-bottom:0.3rem">calendar_month</span>
                <p style="margin:0;font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1rem;color:#fff;line-height:1">24h</p>
                <p style="margin:0.15rem 0 0;font-size:0.58rem;color:rgba(255,255,255,0.32);text-transform:uppercase;letter-spacing:0.04em">Reservas online</p>
              </div>
            </div>

            <!-- ── Navegação entre planos ─────────── -->
            <div class="plan-nav-strip">
              <button class="plan-nav-pill"
                      [class.active]="selectedPlan.id === freePlan.id"
                      (click)="selectPlan(freePlan)">
                Free<br><span style="font-size:0.58rem;font-weight:400">Grátis</span>
              </button>
              <button *ngFor="let p of paidPlans"
                      class="plan-nav-pill"
                      [class.active]="selectedPlan.id === p.id"
                      [class.unavail]="!p.available"
                      (click)="p.available && selectPlan(p)">
                {{ p.name }}<br><span style="font-size:0.58rem;font-weight:400">{{ p.priceLabel }}</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════
           TEMPLATE: Auth form
      ══════════════════════════════════ -->
      <ng-template #authForm>

        <div *ngIf="mode === 'reset'" style="margin-bottom:1.25rem">
          <button class="back-form-btn" (click)="setMode('login')">
            <span class="material-icons" style="font-size:1rem">arrow_back</span> Voltar
          </button>
          <p style="font-family:'Space Grotesk',sans-serif;font-weight:600;color:#fff;margin:0">Redefinir senha</p>
          <p style="font-size:0.78rem;color:rgba(255,255,255,0.45);margin:0.2rem 0 0">Enviaremos um link para o seu e-mail</p>
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
                 placeholder="Senha"
                 autocomplete="current-password">
          <button class="eye-btn" type="button" (click)="showPass = !showPass">
            <span class="material-icons" style="font-size:1rem">{{ showPass ? 'visibility_off' : 'visibility' }}</span>
          </button>
        </div>

        <div *ngIf="mode === 'login'" style="text-align:right;margin-bottom:0.25rem">
          <button class="forgot-btn" (click)="setMode('reset')">Esqueci minha senha</button>
        </div>

        <p *ngIf="error"   style="font-size:0.78rem;color:#f87171;margin:0.5rem 0 0">{{ error }}</p>
        <p *ngIf="success" style="font-size:0.78rem;color:#4ade80;margin:0.5rem 0 0">{{ success }}</p>

        <button class="btn-primary" (click)="submit()" [disabled]="loading">
          <span *ngIf="loading" class="material-icons spin-icon" style="font-size:1rem">refresh</span>
          {{ loading ? 'Aguarde...' : submitLabel }}
        </button>

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

        <p style="font-size:0.68rem;text-align:center;color:rgba(255,255,255,0.2);margin-top:1.25rem;margin-bottom:0">
          Ao entrar, você concorda com os termos de uso da plataforma.
        </p>
      </ng-template>

      <!-- ══════════════════════════════════
           TEMPLATE: Card form (checkout)
      ══════════════════════════════════ -->
      <ng-template #cardForm>
        <!-- Chip do plano selecionado -->
        <div *ngIf="selectedPlan" style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;border-radius:0.875rem;background:rgba(34,165,92,0.1);border:1px solid rgba(34,165,92,0.25);margin-bottom:1.25rem">
          <div>
            <div style="font-size:0.68rem;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:0.05em">Plano selecionado</div>
            <div style="font-family:'Space Grotesk',sans-serif;font-weight:800;color:#fff;font-size:1rem">{{ selectedPlan.name }}</div>
          </div>
          <div style="text-align:right">
            <div style="font-family:'Space Grotesk',sans-serif;font-weight:900;color:#4ade80;font-size:1.1rem">{{ selectedPlan.priceLabel }}</div>
            <div style="font-size:0.65rem;color:rgba(255,255,255,0.35)">/mês</div>
          </div>
        </div>

        <p style="font-family:'Space Grotesk',sans-serif;font-weight:700;color:#fff;font-size:0.9rem;margin:0 0 1rem">Dados do cartão de crédito</p>

        <!-- Número do cartão -->
        <div class="input-wrap">
          <span class="material-icons input-icon">credit_card</span>
          <input class="glass-input" [value]="cardNumber" (input)="onCardNumberInput($event)" type="text" placeholder="0000 0000 0000 0000" maxlength="19" inputmode="numeric" autocomplete="cc-number">
        </div>

        <!-- Nome no cartão -->
        <div class="input-wrap">
          <span class="material-icons input-icon">person</span>
          <input class="glass-input" [(ngModel)]="cardHolder" type="text" placeholder="Nome impresso no cartão" style="text-transform:uppercase" autocomplete="cc-name">
        </div>

        <!-- Validade + CVV -->
        <div style="display:flex;gap:0.75rem">
          <div class="input-wrap" style="flex:1">
            <span class="material-icons input-icon" style="font-size:0.95rem">date_range</span>
            <input class="glass-input" [value]="cardExpiry" (input)="onExpiryInput($event)" type="text" placeholder="MM/AA" maxlength="5" inputmode="numeric" autocomplete="cc-exp">
          </div>
          <div class="input-wrap" style="flex:1">
            <span class="material-icons input-icon" style="font-size:0.95rem">lock</span>
            <input class="glass-input" [(ngModel)]="cardCvv" type="password" placeholder="CVV" maxlength="4" inputmode="numeric" autocomplete="cc-csc">
          </div>
        </div>

        <!-- CPF do titular -->
        <div class="input-wrap">
          <span class="material-icons input-icon">badge</span>
          <input class="glass-input" [value]="cardDocument" (input)="onDocumentInput($event)" type="text" placeholder="CPF do titular" maxlength="14" inputmode="numeric">
        </div>

        <!-- Celular do titular -->
        <div class="input-wrap">
          <span class="material-icons input-icon">phone_iphone</span>
          <input class="glass-input" [value]="cardPhone" (input)="onPhoneInput($event)" type="text" placeholder="(00) 00000-0000" maxlength="15" inputmode="numeric" autocomplete="tel">
        </div>

        <p *ngIf="checkoutError" style="font-size:0.78rem;color:#f87171;margin:0.5rem 0 0">{{ checkoutError }}</p>

        <!-- Separador visual entre formulário e ações -->
        <div style="margin-top:1.75rem;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,0.07);display:flex;flex-direction:column;gap:0.75rem">

          <!-- Assinar com Google — discreto -->
          <button (click)="submitPayment()" [disabled]="checkoutLoading" style="
              width:100%; padding:0.65rem;
              border-radius:0.75rem; cursor:pointer;
              background:rgba(255,255,255,0.06);
              border:1px solid rgba(255,255,255,0.13);
              color:rgba(255,255,255,0.75); font-size:0.875rem; font-weight:600;
              display:flex; align-items:center; justify-content:center; gap:0.6rem;
              transition:background 0.2s, border-color 0.2s, color 0.2s;
              opacity: checkoutLoading ? 0.55 : 1;
            "
            onmouseover="if(!this.disabled){this.style.background='rgba(255,255,255,0.1)';this.style.borderColor='rgba(255,255,255,0.22)';this.style.color='#fff'}"
            onmouseout="this.style.background='rgba(255,255,255,0.06)';this.style.borderColor='rgba(255,255,255,0.13)';this.style.color='rgba(255,255,255,0.75)'">
            <span *ngIf="checkoutLoading" class="material-icons spin-icon" style="font-size:1rem">refresh</span>
            <ng-container *ngIf="!checkoutLoading">
              <svg width="16" height="16" viewBox="0 0 48 48" style="flex-shrink:0;opacity:0.85">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6c1.8-5.4 6.9-9.8 13.6-9.8z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
                <path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/>
                <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.6 0-12.2-4.4-14.2-10.4l-7.8 6C6.6 42.6 14.6 48 24 48z"/>
              </svg>
              Assinar com Google
            </ng-container>
            <span *ngIf="checkoutLoading">Processando pagamento...</span>
          </button>

          <!-- Voltar à tela inicial -->
          <button (click)="backToLanding()" style="
              width:100%; padding:0.62rem;
              border-radius:0.75rem; cursor:pointer;
              background:rgba(255,255,255,0.04);
              border:1px solid rgba(255,255,255,0.11);
              color:rgba(255,255,255,0.55); font-size:0.85rem; font-weight:600;
              display:flex; align-items:center; justify-content:center; gap:0.4rem;
              transition:background 0.2s, border-color 0.2s, color 0.2s;
            "
            onmouseover="this.style.background='rgba(255,255,255,0.08)';this.style.borderColor='rgba(255,255,255,0.2)';this.style.color='rgba(255,255,255,0.85)'"
            onmouseout="this.style.background='rgba(255,255,255,0.04)';this.style.borderColor='rgba(255,255,255,0.11)';this.style.color='rgba(255,255,255,0.55)'">
            <span class="material-icons" style="font-size:0.95rem">arrow_back</span>
            Voltar à tela inicial
          </button>

        </div>

        <p style="font-size:0.65rem;text-align:center;color:rgba(255,255,255,0.15);margin-top:1rem;margin-bottom:0">
          Pagamento processado com segurança via Pagar.me · Cancele quando quiser
        </p>
      </ng-template>
    </div>
  `
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private establishmentService = inject(EstablishmentService);
  private api = inject(ApiService);

  phase: Phase = 'browse';
  mobileStep: MobileStep = 'landing';
  landingExiting = false;
  authExiting = false;
  mode: Mode = 'login';
  selectedPlan: PlanOption | null = null;
  showLoginForm = false;

  name = ''; email = ''; password = '';
  showPass = false; loading = false; error = ''; success = '';

  // Checkout de cartão (plano pago)
  checkoutLoading = false;
  checkoutError   = '';
  cardNumber  = '';
  cardHolder  = '';
  cardExpiry  = '';
  cardCvv     = '';
  cardDocument = '';
  cardPhone    = '';

  freePlan: PlanOption = {
    id: 'free', name: 'Free', priceLabel: 'Grátis', price: 0,
    courts: '1 quadra', available: true, popular: false,
    commission_pct: 10,
    desc: PLAN_DESCS['free'],
    features: [
      { icon: 'store',          title: '1 quadra cadastrada',      desc: 'Gerencie sua primeira quadra sem custo' },
      { icon: 'calendar_month', title: 'Agendamentos ilimitados',  desc: 'Sem limite de reservas por mês' },
      { icon: 'group',          title: 'Cadastro de clientes',     desc: 'Histórico e preferências de cada cliente' },
      { icon: 'bar_chart',      title: 'Dashboard básico',         desc: 'Visão geral de ocupação e faturamento' },
    ],
  };

  paidPlans: PlanOption[] = [];

  ngOnInit(): void {
    this.api.get<{ plans: any[] }>('/plans').subscribe({
      next: ({ plans }) => {
        this.paidPlans = plans
          .filter(p => p.slug !== 'free' && p.active !== false)
          .sort((a, b) => a.price - b.price)
          .map(p => ({
            id:         p.slug,
            name:       p.name,
            priceLabel: p.price === 0 ? 'Grátis' : `R$ ${Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            price:      p.price,
            courts:     p.max_courts ? `${p.max_courts} quadra${p.max_courts > 1 ? 's' : ''}` : 'Ilimitadas',
            available:      !!p.pagarme_plan_id,   // disponível apenas quando já criado no Pagar.me
            popular:        p.slug === 'pro',
            commission_pct: Number(p.commission_pct ?? 10),
            desc:           PLAN_DESCS[p.slug] ?? `Para arenas com ${p.max_courts ? p.max_courts + ' quadras' : 'quadras ilimitadas'}.`,
            features:       (p.features as string[]).map(featureToDisplay),
          }));

        // Atualiza freePlan com dados reais se existirem
        const free = plans.find(p => p.slug === 'free');
        if (free) {
          this.freePlan = {
            ...this.freePlan,
            name:    free.name,
            courts:  free.max_courts ? `${free.max_courts} quadra` : '1 quadra',
            features: free.features?.length
              ? (free.features as string[]).map(featureToDisplay)
              : this.freePlan.features,
          };
        }
      },
      error: () => { /* mantém os valores padrão em caso de falha */ }
    });
  }

  steps = [
    { title: 'Escolha seu plano',    desc: 'Comece grátis, sem cartão.' },
    { title: 'Configure sua arena',  desc: 'Quadras, horários e preços.' },
    { title: 'Receba reservas',      desc: 'Clientes agendam 24h pelo app.' },
  ];

  sobrePilares = [
    { icon: 'bolt',          title: 'Simplicidade',     desc: 'Configure sua arena em minutos, sem treinamento técnico' },
    { icon: 'groups',        title: 'Foco no gestor',   desc: 'Cada funcionalidade pensada para o dia a dia da arena' },
    { icon: 'trending_up',   title: 'Crescimento',      desc: 'Acompanhe faturamento e ocupação em tempo real' },
    { icon: 'verified_user', title: 'Confiabilidade',   desc: 'Infraestrutura segura com 99,9% de disponibilidade' },
  ];

  features = [
    { icon: 'calendar_month', title: 'Reservas online 24h',     desc: 'Clientes agendam sem ligar' },
    { icon: 'sports_tennis',  title: 'Gestão de quadras',       desc: 'Bloqueios e disponibilidade' },
    { icon: 'bar_chart',      title: 'Dashboard em tempo real', desc: 'Ocupação e receita' },
    { icon: 'group',          title: 'Cadastro de clientes',    desc: 'Histórico de reservas' },
    { icon: 'notifications',  title: 'Notificações',            desc: 'WhatsApp e e-mail (Pro+)' },
    { icon: 'public',         title: 'Perfil público',          desc: 'Arena visível no app cliente' },
  ];

  get submitLabel() {
    if (this.mode === 'login') return 'Entrar';
    return 'Enviar link de redefinição';
  }

  selectPlan(plan: PlanOption) {
    if (!plan.available) return;
    this.selectedPlan = plan;
    this.mode = 'login';
    this.error = ''; this.success = ''; this.checkoutError = '';
    this.showLoginForm = true;
    this.phase = 'selected';
    this.landingExiting = true;
    setTimeout(() => {
      this.mobileStep = 'auth';
      this.landingExiting = false;
    }, 380);
  }

  clearSelection() {
    this.selectedPlan = null;
    this.phase = 'browse';
    this.showLoginForm = true; // mantém o card aberto após trocar plano
    this.error = ''; this.success = '';
  }

  goToLogin() {
    // Toggle: se o painel já está aberto (sem plano selecionado), fecha
    if (this.showLoginForm && this.phase === 'browse') {
      this.showLoginForm = false;
      return;
    }
    this.selectedPlan = null;
    this.mode = 'login';
    this.showLoginForm = true;
    this.mobileStep = 'auth';
    this.error = ''; this.success = '';
  }

  backToLanding() {
    this.authExiting = true;
    this.error = ''; this.success = '';
    setTimeout(() => {
      this.mobileStep = 'landing';
      this.selectedPlan = null;
      this.phase = 'browse';
      this.authExiting = false;
    }, 320);
  }

  setMode(m: Mode) { this.mode = m; this.error = ''; this.success = ''; }

  backFromPayment() {
    this.checkoutError = '';
    this.cardNumber = ''; this.cardHolder = ''; this.cardExpiry = '';
    this.cardCvv = ''; this.cardDocument = ''; this.cardPhone = '';
    // Volta para detalhes do plano (mesmo painel, só limpa o checkout)
    this.phase = 'selected';
    this.mobileStep = 'auth';
  }

  onCardNumberInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 16);
    this.cardNumber = raw.replace(/(.{4})/g, '$1 ').trim();
    (e.target as HTMLInputElement).value = this.cardNumber;
  }

  onExpiryInput(e: Event) {
    let raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) raw = raw.slice(0, 2) + '/' + raw.slice(2);
    this.cardExpiry = raw;
    (e.target as HTMLInputElement).value = raw;
  }

  onDocumentInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
    const fmt = raw.length <= 3 ? raw
      : raw.length <= 6 ? raw.slice(0, 3) + '.' + raw.slice(3)
      : raw.length <= 9 ? raw.slice(0, 3) + '.' + raw.slice(3, 6) + '.' + raw.slice(6)
      : raw.slice(0, 3) + '.' + raw.slice(3, 6) + '.' + raw.slice(6, 9) + '-' + raw.slice(9);
    this.cardDocument = fmt;
    (e.target as HTMLInputElement).value = fmt;
  }

  onPhoneInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
    let fmt = raw;
    if (raw.length > 2)  fmt = '(' + raw.slice(0, 2) + ') ' + raw.slice(2);
    if (raw.length > 7)  fmt = '(' + raw.slice(0, 2) + ') ' + raw.slice(2, 7) + '-' + raw.slice(7);
    this.cardPhone = fmt;
    (e.target as HTMLInputElement).value = fmt;
  }

  async submitPayment() {
    if (!this.cardNumber || !this.cardHolder || !this.cardExpiry || !this.cardCvv || !this.cardDocument || !this.cardPhone) {
      this.checkoutError = 'Preencha todos os dados do cartão e celular.';
      return;
    }
    this.checkoutError = ''; this.checkoutLoading = true;
    try {
      // 1. Autentica com Google (abre popup)
      await this.auth.loginWithGoogle();

      // 2. Cria/recupera usuário no banco
      await firstValueFrom(
        this.api.post('/auth/me', { role: 'ADMIN', plan_slug: this.selectedPlan!.id })
      );

      // 3. Processa assinatura no Pagar.me
      const [expMonth, expYear] = this.cardExpiry.split('/');
      await firstValueFrom(
        this.api.post('/subscriptions', {
          plan_slug:         this.selectedPlan!.id,
          customer_document: this.cardDocument.replace(/\D/g, ''),
          customer_phone:    this.cardPhone.replace(/\D/g, ''),
          card: {
            number:      this.cardNumber.replace(/\D/g, ''),
            holder_name: this.cardHolder,
            exp_month:   expMonth,
            exp_year:    '20' + expYear,
            cvv:         this.cardCvv,
          },
        })
      );

      // 4. Navega para o painel
      this.router.navigate(['/']);
    } catch (e: any) {
      if (e?.code?.startsWith('auth/')) {
        this.checkoutError = 'Não foi possível autenticar com Google. Tente novamente.';
      } else {
        this.checkoutError = e?.error?.error || 'Erro ao processar o cartão. Verifique os dados e tente novamente.';
      }
    } finally { this.checkoutLoading = false; }
  }

  async submit() {
    this.error = ''; this.success = ''; this.loading = true;
    try {
      if (this.mode === 'login') {
        await this.auth.loginWithEmail(this.email, this.password);
        this.router.navigate(['/']);
      } else {
        await this.auth.resetPassword(this.email);
        this.success = 'Link enviado! Verifique sua caixa de entrada.';
      }
    } catch (e: any) {
      this.error = this.friendlyError(e.code);
    } finally { this.loading = false; }
  }

  async loginWithGoogle() {
    this.loading = true; this.error = '';
    try {
      await this.auth.loginWithGoogle();
      // Cria/recupera usuário no banco com plano free (ou existente)
      await firstValueFrom(
        this.api.post('/auth/me', { role: 'ADMIN', plan_slug: 'free' })
      );
      this.router.navigate(['/']);
    } catch (e: any) {
      this.error = 'Não foi possível entrar com Google. Tente novamente.';
      this.loading = false;
    }
  }

  scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    // Scroll dentro do container rolável (d-mkt-scroll), não no window
    const scroll = el.closest('.d-mkt-scroll') ?? el.parentElement;
    if (scroll) {
      scroll.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private friendlyError(code: string): string {
    const map: Record<string, string> = {
      'auth/invalid-email': 'E-mail inválido.',
      'auth/user-not-found': 'Nenhuma conta encontrada com este e-mail.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/email-already-in-use': 'Este e-mail já está em uso.',
      'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    };
    return map[code] ?? 'Ocorreu um erro. Tente novamente.';
  }
}
