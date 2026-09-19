import { Routes } from '@angular/router';
import { loginGuard } from '@core/guards/login/login-guard';
/**
 * Główna konfiguracja tras (routingu) aplikacji SolidHome.
 *
 * Wszystkie trasy wykorzystują mechanizm Lazy Loading (`loadComponent`) oraz strażnika `loginGuard`,
 * który weryfikuje obecność tokenu autoryzacyjnego i przekierowuje użytkownika na odpowiedni widok.
 *
 * Dostępne ścieżki:
 * - `''` — Strona autoryzacji (logowanie, rejestracja, odzyskiwanie hasła)
 * - `'home'` — Strona główna z pulpitem i widokiem powitalnym
 * - `'lights'` — Podstrona sterowania oświetleniem
 * - `'gates'` — Podstrona sterowania bramami (w budowie)
 * - `'air'` — Podstrona jakości powietrza (w budowie)
 * - `'security'` — Podstrona systemu bezpieczeństwa (w budowie)
 */
export const routes: Routes = [
  {
    path: '',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./pages/auth/auth-page.component').then((m) => m.AuthPageComponent),
  },
  {
    path: 'home',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('@pages/home/home-page.component').then((m) => m.HomePageComponent),
  },
  {
    path: 'lights',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('@pages/lights/lights-page.component').then((m) => m.LightsPageComponent),
  },
  {
    path: 'gates',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('@pages/gates/gates-page.component').then((m) => m.GatesPageComponent),
  },
  {
    path: 'air',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('@pages/air/air-page.component').then((m) => m.AirPageComponent),
  },
  {
    path: 'security',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('@pages/security/security-page.component').then((m) => m.SecurityPageComponent),
  },
];
