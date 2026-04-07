import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EstablishmentService } from '../../services/establishment.service';

type Mode = 'login' | 'register' | 'reset';
type Phase = 'browse' | 'selected';
type MobileStep = 'landing' | 'auth';

interface PlanOption {
  id: string; name: string; priceLabel: string; price: number;
  courts: string; features: { icon: string; title: string; desc: string }[];
  available: boolean; popular: boolean;
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
      background:linear-gradient(135deg,#22a55c,#16a34a); color:#fff;
      font-weight:700; font-size:0.9rem; border:none; cursor:pointer;
      box-shadow:0 4px 20px rgba(34,165,92,0.4);
      transition:opacity 0.2s,transform 0.15s;
      display:flex; align-items:center; justify-content:center; gap:0.5rem;
    }
    .m-btn-free:hover { opacity:0.9; transform:translateY(-1px); }
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
      overflow-y: auto; overflow-x: hidden;
      display: flex; flex-direction: column;
      transition: flex-grow 1.4s cubic-bezier(0.16,1,0.3,1),
                  opacity 0.9s ease;
      will-change: flex-grow, opacity;
    }
    .d-marketing::-webkit-scrollbar { width: 3px; }
    .d-marketing::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px; }
    .d-marketing.collapsed { flex-grow: 0; opacity: 0; pointer-events: none; }

    /* Login column */
    .d-login {
      flex: 0 0 420px; display: flex; align-items: center; justify-content: center;
      padding: 2rem; position: relative;
      border-left: 1px solid rgba(255,255,255,0.07);
      transition: border-color 1s ease;
    }
    .d-login.left-mode { border-left: none; border-right: 1px solid rgba(255,255,255,0.07); }

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
              <span style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:0.95rem;color:#fff">ArenaFlow</span>
            </div>
            <button (click)="goToLogin()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:0.4rem 0.9rem;border-radius:0.6rem;font-size:0.8rem;font-weight:600;cursor:pointer">
              Entrar
            </button>
          </div>

          <!-- Hero -->
          <div class="m-hero anim-fade-up">
            <div class="m-hero-icon">
              <span class="material-icons" style="color:white;font-size:2rem">sports_volleyball</span>
            </div>
            <div class="trial-badge" style="margin-bottom:1rem">
              <span class="material-icons" style="font-size:0.85rem">verified</span>
              14 dias grátis · sem cartão
            </div>
            <h1 style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.75rem;color:#fff;margin:0 0 0.75rem;line-height:1.15">
              Gerencie sua arena esportiva com inteligência
            </h1>
            <p style="font-size:0.9rem;color:rgba(255,255,255,0.5);margin:0 0 1.75rem;line-height:1.55">
              Reservas online, gestão de quadras, dashboard completo e muito mais — em uma única plataforma.
            </p>
            <button class="m-btn-free" style="max-width:280px;margin:0 auto" (click)="selectPlan(freePlan)">
              Começar gratuitamente
              <span class="material-icons" style="font-size:1rem">arrow_forward</span>
            </button>
          </div>

          <!-- Como funciona -->
          <div class="m-section" style="padding-top:0">
            <p class="m-section-title">Como funciona</p>
            <div class="m-step" *ngFor="let s of steps; let i = index">
              <div class="m-step-num">{{ i + 1 }}</div>
              <div>
                <p style="margin:0 0 0.2rem;font-weight:700;font-size:0.88rem;color:#fff">{{ s.title }}</p>
                <p style="margin:0;font-size:0.78rem;color:rgba(255,255,255,0.45);line-height:1.45">{{ s.desc }}</p>
              </div>
            </div>
          </div>

          <!-- Recursos -->
          <div class="m-section" style="padding-top:0">
            <p class="m-section-title">O que você vai ter</p>
            <div class="m-feat-grid">
              <div class="m-feat-card" *ngFor="let f of features">
                <div class="m-feat-icon">
                  <span class="material-icons" style="font-size:1rem;color:#4ade80">{{ f.icon }}</span>
                </div>
                <p style="margin:0 0 0.2rem;font-weight:700;font-size:0.82rem;color:#fff">{{ f.title }}</p>
                <p style="margin:0;font-size:0.72rem;color:rgba(255,255,255,0.4);line-height:1.4">{{ f.desc }}</p>
              </div>
            </div>
          </div>

          <!-- Planos -->
          <div class="m-section" style="padding-top:0">
            <p class="m-section-title">Escolha seu plano</p>

            <!-- Free -->
            <div class="m-free-card">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1rem">
                <div>
                  <div style="display:flex;align-items:center;gap:0.45rem;margin-bottom:0.3rem">
                    <span style="font-size:0.65rem;font-weight:800;color:#4ade80;text-transform:uppercase;letter-spacing:0.06em">Free</span>
                    <span style="font-size:0.6rem;background:rgba(34,165,92,0.18);border:1px solid rgba(34,165,92,0.32);color:#4ade80;padding:0.1rem 0.45rem;border-radius:2rem;font-weight:700">Disponível</span>
                  </div>
                  <div style="font-family:'Space Grotesk',sans-serif;font-size:2.25rem;font-weight:900;color:#fff;line-height:1">Grátis</div>
                  <div style="font-size:0.75rem;color:rgba(255,255,255,0.4)">para sempre</div>
                </div>
                <div style="width:2.5rem;height:2.5rem;border-radius:0.75rem;background:rgba(34,165,92,0.14);display:flex;align-items:center;justify-content:center">
                  <span class="material-icons" style="font-size:1.25rem;color:#4ade80">store</span>
                </div>
              </div>
              <div style="margin-bottom:1rem">
                <div *ngFor="let f of freePlan.features" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.35rem">
                  <span class="material-icons" style="font-size:0.88rem;color:#4ade80;flex-shrink:0">check_circle</span>
                  <span style="font-size:0.8rem;color:rgba(255,255,255,0.7)">{{ f.title }}</span>
                </div>
              </div>
              <div style="padding:0.7rem 0.9rem;border-radius:0.75rem;background:rgba(34,165,92,0.08);border:1px solid rgba(34,165,92,0.18);margin-bottom:1rem">
                <div style="display:flex;align-items:center;gap:0.4rem">
                  <span class="material-icons" style="font-size:0.9rem;color:#4ade80">auto_awesome</span>
                  <span style="font-size:0.75rem;font-weight:700;color:#4ade80">14 dias com acesso ao Plano Pro</span>
                </div>
                <p style="margin:0.2rem 0 0;font-size:0.7rem;color:rgba(255,255,255,0.4)">Explore todos os recursos gratuitamente no período de teste.</p>
              </div>
              <button class="m-btn-free" (click)="selectPlan(freePlan)">
                Começar com o plano Free
                <span class="material-icons" style="font-size:1rem">arrow_forward</span>
              </button>
            </div>

            <!-- Pagos -->
            <p style="font-size:0.68rem;font-weight:700;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:0.05em;margin:0.25rem 0 0.5rem">Em breve</p>
            <div class="m-paid-row">
              <div class="m-paid-chip" *ngFor="let p of paidPlans">
                <div style="font-size:0.65rem;font-weight:700;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:0.15rem">{{ p.name }}</div>
                <div style="font-family:'Space Grotesk',sans-serif;font-size:0.95rem;font-weight:800;color:rgba(255,255,255,0.7)">{{ p.priceLabel }}</div>
                <div style="font-size:0.6rem;color:rgba(255,255,255,0.28);margin-top:0.1rem">/mês</div>
                <div style="font-size:0.58rem;color:rgba(255,255,255,0.25);margin-top:0.3rem">Em breve</div>
              </div>
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
          <div *ngIf="!selectedPlan" style="width:100%;max-width:390px;margin-bottom:0.5rem">
            <button class="back-form-btn" (click)="backToLanding()">
              <span class="material-icons" style="font-size:1rem">arrow_back</span> Voltar
            </button>
          </div>
          <div class="glass-card anim-slide-r" style="margin-top:0.75rem">
            <ng-container *ngTemplateOutlet="authForm"></ng-container>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════
           DESKTOP
      ══════════════════════════════════ -->
      <div class="desktop-view">

        <!-- Col 1: Marketing -->
        <div class="d-marketing" [class.collapsed]="phase === 'selected'">
          <div class="d-mkt-inner anim-fade-up">

            <!-- Brand -->
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.35rem">
              <div style="width:2.75rem;height:2.75rem;border-radius:0.75rem;background:linear-gradient(135deg,#22a55c,#16a34a);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(34,165,92,0.38);flex-shrink:0">
                <span class="material-icons" style="color:white;font-size:1.35rem">sports_volleyball</span>
              </div>
              <div>
                <h1 style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.4rem;color:#fff;margin:0;letter-spacing:-0.01em">ArenaFlow</h1>
                <p style="margin:0;font-size:0.72rem;color:rgba(255,255,255,0.35)">por Solve</p>
              </div>
            </div>

            <!-- Headline -->
            <div style="margin-bottom:1.5rem">
              <h2 style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:clamp(1.35rem,2.5vw,1.75rem);color:#fff;margin:0 0 0.5rem;line-height:1.2;letter-spacing:-0.01em">
                Gerencie sua arena esportiva com inteligência
              </h2>
              <p style="font-size:0.85rem;color:rgba(255,255,255,0.42);margin:0 0 0.875rem;line-height:1.5">
                Reservas online, quadras, clientes e relatórios em uma única plataforma.
              </p>
              <div class="trial-badge">
                <span class="material-icons" style="font-size:0.82rem">verified</span>
                14 dias grátis · sem cartão de crédito
              </div>
            </div>

            <!-- Como funciona -->
            <p style="font-size:0.68rem;font-weight:700;color:rgba(255,255,255,0.28);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem">Como funciona</p>
            <div class="d-step-row" style="margin-bottom:1.5rem">
              <div class="d-step-card" *ngFor="let s of steps; let i = index">
                <div class="d-step-badge">{{ i + 1 }}</div>
                <p style="margin:0 0 0.15rem;font-size:0.75rem;font-weight:700;color:#fff">{{ s.title }}</p>
                <p style="margin:0;font-size:0.68rem;color:rgba(255,255,255,0.38);line-height:1.4">{{ s.desc }}</p>
              </div>
            </div>

            <!-- Recursos -->
            <p style="font-size:0.68rem;font-weight:700;color:rgba(255,255,255,0.28);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem">Recursos</p>
            <div class="d-feat-grid">
              <div class="d-feat-card" *ngFor="let f of features">
                <div class="d-feat-icon">
                  <span class="material-icons" style="font-size:0.9rem;color:#4ade80">{{ f.icon }}</span>
                </div>
                <div>
                  <p style="margin:0 0 0.15rem;font-weight:700;font-size:0.75rem;color:#fff">{{ f.title }}</p>
                  <p style="margin:0;font-size:0.68rem;color:rgba(255,255,255,0.37);line-height:1.35">{{ f.desc }}</p>
                </div>
              </div>
            </div>

            <!-- Planos mini -->
            <p style="font-size:0.68rem;font-weight:700;color:rgba(255,255,255,0.28);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem">Planos</p>
            <div class="d-plan-row">
              <div class="d-plan-chip avail" (click)="selectPlan(freePlan)">
                <p style="margin:0 0 0.1rem;font-size:0.6rem;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:0.04em">Free</p>
                <p style="margin:0;font-size:0.9rem;font-weight:800;color:#fff;font-family:'Space Grotesk',sans-serif">Grátis</p>
                <p style="margin:0.1rem 0 0;font-size:0.58rem;color:rgba(255,255,255,0.38)">1 quadra</p>
                <span style="display:inline-block;margin-top:0.3rem;font-size:0.58rem;font-weight:700;color:#4ade80;background:rgba(34,165,92,0.14);padding:0.1rem 0.35rem;border-radius:0.25rem">Selecionar</span>
              </div>
              <div class="d-plan-chip" *ngFor="let p of paidPlans">
                <p style="margin:0 0 0.1rem;font-size:0.6rem;font-weight:700;color:rgba(255,255,255,0.32);text-transform:uppercase;letter-spacing:0.04em">{{ p.name }}</p>
                <p style="margin:0;font-size:0.9rem;font-weight:800;color:rgba(255,255,255,0.6);font-family:'Space Grotesk',sans-serif">{{ p.priceLabel }}</p>
                <p style="margin:0.1rem 0 0;font-size:0.58rem;color:rgba(255,255,255,0.28)">{{ p.courts }}</p>
                <span style="display:inline-block;margin-top:0.3rem;font-size:0.58rem;color:rgba(255,255,255,0.25);background:rgba(255,255,255,0.04);padding:0.1rem 0.35rem;border-radius:0.25rem">Em breve</span>
              </div>
            </div>

            <!-- Footer Solve -->
            <div class="d-footer-strip">
              <div style="display:flex;align-items:center;gap:0.5rem">
                <img src="assets/Solve_logo_fundo.png" alt="Solve" style="height:7.2rem;width:auto;display:block">
                <p style="margin:0;font-size:0.65rem;color:rgba(255,255,255,0.3)">Tecnologia para o seu negócio</p>
              </div>
              <div style="display:flex;align-items:center;gap:1rem">
                <a href="mailto:connectsolve.ti@gmail.com" style="display:flex;align-items:center;gap:0.35rem;color:rgba(255,255,255,0.35);font-size:0.7rem;text-decoration:none" onmouseover="this.style.color='rgba(255,255,255,0.65)'" onmouseout="this.style.color='rgba(255,255,255,0.35)'">
                  <span class="material-icons" style="font-size:0.85rem">mail</span>
                  connectsolve.ti&#64;gmail.com
                </a>
                <a href="https://www.instagram.com/solve.ti" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:0.35rem;color:rgba(255,255,255,0.35);font-size:0.7rem;text-decoration:none" onmouseover="this.style.color='rgba(255,255,255,0.65)'" onmouseout="this.style.color='rgba(255,255,255,0.35)'">
                  <span class="material-icons" style="font-size:0.85rem">photo_camera</span>
                  &#64;solve.ti
                </a>
              </div>
              <p style="font-size:0.62rem;color:rgba(255,255,255,0.18);margin:0">© 2025 Solve</p>
            </div>
          </div>
        </div>

        <!-- Col 2: Login form -->
        <div class="d-login" [class.left-mode]="phase === 'selected'">
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

            <ng-container *ngTemplateOutlet="authForm"></ng-container>
          </div>
        </div>

        <!-- Col 3: Plan detail (creative) -->
        <div class="d-detail" [class.visible]="phase === 'selected'">
          <div class="d-detail-bg"></div>
          <div class="d-detail-orb"></div>

          <div *ngIf="selectedPlan" class="d-detail-content">

            <button class="d-back-btn" (click)="clearSelection()">
              <span class="material-icons" style="font-size:0.88rem">arrow_back</span>
              Trocar plano
            </button>

            <!-- Plan hero -->
            <div class="d-plan-hero anim-slide-r">
              <div style="flex:1">
                <div class="d-plan-tag">
                  <span class="material-icons" style="font-size:0.78rem">check_circle</span>
                  Plano selecionado
                </div>
                <h2 style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.65rem;color:#fff;margin:0 0 0.35rem;letter-spacing:-0.01em">
                  {{ selectedPlan.name }}
                </h2>
                <p style="margin:0;font-size:0.8rem;color:rgba(255,255,255,0.38)">{{ selectedPlan.courts }} · gestão completa</p>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div class="d-plan-price-display">{{ selectedPlan.priceLabel }}</div>
                <div class="d-plan-price-sub">{{ selectedPlan.price === 0 ? 'para sempre' : '/mês' }}</div>
              </div>
            </div>

            <!-- Trial callout -->
            <div *ngIf="selectedPlan.id === 'free'" class="d-trial-card anim-fade-up" style="animation-delay:0.1s">
              <div class="d-trial-icon-wrap">
                <span class="material-icons" style="font-size:1.25rem;color:#4ade80">auto_awesome</span>
              </div>
              <div style="position:relative;z-index:1">
                <p style="margin:0 0 0.3rem;font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:1rem;color:#fff">
                  14 dias com o Plano Pro, grátis
                </p>
                <p style="margin:0;font-size:0.8rem;color:rgba(255,255,255,0.5);line-height:1.5">
                  Explore agendamentos avançados, relatórios completos e todos os recursos premium durante o período de teste — sem necessidade de cartão de crédito.
                </p>
              </div>
            </div>

            <!-- Feature cards 2x2 -->
            <p style="margin:0 0 0.75rem;font-size:0.7rem;font-weight:700;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.05em">O que está incluso</p>
            <div class="d-feature-grid">
              <div class="d-feature-card" *ngFor="let f of selectedPlan.features; let i = index"
                   [style.animation-delay]="(0.12 + i * 0.08) + 's'">
                <div class="d-feature-card-icon">
                  <span class="material-icons" style="font-size:1.1rem;color:#4ade80">{{ f.icon }}</span>
                </div>
                <p style="margin:0 0 0.2rem;font-weight:700;font-size:0.85rem;color:#fff">{{ f.title }}</p>
                <p style="margin:0;font-size:0.75rem;color:rgba(255,255,255,0.42);line-height:1.4">{{ f.desc }}</p>
              </div>
            </div>

            <!-- Outros planos -->
            <div class="d-other-section" style="animation:featureIn 0.5s 0.55s both">
              <p style="margin:0 0 0.2rem;font-size:0.8rem;font-weight:600;color:rgba(255,255,255,0.35)">Quer mais recursos?</p>
              <p style="margin:0 0 0.6rem;font-size:0.72rem;color:rgba(255,255,255,0.22)">Planos pagos com quadras ilimitadas, relatórios avançados e notificações — em breve.</p>
              <div class="d-other-grid">
                <div class="d-other-chip" *ngFor="let p of paidPlans">
                  <div style="display:flex;align-items:center;justify-content:center;gap:0.3rem;margin-bottom:0.15rem">
                    <span *ngIf="p.popular" class="material-icons" style="font-size:0.72rem;color:#4ade80">star</span>
                    <span style="font-size:0.7rem;font-weight:700;color:rgba(255,255,255,0.5)">{{ p.name }}</span>
                  </div>
                  <span style="font-family:'Space Grotesk',sans-serif;font-size:0.85rem;font-weight:800;color:rgba(255,255,255,0.65)">{{ p.priceLabel }}</span>
                  <span style="display:block;font-size:0.58rem;color:rgba(255,255,255,0.24);margin-top:0.25rem">Em breve</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════
           TEMPLATE: Auth form
      ══════════════════════════════════ -->
      <ng-template #authForm>

        <div *ngIf="mode !== 'reset'" class="tab-bar">
          <button class="tab-btn" [class.active]="mode==='login'"    (click)="setMode('login')">Entrar</button>
          <button class="tab-btn" [class.active]="mode==='register'" (click)="setMode('register')">Cadastrar</button>
        </div>

        <div *ngIf="mode === 'reset'" style="margin-bottom:1.25rem">
          <button class="back-form-btn" (click)="setMode('login')">
            <span class="material-icons" style="font-size:1rem">arrow_back</span> Voltar
          </button>
          <p style="font-family:'Space Grotesk',sans-serif;font-weight:600;color:#fff;margin:0">Redefinir senha</p>
          <p style="font-size:0.78rem;color:rgba(255,255,255,0.45);margin:0.2rem 0 0">Enviaremos um link para o seu e-mail</p>
        </div>

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
                 [placeholder]="mode==='register' ? 'Senha (mín. 6 caracteres)' : 'Senha'"
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
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private establishmentService = inject(EstablishmentService);

  phase: Phase = 'browse';
  mobileStep: MobileStep = 'landing';
  landingExiting = false;
  authExiting = false;
  mode: Mode = 'login';
  selectedPlan: PlanOption | null = null;

  name = ''; email = ''; password = '';
  showPass = false; loading = false; error = ''; success = '';

  freePlan: PlanOption = {
    id: 'free', name: 'Free', priceLabel: 'Grátis', price: 0,
    courts: '1 quadra', available: true, popular: false,
    features: [
      { icon: 'store',          title: '1 quadra cadastrada',      desc: 'Gerencie sua primeira quadra sem custo' },
      { icon: 'calendar_month', title: 'Agendamentos ilimitados',  desc: 'Sem limite de reservas por mês' },
      { icon: 'group',          title: 'Cadastro de clientes',     desc: 'Histórico e preferências de cada cliente' },
      { icon: 'bar_chart',      title: 'Dashboard básico',         desc: 'Visão geral de ocupação e faturamento' },
    ],
  };

  paidPlans: PlanOption[] = [
    { id: 'essencial', name: 'Essencial', priceLabel: 'R$ 89',  price: 89,  courts: '2 quadras',  available: false, popular: false, features: [] },
    { id: 'pro',       name: 'Pro',       priceLabel: 'R$ 159', price: 159, courts: '5 quadras',  available: false, popular: true,  features: [] },
    { id: 'business',  name: 'Business',  priceLabel: 'R$ 269', price: 269, courts: 'Ilimitadas', available: false, popular: false, features: [] },
  ];

  steps = [
    { title: 'Escolha seu plano',    desc: 'Comece grátis, sem cartão.' },
    { title: 'Configure sua arena',  desc: 'Quadras, horários e preços.' },
    { title: 'Receba reservas',      desc: 'Clientes agendam 24h pelo app.' },
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
    if (this.mode === 'login')    return 'Entrar';
    if (this.mode === 'register') return 'Criar conta grátis';
    return 'Enviar link de redefinição';
  }

  selectPlan(plan: PlanOption) {
    if (!plan.available) return;
    this.selectedPlan = plan;
    this.mode = 'register';
    this.error = ''; this.success = '';
    // Desktop: anima os painéis imediatamente
    this.phase = 'selected';
    // Mobile: fade-out da landing antes de mostrar o formulário
    this.landingExiting = true;
    setTimeout(() => {
      this.mobileStep = 'auth';
      this.landingExiting = false;
    }, 380);
  }

  clearSelection() {
    this.selectedPlan = null;
    this.phase = 'browse';
    this.error = ''; this.success = '';
  }

  goToLogin() {
    this.selectedPlan = null;
    this.mode = 'login';
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

  async submit() {
    this.error = ''; this.success = ''; this.loading = true;
    try {
      if (this.mode === 'login') {
        await this.auth.loginWithEmail(this.email, this.password);
        this.router.navigate(['/']);
      } else if (this.mode === 'register') {
        if (this.selectedPlan) {
          this.establishmentService.setPendingPlan(this.selectedPlan.id);
        }
        await this.auth.registerWithEmail(this.name, this.email, this.password);
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
    try { await this.auth.loginWithGoogle(); this.router.navigate(['/']); }
    catch { this.error = 'Não foi possível entrar com Google. Tente novamente.'; this.loading = false; }
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
