import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { LogoutResponse } from '@core/models/core.models';
import { Observable } from 'rxjs';
/**
 * Serwis odpowiedzialny za zakończenie sesji użytkownika w aplikacji poprzez wywołanie odpowiedniego endpointu API.
 *
 * ### Zasady działania:
 * - Wysyła żądanie HTTP DELETE do endpointu API odpowiedzialnego za wylogowanie użytkownika.
 * - Oczekuje odpowiedzi w formacie LogoutResponse, która zawiera informacje o wyniku operacji wylogowania.
 */
@Injectable({
  providedIn: 'root',
})
export class LogoutService {
  /** Inject httpClient do wykonywania żądań HTTP w Angularze.*/
  private http = inject(HttpClient);
  /** Adres endpoint API odpowiedzialnego za operacje związane z użytkownikiem. */
  private readonly apiUrl = `${environment.apiUrl}/user`;
  /**
   * Wysyła żądanie HTTP DELETE do endpointu API w celu wylogowania użytkownika.
   *
   * @returns {Observable<LogoutResponse>} Obserwowalny obiekt zawierający odpowiedź z serwera po wylogowaniu.
   */
  public logout() : Observable<LogoutResponse> {
    return this.http.delete<LogoutResponse>(`${this.apiUrl}/logout`);
  }
}
