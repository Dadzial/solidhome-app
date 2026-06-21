import { Routes } from '@angular/router';
import { loginGuard } from '@core/guards/login/login-guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [loginGuard],
    loadComponent: () => import('./pages/auth/auth-page.component')
      .then(m => m.AuthPageComponent)
  },
  {
    path: 'home',
    canActivate: [loginGuard],
    loadComponent: () => import('@pages/home/home.component')
      .then(m => m.HomeComponent)
  },
  {
    path: 'lights',
    canActivate: [loginGuard],
    loadComponent: () => import('@pages/lights/lights.component')
      .then(m => m.LightsComponent)
  },
  {
    path: 'gates',
    canActivate: [loginGuard],
    loadComponent: () => import('@pages/gates/gates.component')
      .then(m => m.GatesComponent)
  },
  {
    path: 'air',
    canActivate: [loginGuard],
    loadComponent: () => import('@pages/air/air.component')
      .then(m => m.AirComponent)
  },
  {
    path: 'security',
    canActivate: [loginGuard],
    loadComponent: () => import('@pages/security/security.component')
     .then(m => m.SecurityComponent)
  }
];
