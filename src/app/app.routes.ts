import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'agendamentos', loadComponent: () => import('./pages/agendamentos/agendamentos.component').then(m => m.AgendamentosComponent) },
      { path: 'quadras', loadComponent: () => import('./pages/quadras/quadras.component').then(m => m.QuadrasComponent) },
      { path: 'clientes', loadComponent: () => import('./pages/clientes/clientes.component').then(m => m.ClientesComponent) },
      { path: 'promocoes', loadComponent: () => import('./pages/promocoes/promocoes.component').then(m => m.PromocoesComponent) },
      { path: 'relatorios', loadComponent: () => import('./pages/relatorios/relatorios.component').then(m => m.RelatoriosComponent) },
      { path: 'mensalistas', loadComponent: () => import('./pages/mensalistas/mensalistas.component').then(m => m.MensalistasComponent) },
      { path: 'reservas', loadComponent: () => import('./pages/reservas/reservas.component').then(m => m.ReservasComponent) },
      { path: 'perfil', loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.PerfilComponent) },
      { path: 'planos', loadComponent: () => import('./pages/planos/planos.component').then(m => m.PlanosComponent) },
      { path: 'financeiro', loadComponent: () => import('./pages/financeiro/financeiro.component').then(m => m.FinanceiroComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
