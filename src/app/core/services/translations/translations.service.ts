import { Injectable ,inject, signal} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
/**
 * Dostępne tryby jezykowe aplikacji.
 * @type Language
 */
type Language = 'en' | 'pl';
/**
 * Serwis odpowiedzialny za zarządzanie jezykiem polskim lub angielskim w aplikacji.
 *
 * ### Zasady działania:
 * - Rejestruje obsługiwane języki (`pl`, `en`) oraz ustawia język domyślny (`pl`).
 * - Odczytuje zapisany wcześniej język z `localStorage` podczas startu (fallback: `'en'`).
 * - Umożliwia dynamiczną zmianę języka, aktualizując stan w reaktywnym sygnale, bibliotece tłumaczeń
 */
@Injectable({
  providedIn: 'root',
})
export class TranslationsService {
  /** Inject TranslateService do wykonywania tłumaczeń w aplikacji.*/
  private translate = inject(TranslateService);
  /**
   * Reaktywny sygnał przechowujący aktualnie aktywny język aplikacji.
   * @type signal
   */
  currentLang = signal<Language>(this.getSavedLang());
  /**
   * Inicjalizuje serwis dodaje jezyki ustawia domyślny i wywołuje aktualny
   */
  constructor() {
    this.translate.addLangs(['pl', 'en']);
    this.translate.setDefaultLang('pl');
    this.translate.use(this.currentLang());
  }
  /**
   * Zmienia bieżący język aplikacji.
   *
   * Aktualizuje wartość sygnału `currentLang`, przełącza aktywny język w `TranslateService`
   * oraz zapisuje nowy wybór w `localStorage` pod kluczem `'lang'`.
   *
   * @param lang Kod nowego języka do ustawienia (`'en'` lub `'pl'`).
   */
  setLanguage(lang: Language) {
    this.currentLang.set(lang);
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }
  /**
   * Pobiera zapisany język z `localStorage`.
   *
   * Weryfikuje poprawność odczytanej wartości. Jeśli w pamięci brak klucza `'lang'`
   * lub zawiera on nieobsługiwaną wartość, zwraca domyślnie `'en'`.
   *
   * @returns {Language} Odczytany lub domyślny kod języka.
   */
  private getSavedLang(): Language {
    const saved = localStorage.getItem('lang') as Language;
    if (saved === 'pl' || saved === 'en') return saved;
    return 'en';
  }
}
