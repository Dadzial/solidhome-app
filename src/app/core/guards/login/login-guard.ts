import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

/**
 * Guard kontrolujący dostęp do tras na podstawie stanu uwierzytelnienia użytkownika.
 * Sprawdza obecność tokenu JWT w `localStorage` lub `sessionStorage`.
 *
 * - Zalogowany użytkownik wchodzący na stronę logowania (`/`) jest przekierowywany na `/home`.
 * - Niezalogowany użytkownik próbujący wejść na chronioną trasę jest przekierowywany na `/`.
 * - W pozostałych przypadkach nawigacja jest dozwolona.
 *
 * @constant loginGuard
 * @param _route Nieużywany snapshot aktywowanej trasy.
 * @param state Stan routera zawierający docelowy adres URL (`state.url`).
 * @returns Jeśli przejście jest dozwolone, zwraca `true`, w przeciwnym razie `urltree` przekierowujący na odpowiednią stronę.
 */
export const loginGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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
