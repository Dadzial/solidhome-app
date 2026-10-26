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
    catchError((err: HttpErrorResponse) => {
      const { status, error: body, message } = err;
      const apiMessage = body?.error || body?.message;

      let normalizedError: ApiError;

      if (status === 400) {
        normalizedError =
          typeof body === 'object' && body !== null ? body : { error: 'serverErrors.default' };
      } else if (status === 401) {
        normalizedError = { error: 'serverErrors.unauthorized' };
      } else if (status === 409) {
        normalizedError = { error: 'serverErrors.conflict' };
      } else if (status === 429) {
        normalizedError = { error: 'serverErrors.tooManyRequests' };
      } else {
        normalizedError = { error: 'serverErrors.serverError' };
      }

      return throwError(() => normalizedError);
    }),
  );
};
