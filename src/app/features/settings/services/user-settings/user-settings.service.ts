import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { UpdateUserRequest, UpdateUserResponse } from '@features/settings/models/settings.models';
import { Observable } from 'rxjs';
/**
 * Serwis odpowiedzialny za aktualizację danych użytkownika w systemie.
 *
 * ### Zasady działania:
 * - Wysyła żądanie HTTP POST do endpointu API z danymi użytkownika do aktualizacji.
 * - Backend weryfikuje dane i aktualizuje profil użytkownika w bazie danych.
 * - Oczekuje odpowiedzi w formacie `UpdateUserResponse` zawierającej zaktualizowane informacje.
 */
@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {
  /** Inject httpClient do wykonywania żądań HTTP w Angularze.*/
  private http = inject(HttpClient);
  /** Adres endpoint API odpowiedzialnego za operacje związane z użytkownikiem. */
  private readonly apiUrl = `${environment.apiUrl}/user`;
  /**
   *  Wysyła żądanie HTTP POST do endpointu API w celu aktualizacji danych użytkownika.
   *
   * @param {UpdateUserRequest} data Dane żadania zawierające pola do aktualizacji profilu użytkownika.
   * @returns {Observable<UpdateUserResponse>} Obserwowany obiekt zawierający odpowiedź z serwera
   * po pomyślnej aktualizacji danych użytkownika.
   */
  public updateUser(data: UpdateUserRequest) : Observable<UpdateUserResponse> {
    return this.http.post<UpdateUserResponse>(`${this.apiUrl}/update`, data);
  }
}
