import { Component, OnInit, inject } from '@angular/core';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { FooterComponent } from '@shared/components/footer/footer.component';
import { TemperatureDisplayComponent } from '@features/air/components/temperature-display/temperature-display.component';
import { PressureDisplayComponent } from '@features/air/components/pressure-display/pressure-display.component';
import { HumidityDisplayComponent } from '@features/air/components/humidity-display/humidity-display.component';
import { OutsideDataComponent } from '@features/air/components/outside-data/outside-data.component';
import { AirChartsComponent } from '@features/air/components/air-charts/air-charts.component';
import { AirDataReadService } from '@features/air/services/air-data-read/air-data-read.service';
import { TranslateModule } from '@ngx-translate/core';
import { ErrorOverlayComponent } from '@shared/components/error-overlay/error-overlay.component';

/**
 * Komponent strony jakości powietrza.
 */
@Component({
  selector: 'app-air',
  imports: [
    NavbarComponent,
    FooterComponent,
    TranslateModule,
    TemperatureDisplayComponent,
    PressureDisplayComponent,
    HumidityDisplayComponent,
    OutsideDataComponent,
    AirChartsComponent,
    ErrorOverlayComponent,
  ],
  standalone: true,
  templateUrl: './air-page.component.html',
  styles: ``,
})
export class AirPageComponent implements OnInit {
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
   * Ponawia próbę pobrania bieżących danych jakości powietrza po wystąpieniu błędu.
   *
   * @returns {void}
   */
  public onRetry(): void {
    this.airDataService.loadCurrentAir();
  }
}
