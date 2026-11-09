import { inject, Injectable } from '@angular/core';
import { ApiConnectService } from '@core/services/api/api-connect.service';
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
  /** Inject ApiConnectService do wykonywania żądań do backendu. */
  private api = inject(ApiConnectService);

  /**
   * Wysyła żądanie HTTP POST do endpointu API w celu wygenerowania i przesłania kodu weryfikacyjnego na e-mail.
   *
   * @param {VerifyEmailRequest} data Dane żądania zawierające adres e-mail użytkownika.
   * @returns {Observable<VerifyEmailResponse>} Obserwowalny obiekt zawierający odpowiedź potwierdzającą wysłanie kodu.
   */
  public verifyEmail(data: VerifyEmailRequest): Observable<VerifyEmailResponse> {
    return this.api.post<VerifyEmailResponse>('user/reset/code', data);
  }
}
