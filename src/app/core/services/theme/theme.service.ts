import { Injectable, signal, effect, Signal } from '@angular/core';
/**
 * Dostępne tryby motywów w aplikacji.
 * @type Theme
 */
type Theme = 'light' | 'dark';
/**
 * Serwis odpowiedzialny za zarządzanie motywem kolorystycznym (jasny/ciemny) w aplikacji.
 *
 * ### Zasady działania:
 * - Przechowuje aktualny motyw w reaktywnym sygnale `theme`.
 * - Odczytuje zapisane preferencje z `localStorage` lub z preferencji systemowych (`prefers-color-scheme`).
 * - Automatycznie synchronizuje klasę `.dark` na elemencie `document.documentElement` (`<html>`) za pomocą efektu Angulara (`effect`).
 * - Zapisuje każdą zmianę motywu w `localStorage` pod kluczem `'app-theme'`.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  /** Klucz używany do zapisu wybranego motywu w `localStorage`. */
  private readonly localStoreTheme = 'app-theme';
  /**
   * Reaktywny sygnał przechowujący aktualnie aktywny motyw aplikacji.
   * @type {Signal<Theme>}
   */
  readonly theme = signal<Theme>(this.getSavedTheme());
  /**
   * Inicjalizuje serwis i rejestruje reaktywny efekt (`effect`), który przy każdej zmianie
   * sygnału `theme` aktualizuje `localStorage` oraz dodaje/usuwa klasę `.dark` na elemencie `<html>`.
   */
  constructor() {
    effect(() => {
      const currentTheme = this.theme();
      localStorage.setItem(this.localStoreTheme, currentTheme);

      if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }
  /**
   * Pobiera zapisany motyw z `localStorage` lub wykrywa preferencje systemowe użytkownika.
   *
   * @private
   * @returns {Theme} Odczytany lub wykryty motyw (`'light'` lub `'dark'`).
   */
  private getSavedTheme(): Theme {
    const saved = localStorage.getItem(this.localStoreTheme);
    if (saved === 'dark' || saved === 'light') return saved;

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  /**
   * Przełącza aktualny motyw pomiędzy jasnym (`'light'`) a ciemnym (`'dark'`).
   *
   * @returns {void}
   */
  public toggleTheme(): void {
    this.theme.update((current) => (current === 'light' ? 'dark' : 'light'));
  }
}
