import { Component, inject, computed } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { AirDataReadService } from '@features/air/services/air-data-read/air-data-read.service';

@Component({
  selector: 'app-humidity-display',
  imports: [SvgIconComponent, TranslateModule],
  standalone: true,
  templateUrl: './humidity-display.component.html',
  styles: ``,
})
export class HumidityDisplayComponent {
  /** Inject AirDataReadService do pobierania danych o jakości powietrza. */
  public readonly airDataService = inject(AirDataReadService);

  /**
   * Dynamiczny status wilgotności:
   * - 40% - 60%: Optymalna (optimal)
   * - poniżej 40%: Zbyt sucho (dry)
   * - powyżej 60%: Zbyt wilgotno (humid)
   * @type {computed}
   */
  public readonly humidityStatusKey = computed<string>(() => {
    const humidity = this.airDataService.humidity();
    if (humidity === null) {
      return 'humidityDisplay.optimal';
    }
    if (humidity >= 40 && humidity <= 60) {
      return 'humidityDisplay.optimal';
    }
    if (humidity < 40) {
      return 'humidityDisplay.dry';
    }
    return 'humidityDisplay.humid';
  });
}
