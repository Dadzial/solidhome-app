import { HttpHeaders, HttpParams } from '@angular/common/http';

/**
 * Zunifikowany model błędu zwracanego przez backend API lub normalizowanego przez `errorInterceptor`.
 *
 * @interface ApiError
 * @property error Główny kod błędu lub krótki komunikat o błędzie (np. 'Invalid credentials').
 * @property message Alternatywny, bardziej szczegółowy komunikat o błędzie z serwera.
 * @property details Szczegółowe informacje o błędach walidacji (np. lista niepoprawnych pól).
 * @property value Błędna wartość przesłana w żądaniu, która spowodowała błąd.
 */
export interface ApiError {
  error?: string;
  message?: string;
  details?: string | string[];
  value?: string;
}

/**
 * Model odpowiedzi serwera po pomyślnym żądaniu wylogowania użytkownika.
 *
 * @interface LogoutResponse
 * @property message Komunikat potwierdzający pomyślne wylogowanie z systemu (np. 'Logged out successfully').
 */
export interface LogoutResponse {
  message: string;
}

/**
 * Opcje konfiguracyjne dla zapytań HTTP w `ApiService`.
 *
 * @interface ApiOptions
 * @property headers Opcjonalne nagłówki HTTP.
 * @property params Opcjonalne parametry zapytania (query params).
 */
export interface ApiOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | Record<string, string | number | boolean | readonly (string | number | boolean)[]>;
}

