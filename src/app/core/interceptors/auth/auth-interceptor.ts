import { HttpInterceptorFn } from '@angular/common/http';
/**
 * Interceptor HTTP dołączający token JWT do nagłówków wychodzących żądań.
 *
 * ### Zasady działania:
 * Pobiera token z `localStorage` lub `sessionStorage`.
 * Jeśli token istnieje, klonuje żądanie i dodaje nagłówek `Authorization: Bearer <token>`.
 *
 * @param req Wychodzące żądanie HTTP.
 * @param next Następny handler w łańcuchu przetwarzania HTTP.
 * @returns Strumień Observable zdarzeń HTTP.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq);
};
