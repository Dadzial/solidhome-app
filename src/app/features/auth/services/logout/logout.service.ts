import { inject, Injectable } from '@angular/core';
import { ApiService } from '@core/services/api/api.service';
import { LogoutResponse } from '@features/auth/models/auth.models';
import { Observable } from 'rxjs';

/**
 * Serwis odpowiedzialny za zakończenie sesji użytkownika w aplikacji poprzez wywołanie odpowiedniego endpointu API.
 *
 * ### Zasady działania:
 * - Wysyła żądanie HTTP DELETE za pośrednictwem serwisu ApiService do endpointu wylogowania użytkownika.
 * - Oczekuje odpowiedzi w formacie LogoutResponse, która zawiera informacje o wyniku operacji wylogowania.
 */
@Injectable({
  providedIn: 'root',
})
export class LogoutService {
  /** Inject ApiService do wykonywania żądań do backendu. */
  private api = inject(ApiService);

  /**
   * Wysyła żądanie HTTP DELETE do endpointu API w celu wylogowania użytkownika.
   *
   * @returns {Observable<LogoutResponse>} Obserwowalny obiekt zawierający odpowiedź z serwera po wylogowaniu.
   */
  public logout(): Observable<LogoutResponse> {
    return this.api.delete<LogoutResponse>('user/logout');
  }
}
