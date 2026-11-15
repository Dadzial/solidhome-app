import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';

/**
 * Komponent nakładki błędu dla widgetów dashboardu oraz widoków poziomu strony..
 *
 * ### Zasady działania:
 * - Wyświetla ikonę błędu, tytuł błędu (opcjonalny) oraz przycisk "Spróbuj ponownie".
 * - Emituje zdarzenie `retry` po kliknięciu przycisku ponownej próby.
 * - Obsługuje dwa tryby wyświetlania: `'overlay'` (domyślny) dla pojedynczego widgetu oraz `'page'` dla pełnej nakładki strony.
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
