import { Injectable, signal } from '@angular/core';

/**
 * Typ reprezentujący dostępne formaty czasu w aplikacji.
 * @type TimeFormat
 */
export type TimeFormat = '12h' | '24h';

@Injectable({
  providedIn: 'root',
})
export class TimeFormatService {
  /**
   * Klucz używany do przechowywania formatu czasu w localStorage.
   */
  private readonly storageKey = 'solidhome-time-format';

  /**
   * Sygnał przechowujący aktualny format czasu.
   * @type {signal}
   */
  public readonly timeFormat = signal<TimeFormat>(this.getSavedFormat());

  /**
   * Konwertuje ciąg godziny z formatu 24-godzinnego ("HH:mm") na format 12-godzinny ("h:mm AM/PM").
   *
   * ### Zasady działania:
   * - Gdy aktywny jest format `'24h'`, zwraca oryginalny ciąg bez modyfikacji.
   * - Weryfikuje poprawność danych wejściowych; w przypadku braku dwukropka lub błędnej godziny zwraca oryginalną wartość.
   * - Dla formatu `'12h'` przelicza godziny na zakres 1–12 i dokleja odpowiedni przyrostek okresu (`AM` / `PM`).
   *
   * @param {string} timeStr Ciąg reprezentujący czas w formacie "HH:mm" (np. `"14:35"` lub `"08:00"`).
   * @returns {string} Sformatowany ciąg czasu zgodnie z aktywnym formatem (np. `"2:35 PM"` lub `"14:35"`).
   */
  public formatTimeString(timeStr: string): string {
    if (!timeStr || !timeStr.includes(':')) return timeStr;
    if (this.timeFormat() === '24h') return timeStr;

    const [hoursStr, minutesStr] = timeStr.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr ?? '00';

    if (isNaN(hours)) return timeStr;

    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${hours}:${minutes} ${period}`;
  }

  /**
   * Odczytuje zapisany format czasu z pamięci lokalnej przeglądarki (`localStorage`).
   *
   * Sprawdza poprawność odczytanej wartości. Jeśli w pamięci brak klucza lub zawiera
   * nieobsługiwaną wartość, domyślnie zwraca format `'24h'`.
   *
   * @private
   * @returns {TimeFormat} Odczytany lub domyślny format czasu (`'24h'` albo `'12h'`).
   */
  private getSavedFormat(): TimeFormat {
    const saved = localStorage.getItem(this.storageKey);
    return saved === '12h' ? '12h' : '24h';
  }
}
