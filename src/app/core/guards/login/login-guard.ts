import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const loginGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const isAuthPage = state.url === '/';
  
  if (token) {
    if (isAuthPage) {
      return router.createUrlTree(['/home']);
    }
    return true;
  } else {
    if (!isAuthPage) {
      return router.createUrlTree(['/']);
    }
    return true;
  }
};
