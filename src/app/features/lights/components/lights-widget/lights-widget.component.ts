import { Component, inject, input, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { NgClass } from '@angular/common';
import { LightsControlService } from '@features/lights/services/lights-control/lights-control.service';
import { LightsHistoryService } from '@features/lights/services/lights-history/lights-history.service';
/**
 * Komponent widgetu sterowania oświetleniem domowym.
 *
 * Wyświetla interaktywną mapę SVG z rozmieszczonymi lampami oraz listę historii
 * ostatnich zdarzeń włączeń i wyłączeń. Umożliwia sterowanie pojedynczymi lampami
 * lub wszystkimi naraz.
 *
 * ### Zasady działania:
 * - Deleguje zarządzanie stanem i komunikację z API do serwisów `LightsControlService` oraz `LightsHistoryService`.
 * - Przy inicjalizacji (`ngOnInit`) wywołuje pobranie aktualnego stanu lamp i historii zdarzeń.
 * - Udostępnia sygnały serwisów bezpośrednio dla szablonu HTML (`lights`, `history`, `hasError`, `allLightsOn`).
 * - Przekazuje akcje użytkownika z widoku do odpowiednich metod serwisów.
 */
@Component({
  selector: 'app-lights-widget',
  imports: [TranslateModule, SvgIconComponent, NgClass],
  standalone: true,
  templateUrl: './lights-widget.component.html',
  styles: ``,
})
export class LightsWidgetComponent implements OnInit {
  /** Serwis obsługujący stan i sterowanie lampami. */
  public lightsControlService = inject(LightsControlService);
  /** Serwis obsługujący pobieranie i resetowanie historii zmian świateł. */
  public lightsHistoryService = inject(LightsHistoryService);
  /**
   * Klucz i18n tytułu widgetu wyświetlanego w nagłówku.
   * @type {input}
   */
  public titleKey = input<string>('home.lightsWidget.title');
  /** Sygnał przechowujący listę lamp z ich pozycjami na mapie SVG i aktualnym stanem. */
  public readonly lights = this.lightsControlService.lights;
  /** Sygnał informujący o błędzie komunikacji z API. */
  public readonly hasError = this.lightsControlService.hasError;
  /** Sygnał obliczeniowy zwracający `true`, gdy wszystkie lampy są włączone. */
  public readonly allLightsOn = this.lightsControlService.allLightsOn;
  /** Sygnał przechowujący przetworzone wpisy historii zmian świateł do wyświetlenia w widoku. */
  public readonly history = this.lightsHistoryService.history;
  /**
   * Flaga opóźniająca włączenie animacji CSS przełącznika, aby uniknąć ruchu przy pierwszym renderze widoku.
   * @type {signal}
   */
  public isLoaded = signal(false);
  /**
   * Inicjalizuje komponent — pobiera aktualny stan lamp i historię zdarzeń z API za pośrednictwem serwisów.
   *
   * @returns {void}
   */
  public ngOnInit(): void {
    this.lightsControlService.loadLights();
    this.loadHistory();
    setTimeout(() => {
      this.isLoaded.set(true);
    }, 50);
  }
  /**
   * Pobiera historię zmian świateł z API za pośrednictwem `LightsHistoryService`.
   *
   * @returns {void}
   */
  public loadHistory(): void {
    this.lightsHistoryService.loadHistory(20);
  }
  /**
   * Usuwa całą historię zmian świateł za pośrednictwem `LightsHistoryService`.
   *
   * @returns {void}
   */
  public clearHistory(): void {
    this.lightsHistoryService.clearHistory();
  }
  /**
   * Przełącza stan pojedynczej lampy za pośrednictwem `LightsControlService`.
   *
   * @param {string} id Identyfikator lampy do przełączenia (np. `'living_room'`).
   * @returns {void}
   */
  public toggleLight(id: string): void {
    this.lightsControlService.toggleLight(id);
  }
  /**
   * Przełącza stan wszystkich lamp jednocześnie za pośrednictwem `LightsControlService`.
   *
   * @returns {void}
   */
  public toggleAllLights(): void {
    this.lightsControlService.toggleAllLights();
  }
}
