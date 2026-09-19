import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { LightItem } from '@features/lights/models/lights.models';
/**
 * Serwis odpowiedzialny za pobieranie i aktualizację stanu świateł w aplikacji.
 *
 * ### Zasady działania:
 * - Pobiera aktualny stan wszystkich lamp z endpointu API.
 * - Wysyła żądanie aktualizacji stanu pojedynczej lampy (włącz/wyłącz) do API.
 * - Konwertuje stan boolean na format numeryczny wymagany przez API (`1` / `0`).
 */
@Injectable({
  providedIn: 'root',
})
export class LightsControlService {
  /** Inject httpClient do wykonywania żądań HTTP w Angularze.*/
  private http = inject(HttpClient);
  /** Adres endpoint API odpowiedzialnego za operacje związane z oświetleniem*/
  private readonly apiUrl = `${environment.apiUrl}/lights`;
  /**
   * Pobiera aktualny stan wszystkich lamp z API.
   *
   * @returns {Observable<LightItem[]>} Obserwowalny obiekt zawierający listę lamp z ich aktualnym stanem.
   */
  public getStatus(): Observable<LightItem[]> {
    return this.http.get<LightItem[]>(`${this.apiUrl}/status/app`);
  }
  /**
   * Wysyła żądanie HTTP POST do API w celu aktualizacji stanu wybranej lampy.
   *
   * Konwertuje wartość `boolean` na format numeryczny akceptowany przez API:
   * `true` → `1` (włączona), `false` → `0` (wyłączona).
   *
   * @param {string} name Identyfikator (nazwa) lampy do zaktualizowania (np. `'living_room'`).
   * @param {boolean} state Nowy stan lampy: `true` — włącz, `false` — wyłącz.
   * @returns {Observable<LightItem>} Obserwowalny obiekt zawierający zaktualizowane dane lampy.
   */
  public updateStatus(name: string, state: boolean): Observable<LightItem> {
    const payload = {
      name,
      state: state ? 1 : 0,
    };

    return this.http.post<LightItem>(`${this.apiUrl}/update`, payload);
  }
}
