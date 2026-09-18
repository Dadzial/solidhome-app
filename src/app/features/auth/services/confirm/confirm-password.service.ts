import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { ConfirmPasswordRequest, ConfirmPasswordResponse } from '@features/auth/models/auth.models';
import { Observable } from 'rxjs';
/**
 * Serwis odpowiedzialny za potwierdzenie resetu hasła użytkownika przy użyciu jednorazowego kodu weryfikacyjnego.
 *
 * ### Zasady działania:
 * - Wysyła żądanie HTTP POST do endpointu API z kodem weryfikacyjnym i nowym hasłem użytkownika.
 * - Oczekuje odpowiedzi w formacie `ConfirmPasswordResponse` potwierdzającej pomyślną zmianę hasła.
 */
@Injectable({
  providedIn: 'root',
})
export class ConfirmPasswordService {
  /** Inject httpClient do wykonywania żądań HTTP w Angularze.*/
  private http = inject(HttpClient);
  /** Adres endpoint API odpowiedzialnego za operacje związane z użytkownikiem. */
  private readonly apiUrl = `${environment.apiUrl}/user`;
  /**
   * Wysyła żądanie HTTP POST do endpointu API w celu potwierdzenia resetu hasła.
   *
   * @param {ConfirmPasswordRequest} data Dane żądania: jednorazowy kod weryfikacyjny i nowe hasło.
   * @returns {Observable<ConfirmPasswordResponse>} Obserwowalny obiekt zawierający odpowiedź potwierdzającą zmianę hasła.
   */
  public confirmNewPassword(data: ConfirmPasswordRequest): Observable<ConfirmPasswordResponse> {
    return this.http.post<ConfirmPasswordResponse>(`${this.apiUrl}/reset/password`, data);
  }
}
