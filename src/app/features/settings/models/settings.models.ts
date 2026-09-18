/**
 * Dane wysyłane do endpointu API w celu aktualizacji profilu użytkownika.
 *
 * Wszystkie pola są opcjonalne — wysyłane są tylko te, które użytkownik chce zmienić.
 *
 * @interface UpdateUserRequest
 * @property email Nowy adres e-mail użytkownika.
 * @property userName Nowa nazwa użytkownika (login).
 * @property currentPassword Aktualne hasło użytkownika — wymagane do weryfikacji tożsamości przy zmianie hasła.
 * @property password Nowe hasło użytkownika w postaci jawnej (szyfrowane po stronie HTTPS).
 */
export interface UpdateUserRequest {
  email?: string;
  userName?: string;
  currentPassword?: string;
  password?: string;
}
/**
 * Odpowiedź serwera po pomyślnej aktualizacji danych użytkownika.
 *
 * @interface UpdateUserResponse
 * @property _id Unikalny identyfikator zaktualizowanego konta w bazie danych.
 * @property userName Zaktualizowana nazwa użytkownika widoczna w systemie.
 */
export interface UpdateUserResponse {
  _id: string;
  userName: string;
}
