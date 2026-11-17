import { Component, inject, OnInit } from '@angular/core';
import { AirDataReadService } from '@features/air/services/air-data-read/air-data-read.service';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Widżet prezentujący bieżące parametry powietrza (temperatura, wilgotność, ciśnienie z czujnika BMP280).
 *
 * ### Zasady działania:
 * - Pobiera dane z serwisu `AirDataReadService`, który komunikuje się z API i nasłuchuje aktualizacji przez SSE.
 * - Wyświetla aktualną temperaturę i ciśnienie.
 */
@Component({
  selector: 'app-air-widget',
  imports: [SvgIconComponent, TranslateModule],
  standalone: true,
  templateUrl: './air-widget.component.html',
  styles: ``,
})
export class AirWidgetComponent implements OnInit {
  /** Inject AirDataReadService do pobierania danych o jakości powietrza. */
  public readonly airDataService = inject(AirDataReadService);

  /**
   * Inicjalizuje komponent i aktywuje pobranie danych startowych.
   *
   * @returns {void}
   */
  public ngOnInit(): void {
    this.airDataService.loadCurrentAir();
  }
}
