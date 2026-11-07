import { inject, Injectable } from '@angular/core';
import { ApiService } from '@core/services/api/api.service';
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
  /** Inject ApiService do wykonywania żądań do backendu. */
  private api = inject(ApiService);

  /**
   *  Wysyła żądanie HTTP POST do endpointu API w celu aktualizacji danych użytkownika.
   *
   * @param {UpdateUserRequest} data Dane żadania zawierające pola do aktualizacji profilu użytkownika.
   * @returns {Observable<UpdateUserResponse>} Obserwowany obiekt zawierający odpowiedź z serwera
   * po pomyślnej aktualizacji danych użytkownika.
   */
  public updateUser(data: UpdateUserRequest): Observable<UpdateUserResponse> {
    return this.api.post<UpdateUserResponse>('user/update', data);
  }
}
