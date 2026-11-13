import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';

/**
 * Reużywalny komponent nakładki błędu dla widgetów dashboardu oraz widoków poziomu strony.
 *
 * ### Funkcjonalności:
 * - Dwa tryby wyświetlania (`mode`):
 *   - `'overlay'` (domyślny) - nakładka z rozmyciem tła (backdrop-blur-md) i zaokrągleniem (rounded-3xl) dedykowana dla pojedynczych kafelków/widgetów.
 *   - `'full'` - dedykowany dla błędu poziomu strony; czysty, wycentrowany widok bez rozmycia i sztucznych zaokrągleń tła.
 * - Prezentuje pojedynczy, czytelny komunikat o błędzie (z domyślnym fallbackiem do `apiErrors.server`).
 * - Udostępnia przycisk manualnego ponowienia ("Spróbuj ponownie"), który pozwala użytkownikowi
 *   natychmiast ponowić zapytanie bez konieczności odświeżania całej strony (F5).
 */
@Component({
  selector: 'app-error-overlay',
  standalone: true,
  imports: [TranslatePipe, SvgIconComponent],
  templateUrl: './error-overlay.component.html',
  styles: ``,
})
export class ErrorOverlayComponent {
  /**
   * Tryb wyświetlania nakładki:
   * - `'overlay'` (domyślny): nakładka dopasowana do pojedynczego kafelka widgetu (z `rounded-3xl`).
   * - `'page'`: pełnowymiarowa nakładka poziomu strony rozmywająca wszystkie kafelki w tle (bez zaokrąglenia krawędzi).
   */
  public mode = input<'overlay' | 'page'>('overlay');

  /**
   * Opcjonalny tytuł błędu wyświetlany na nakładce.
   * Jeśli nie zostanie podany, używany jest domyślny komunikat 'apiErrors.server'.
   */
  public title = input<string>('');

  /**
   * Zdarzenie emitowane po kliknięciu przycisku ponownej próby.
   */
  public retry = output<void>();

  /**
   * Obsługuje manualne kliknięcie przycisku "Spróbuj ponownie".
   *
   * @returns {void}
   */
  public onRetryClick(): void {
    this.retry.emit();
  }
}
