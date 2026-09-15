import { Injectable, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
/**
 * Serwis odpowiedzialny za zarządzanie dynamicznym kolorem akcentu w aplikacji.
 *
 * ### Zasady działania:
 * - Modyfikuje globalną zmienną CSS `—accent-color` na elemencie `document.documentElement`.
 * - Przechowuje aktualny kolor w reaktywnym sygnale `currentThemeColor`.
 * - Utrwala preferencje użytkownika w `localStorage` pod kluczem `solidhome-accent-color`.
 */
@Injectable({
  providedIn: 'root',
})
export class AccentColorService {
  private document = inject(DOCUMENT);
  /**
   * Reaktywny sygnał przechowujący aktualnie aktywną zmienną CSS koloru akcentu.
   * @type signal
   */
  public readonly currentThemeColor = signal<string>('var(--theme-accent-cyan)');

  /** Klucz używany do zapisu wybranego koloru w `localStorage`. */
  private readonly storageKey = 'solidhome-accent-color';

  /**
   * Inicjalizuje serwis i przywraca zapisany kolor motywu z `localStorage`.
   */
  constructor() {
    this.initTheme();
  }
  /**
   * Ustawia nowy kolor akcentu w aplikacji.
   *
   * Aplikuje zmienną CSS do elementu głównego DOM, aktualizuje stan sygnału
   * oraz zapisuje wybór użytkownika w `localStorage`.
   *
   * @param colorVar Zmienna CSS reprezentująca wybrany kolor (np. `'var(--theme-accent-cyan)'`).
   * @returns {void}
   */
  public setAccentColor(colorVar: string): void {
    this.document.documentElement.style.setProperty('--accent-color', colorVar);

    this.currentThemeColor.set(colorVar);
    localStorage.setItem(this.storageKey, colorVar);
  }
  /**
   * Odczytuje zapisany kolor z pamięci podręcznej przeglądarki i aplikuje go przy starcie aplikacji.
   *
   * @private
   * @returns {void}
   */
  private initTheme(): void {
    const savedColor = localStorage.getItem(this.storageKey);
    if (savedColor) {
      this.setAccentColor(savedColor);
    }
  }
}
