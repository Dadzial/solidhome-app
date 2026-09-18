import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
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
  /** Inject httpClient do wykonywania żądań HTTP w Angularze.*/
  private http = inject(HttpClient);
  /** Adres endpoint API odpowiedzialnego za operacje związane z użytkownikiem. */
  private readonly apiUrl = `${environment.apiUrl}/user`;
  /**
   * Wysyła żądanie HTTP POST do endpointu API w celu rejestracji nowego użytkownika.
   *
   * @param {RegisterRequest} data Dane rejestracji: adres e-mail, nazwa użytkownika i hasło.
   * @returns {Observable<RegisterResponse>} Obserwowalny obiekt zawierający dane nowo zarejestrowanego użytkownika.
   */
  public register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/create`, data);
  }
}
