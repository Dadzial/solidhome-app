import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/auth/auth-page.component')
      .then(m => m.AuthPageComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('@pages/home/home.component')
      .then(m => m.HomeComponent)
  },
  {
    path: 'lights',
    loadComponent: () => import('@pages/lights/lights.component')
      .then(m => m.LightsComponent)
  },
  {
    path: 'gates',
    loadComponent: () => import('@pages/gates/gates.component')
      .then(m => m.GatesComponent)
  },
  {
    path: 'air',
    loadComponent: () => import('@pages/air/air.component')
      .then(m => m.AirComponent)
  },
  {
    path: 'security',
    loadComponent: () => import('@pages/security/security.component')
     .then(m => m.SecurityComponent)
  }
];
