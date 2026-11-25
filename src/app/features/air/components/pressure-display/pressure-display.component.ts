import { Component, inject, computed } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { AirDataReadService } from '@features/air/services/air-data-read/air-data-read.service';

@Component({
  selector: 'app-pressure-display',
  imports: [SvgIconComponent, TranslateModule],
  standalone: true,
  templateUrl: './pressure-display.component.html',
  styles: ``,
})
export class PressureDisplayComponent {
  /** Inject AirDataReadService do pobierania danych o jakości powietrza. */
  public readonly airDataService = inject(AirDataReadService);

  /**
   * Dynamiczny status ciśnienia atmosferycznego:
   * - 1005 hPa - 1020 hPa: W normie (normal)
   * - poniżej 1005 hPa: Niskie (niż) (low)
   * - powyżej 1020 hPa: Wysokie (wyż) (high)
   * @type {computed}
   */
  public readonly pressureStatusKey = computed<string>(() => {
    const press = this.airDataService.pressure();
    if (press === null) {
      return 'pressureDisplay.normal';
    }
    if (press >= 1005 && press <= 1020) {
      return 'pressureDisplay.normal';
    }
    if (press < 1005) {
      return 'pressureDisplay.low';
    }
    return 'pressureDisplay.high';
  });
}
