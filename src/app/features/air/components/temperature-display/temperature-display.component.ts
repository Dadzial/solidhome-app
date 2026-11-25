import { Component, inject, computed } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { AirDataReadService } from '@features/air/services/air-data-read/air-data-read.service';

@Component({
  selector: 'app-temperature-display',
  imports: [SvgIconComponent, TranslateModule],
  standalone: true,
  templateUrl: './temperature-display.component.html',
  styles: ``,
})
export class TemperatureDisplayComponent {
  /** Inject AirDataReadService do pobierania danych o jakości powietrza. */
  public readonly airDataService = inject(AirDataReadService);

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
      return 'temperatureDisplay.comfortable';
    }
    if (temp >= 20 && temp <= 24) {
      return 'temperatureDisplay.comfortable';
    }
    if ((temp >= 18 && temp < 20) || (temp > 24 && temp <= 26)) {
      return 'temperatureDisplay.neutral';
    }
    return 'temperatureDisplay.notComfortable';
  });
}
