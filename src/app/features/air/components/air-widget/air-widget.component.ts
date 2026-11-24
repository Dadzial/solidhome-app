import { Component, inject, OnInit, computed } from '@angular/core';
import { AirDataReadService } from '@features/air/services/air-data-read/air-data-read.service';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { ErrorOverlayComponent } from '@shared/components/error-overlay/error-overlay.component';

/**
 * Widżet prezentujący bieżące parametry powietrza (temperatura, wilgotność, ciśnienie z czujnika BMP280).
 *
 * ### Zasady działania:
 * - Pobiera dane z serwisu `AirDataReadService`, który komunikuje się z API i nasłuchuje aktualizacji przez SSE.
 * - Wyświetla aktualną temperaturę i ciśnienie.
 * - W razie błędu API wyświetla nakładkę błędu z możliwością ponowienia żądania (`onRetry`).
 */
@Component({
  selector: 'app-air-widget',
  imports: [SvgIconComponent, TranslateModule, ErrorOverlayComponent],
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

  /**
   * Dynamiczny status komfortu termicznego:
   * - 20°C - 24°C: Komfortowa (comfortable)
   * - 18°C - 19.9°C lub 24.1°C - 26°C: Neutralna (neutral)
   * - poniżej 18°C lub powyżej 26°C: Niekomfortowa (notComfortable)
   * @type {computed}
   */
  public readonly temperatureStatusKey = computed<string>(() => {
    const temp = this.airDataService.temperature();
    if (temp === null) {
      return 'home.airWidget.comfortable';
    }
    if (temp >= 20 && temp <= 24) {
      return 'home.airWidget.comfortable';
    }
    if ((temp >= 18 && temp < 20) || (temp > 24 && temp <= 26)) {
      return 'home.airWidget.neutral';
    }
    return 'home.airWidget.notComfortable';
  });

  /**
   * Dynamiczny status ciśnienia atmosferycznego:
   * - 1010 hPa - 1020 hPa: Stabilne (stable)
   * - 1000 hPa - 1009 hPa lub 1021 hPa - 1030 hPa: Umiarkowane (moderate)
   * - poniżej 1000 hPa (niż) lub powyżej 1030 hPa (silny wyż): Niestabilne (unstable)
   * @type {computed}
   */
  public readonly pressureStatusKey = computed<string>(() => {
    const press = this.airDataService.pressure();
    if (press === null) {
      return 'home.airWidget.stable';
    }
    if (press >= 1010 && press <= 1020) {
      return 'home.airWidget.stable';
    }
    if ((press >= 1000 && press < 1010) || (press > 1020 && press <= 1030)) {
      return 'home.airWidget.moderate';
    }
    return 'home.airWidget.unstable';
  });

  /**
   * Ponawia próbę pobrania bieżących danych jakości powietrza po wystąpieniu błędu.
   *
   * @returns {void}
   */
  public onRetry(): void {
    this.airDataService.loadCurrentAir();
  }
}
