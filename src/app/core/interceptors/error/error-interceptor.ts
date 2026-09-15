import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '@core/models/core.models';
/**
 * Interceptor HTTP przechwytujący błędy odpowiedzi serwera i normalizujący je do formatu `ApiError`.
 *
 * ### Zasady działania:
 * - **Status 400 / 409: ** Zwraca obiekt błędu z backendu lub wiadomość błędu.
 * - **Status 401: ** Normalizuje błąd nieautoryzowanego dostępu lub niepoprawnych danych logowania.
 * - **Status 429: ** Zwraca komunikat o zbyt dużej liczbie zapytań (rate limit).
 * - **Pozostałe błędy (np. 500): ** Zwraca ogólny komunikat o błędzie serwera.
 *
 * @param req Wychodzące żądanie HTTP.
 * @param next Następny handler w łańcuchu przetwarzania HTTP.
 * @returns Strumień Observable zdarzeń HTTP ze znormalizowaną obsługą błędów.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let normalizedError: ApiError;

      if (error.status === 400 || error.status === 409) {
        normalizedError = typeof error.error === 'object' && error.error !== null
          ? error.error
          : { error: error.message };
      } else if (error.status === 401) {
        normalizedError = { error: error.error?.error || 'Invalid credentials or unauthorized' };
      } else if (error.status === 429) {
        normalizedError = { error: 'Too many requests, try again later' };
      } else {
        normalizedError = { error: error.error?.error || 'Server error, try again later' };
      }

      return throwError(() => normalizedError);
    }),
  );
};
