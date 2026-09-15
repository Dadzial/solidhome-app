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
