import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '@features/auth/services/login/login.service';
import { catchError, switchMap, throwError } from 'rxjs';

/**
 * Interceptor HTTP dołączający token JWT do nagłówków wychodzących żądań oraz obsługujący ciche odświeżanie sesji.
 *
 * ### Zasady działania:
 * - Pobiera aktywny token dostępowy z magazynu przeglądarki (`localStorage` lub `sessionStorage`).
 * - Jeśli token istnieje, dołącza nagłówek `Authorization: Bearer <token>`.
 * - W przypadku błędu `401 Unauthorized` (z wyłączeniem żądań logowania/odświeżania):
 *   - Pobiera zapisany `refreshToken` i wysyła zapytanie do API o nową parę tokenów.
 *   - Po pomyślnym odświeżeniu zapisuje nowe tokeny i automatycznie ponawia pierwotne zapytanie.
 *   - W razie niepowodzenia odświeżenia lub braku `refreshToken` czyści sesję i przekierowuje na stronę logowania (`/`).
 *
 * @param req Wychodzące żądanie HTTP.
 * @param next Następny handler w łańcuchu przetwarzania HTTP.
 * @returns Strumień Observable zdarzeń HTTP.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  const token = loginService.getAccessToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      const isAuthEndpoint = req.url.includes('/user/auth');

      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthEndpoint) {
        const refreshToken = loginService.getRefreshToken();

        if (refreshToken) {
          return loginService.refreshAccessToken().pipe(
            switchMap((response) => {
              loginService.saveTokens(response.token, response.refreshToken);

              const retriedReq = req.clone({
                setHeaders: { Authorization: `Bearer ${response.token}` },
              });
              return next(retriedReq);
            }),
            catchError((refreshErr) => {
              loginService.clearTokens();
              router.navigate(['/']);
              return throwError(() => refreshErr);
            }),
          );
        }

        loginService.clearTokens();
        router.navigate(['/']);
      }

      return throwError(() => error);
    }),
  );
};
