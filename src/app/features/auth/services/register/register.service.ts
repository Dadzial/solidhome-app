import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/services/api/api.service';
import { RegisterRequest, RegisterResponse } from '@features/auth/models/auth.models';
import { Observable } from 'rxjs';

/**
 * Serwis odpowiedzialny za rejestrację nowego użytkownika w systemie.
 *
 * ### Zasady działania:
 * - Wysyła żądanie HTTP POST do endpointu API w celu utworzenia nowego konta użytkownika.
 * - Oczekuje odpowiedzi w formacie `RegisterResponse` zawierającej dane nowo utworzonego konta.
 */
@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  /** Inject ApiService do wykonywania żądań do backendu. */
  private api = inject(ApiService);

  /**
   * Wysyła żądanie HTTP POST do endpointu API w celu rejestracji nowego użytkownika.
   *
   * @param {RegisterRequest} data Dane rejestracji: adres e-mail, nazwa użytkownika i hasło.
   * @returns {Observable<RegisterResponse>} Obserwowalny obiekt zawierający dane nowo zarejestrowanego użytkownika.
   */
  public register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.api.post<RegisterResponse>('user/create', data);
  }
}
