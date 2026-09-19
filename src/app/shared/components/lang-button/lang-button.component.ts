import { Component, inject, signal, OnInit } from '@angular/core';
import { TranslationsService } from '@core/services/translations/translations.service';
/**
 * Komponent przycisku wyboru języka aplikacji (PL / EN).
 *
 * Umożliwia przełączanie aktywnego języka interfejsu pomiędzy językiem polskim a angielskim.
 *
 * ### Zasady działania:
 * - Korzysta z `TranslationsService` do odczytu i zmiany aktualnego języka.
 * - Stan `isLoaded` jest aktywowany z opóźnieniem (50ms) po zamontowaniu komponentu,
 *   co zapobiega niepożądanym animacjom CSS przy wstępnym renderowaniu.
 */
@Component({
  selector: 'app-lang-button',
  standalone: true,
  imports: [],
  templateUrl: './lang-button.component.html',
  styles: ``,
})
export class LangButtonComponent implements OnInit {
  /** Serwis zarządzający językiem i tłumaczeniami w aplikacji. */
  public translationsService = inject(TranslationsService);
  /**
   * Sygnał informujący o załadowaniu komponentu (steruje animacją transition).
   * @type {signal}
   */
  public isLoaded = signal(false);
  /**
   * Inicjalizuje komponent i aktywuje flagę `isLoaded` po krótkim opóźnieniu.
   *
   * @returns {void}
   */
  public ngOnInit(): void {
    setTimeout(() => {
      this.isLoaded.set(true);
    }, 50);
  }
}
