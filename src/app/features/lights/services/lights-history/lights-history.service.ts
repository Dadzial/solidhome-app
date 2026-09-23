import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import {
  LightHistory,
  LightHistoryItem,
  ResetHistoryResponse,
} from '@features/lights/models/lights.models';
/**
 * Słownik mapujący identyfikatory lamp (klucze API) na klucze i18n tłumaczeń nazw pomieszczeń.
 *
 * Używany podczas mapowania danych historii z API na model widoku `LightHistory`.
 */
export const ROOMS_NAMES_TRANSLATIONS: Record<string, string> = {
  living_room: 'home.lightsWidget.rooms.livingRoom',
  kitchen: 'home.lightsWidget.rooms.kitchen',
  boiler_room: 'home.lightsWidget.rooms.boilerRoom',
  bathroom: 'home.lightsWidget.rooms.bathroom',
  hallway: 'home.lightsWidget.rooms.hallway',
  garage: 'home.lightsWidget.rooms.garage',
};
/**
 * Serwis odpowiedzialny za pobieranie, przetwarzanie i resetowanie historii zmian stanu świateł.
 *
 * Zarządza reaktywnym stanem historii za pomocą Angular Signals (`history`).
 *
 * ### Zasady działania:
 * - Przechowuje listę przetworzonych wpisów historii w sygnale `history`.
 * - `loadHistory()` pobiera listę zdarzeń z API, mapuje nazwy pomieszczeń na klucze i18n oraz formatuje czas.
 * - `clearHistory()` usuwa historię w bazie przez API i natychmiast czyści lokalny sygnał `history`.
 * - Udostępnia również niskopoziomowe metody `getHistory()` oraz `resetHistory()` zwracające `Observable`.
 */
@Injectable({
  providedIn: 'root',
})
export class LightsHistoryService {
  /** Inject httpClient do wykonywania żądań HTTP w Angularze. */
  private http = inject(HttpClient);
  /** Adres endpoint API odpowiedzialnego za operacje związane z oświetleniem. */
  private readonly apiUrl = `${environment.apiUrl}/lights`;
  /**
   * Sygnał przechowujący przetworzone wpisy historii zmian świateł do wyświetlenia w widoku.
   * @type {signal}
   */
  public readonly history = signal<LightHistory[]>([]);

  /**
   * Pobiera historię zmian świateł z API, mapuje ją na model widoku `LightHistory` i aktualizuje sygnał `history`.
   *
   * Nazwy pomieszczeń są tłumaczone za pomocą słownika `ROOMS_NAMES_TRANSLATIONS`.
   * Czas zdarzenia jest formatowany do formatu `HH:MM`.
   * Gdy użytkownik jest nieznany, wyświetlana jest wartość domyślna `'System'`.
   *
   * @param {number} [limit=20] Opcjonalna maksymalna liczba wpisów do pobrania (domyślnie 20).
   * @returns {void}
   */
  public loadHistory(limit: number = 20): void {
    this.getHistory(limit).subscribe({
      next: (items) => {
        const mapped: LightHistory[] = items.map((item) => ({
          id: item._id,
          name: ROOMS_NAMES_TRANSLATIONS[item.name] || item.name,
          action: item.state === 1 ? 'ON' : 'OFF',
          time: new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          user: item.userId?.userName || 'System',
        }));
        this.history.set(mapped);
      },
      error: (err) => {
        console.error('Failed to load lights history', err);
      },
    });
  }
  /**
   * Usuwa całą historię zmian świateł przez API i czyści lokalny sygnał `history`.
   *
   * @returns {void}
   */
  public clearHistory(): void {
    this.resetHistory().subscribe({
      next: () => {
        this.history.set([]);
      },
      error: (err) => {
        console.error('Failed to reset lights history', err);
      },
    });
  }
  /**
   * Pobiera surową historię zmian stanu świateł z API jako Observable.
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
