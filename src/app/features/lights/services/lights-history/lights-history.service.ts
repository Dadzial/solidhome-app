import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { LightHistoryItem, ResetHistoryResponse } from '@features/lights/models/lights.models';
/**
 * Serwis odpowiedzialny za pobieranie i resetowanie historii zmian stanu świateł.
 *
 * ### Zasady działania:
 * - Pobiera listę ostatnich zdarzeń (włączeń i wyłączeń lamp) z endpointu API.
 * - Umożliwia opcjonalne ograniczenie liczby zwracanych wpisów przez parametr `limit`.
 * - Wysyła żądanie usunięcia całej historii zmian świateł.
 */
@Injectable({
  providedIn: 'root',
})
export class LightsHistoryService {
  /** Klient HTTP do wykonywania żądań do API. */
  private http = inject(HttpClient);
  /** Adres bazowy endpointów świateł. */
  private readonly apiUrl = `${environment.apiUrl}/lights`;
  /**
   * Pobiera historię zmian stanu świateł z API.
   *
   * @param {number} [limit] Opcjonalna maksymalna liczba zwracanych wpisów historii.
   * @returns {Observable<LightHistoryItem[]>} Obserwowalny obiekt zawierający listę wpisów historii.
   */
  public getHistory(limit?: number): Observable<LightHistoryItem[]> {
    const options = limit ? { params: { limit: limit.toString() } } : {};
    return this.http.get<LightHistoryItem[]>(`${this.apiUrl}/history`, options);
  }
  /**
   * Wysyła żądanie HTTP DELETE do API w celu usunięcia całej historii zmian świateł.
   *
   * @returns {Observable<ResetHistoryResponse>} Obserwowalny obiekt zawierający odpowiedź z liczbą usuniętych wpisów.
   */
  public resetHistory(): Observable<ResetHistoryResponse> {
    return this.http.delete<ResetHistoryResponse>(`${this.apiUrl}/history/reset`);
  }
}
