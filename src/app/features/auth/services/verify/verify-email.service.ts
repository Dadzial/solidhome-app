import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { VerifyEmailRequest, VerifyEmailResponse } from '@features/auth/models/auth.models';
import { Observable } from 'rxjs';
/**
 * Serwis odpowiedzialny za wysłanie żądania weryfikacji adresu e-mail użytkownika (odzyskiwanie hasła).
 *
 * ### Zasady działania:
 * - Wysyła żądanie HTTP POST do endpointu API z adresem e-mail użytkownika.
 * - Backend generuje jednorazowy kod weryfikacyjny i wysyła go na podany adres e-mail.
 * - Oczekuje odpowiedzi w formacie `VerifyEmailResponse` potwierdzającej wysłanie wiadomości.
 */
@Injectable({
  providedIn: 'root',
})
export class VerifyEmailService {
  /** Inject httpClient do wykonywania żądań HTTP w Angularze.*/
  private http = inject(HttpClient);
  /** Adres endpoint API odpowiedzialnego za operacje związane z użytkownikiem. */
  private readonly apiUrl = `${environment.apiUrl}/user`;
  /**
   * Wysyła żądanie HTTP POST do endpointu API w celu wygenerowania i przesłania kodu weryfikacyjnego na e-mail.
   *
   * @param {VerifyEmailRequest} data Dane żądania zawierające adres e-mail użytkownika.
   * @returns {Observable<VerifyEmailResponse>} Obserwowalny obiekt zawierający odpowiedź potwierdzającą wysłanie kodu.
   */
  public verifyEmail(data: VerifyEmailRequest): Observable<VerifyEmailResponse> {
    return this.http.post<VerifyEmailResponse>(`${this.apiUrl}/reset/code`, data);
  }
}
