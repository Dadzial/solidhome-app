import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '@core/models/core.models';

/**
 * Mapa statusów odpowiedzi HTTP na czytelne klucze tłumaczeń `apiErrors.*`.
 * @type {Record<number, string>}
 */
const STATUS_ERROR_MAP: Record<number, string> = {
  0: 'apiErrors.network',
  401: 'apiErrors.unauthorized',
  403: 'apiErrors.forbidden',
  409: 'apiErrors.conflict',
  429: 'apiErrors.rateLimit',
};

/**
 * Interceptor HTTP przechwytujący błędy odpowiedzi serwera i normalizujący je do jednolitego formatu `ApiError`.
 *
 * ### Zasady mapowania:
 * - **Status 0: ** Brak połączenia z serwerem (`apiErrors.network`).
 * - **Status 400: ** Treść błędu z odpowiedzi backendu lub domyślny fallback (`apiErrors.default`).
 * - **Status 401: ** Błąd uwierzytelnienia (`apiErrors.unauthorized`).
 * - **Status 403: ** Brak uprawnień (`apiErrors.forbidden`).
 * - **Status 409: ** Konflikt unikalności danych (`apiErrors.conflict`).
 * - **Status 429: ** Limit zapytań do API (`apiErrors.rateLimit`).
 * - **Pozostałe błędy (np. 500): ** Ogólny błąd serwera (`apiErrors.server`).
 *
 * @param req Wychodzące żądanie HTTP.
 * @param next Następny handler w łańcuchu przetwarzania HTTP.
 * @returns Strumień Observable zdarzeń HTTP ze znormalizowaną obsługą błędów.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const { status, error: body } = err;

      let normalizedError: ApiError;

      if (status === 400) {
        normalizedError =
          typeof body === 'object' && body !== null ? body : { error: 'apiErrors.default' };
      } else {
        const errorKey = STATUS_ERROR_MAP[status] ?? 'apiErrors.server';
        normalizedError = { error: errorKey };
      }

      return throwError(() => normalizedError);
    }),
  );
};
