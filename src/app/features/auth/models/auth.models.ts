/**
 * Dane logowania wysyłane do endpointu uwierzytelniania.
 *
 * @interface LoginRequest
 * @property userName Nazwa użytkownika do uwierzytelnienia.
 * @property password Hasło użytkownika w postaci jawnej (szyfrowane po stronie HTTPS).
 * @property rememberMe Flaga określająca, czy token ma być przechowywany w localStorage czy sessionStorage.
 */
export interface LoginRequest {
  userName: string;
  password: string;
  rememberMe?: boolean;
}
/**
 * Odpowiedź serwera po pomyślnym uwierzytelnieniu użytkownika.
 *
 * @interface LoginResponse
 * @property token Token JWT używany do autoryzacji kolejnych żądań API.
 */
export interface LoginResponse {
  token: string;
}
/**
 * Dane rejestracji nowego użytkownika wysyłane do endpointu tworzenia konta.
 *
 * @interface RegisterRequest
 * @property email Adres e-mail nowego użytkownika (używany jako identyfikator i do weryfikacji konta).
 * @property userName Unikalna nazwa użytkownika widoczna w systemie.
 * @property password Hasło nowego użytkownika w postaci jawnej (szyfrowane po stronie HTTPS).
 */
export interface RegisterRequest {
  email: string;
  userName: string;
  password: string;
}
/**
 * Odpowiedź serwera po pomyślnym zarejestrowaniu nowego użytkownika.
 *
 * @interface RegisterResponse
 * @property _id Unikalny identyfikator nowo utworzonego konta w bazie danych.
 * @property email Adres e-mail przypisany do nowego konta.
 * @property userName Nazwa użytkownika przypisana do nowego konta.
 */
export interface RegisterResponse {
  _id: string;
  email: string;
  userName: string;
}
/**
 * Dane żądania weryfikacji adresu e-mail do wysłania kodu resetującego hasło.
 *
 * @interface VerifyEmailRequest
 * @property email Adres e-mail użytkownika, na który zostanie wysłany link weryfikacyjny.
 */
export interface VerifyEmailRequest {
  email: string;
}
/**
 * Odpowiedź serwera po wysłaniu żądania weryfikacji e-mail.
 *
 * @interface VerifyEmailResponse
 * @property message Komunikat potwierdzający wysłanie wiadomości weryfikacyjnej.
 */
export interface VerifyEmailResponse {
  message: string;
}
/**
 * Dane wymagane do potwierdzenia resetu hasła użytkownika.
 *
 * @interface ConfirmPasswordRequest
 * @property code Jednorazowy kod weryfikacyjny przesłany na adres e-mail użytkownika.
 * @property password Nowe hasło użytkownika w postaci jawnej (szyfrowane po stronie HTTPS).
 */
export interface ConfirmPasswordRequest {
  code: string;
  password: string;
}
/**
 * Odpowiedź serwera po pomyślnym potwierdzeniu resetu hasła.
 *
 * @interface ConfirmPasswordResponse
 * @property message Komunikat potwierdzający pomyślną zmianę hasła.
 */
export interface ConfirmPasswordResponse {
  message: string;
}
