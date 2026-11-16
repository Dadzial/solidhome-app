import { Component } from '@angular/core';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { FooterComponent } from '@shared/components/footer/footer.component';
import { TemperatureDisplayComponent } from '@features/air/components/temperature-display/temperature-display.component';
import { PressureDisplayComponent } from '@features/air/components/pressure-display/pressure-display.component';
import { HumidityDisplayComponent } from '@features/air/components/humidity-display/humidity-display.component';
import { OutsideDataComponent } from '@features/air/components/outside-data/outside-data.component';
import { AirChartsComponent } from '@features/air/components/air-charts/air-charts.component';
import { TranslateModule } from '@ngx-translate/core';

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
  ],
  standalone: true,
  templateUrl: './air-page.component.html',
  styles: ``,
})
export class AirPageComponent {}
