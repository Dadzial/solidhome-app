import { Component } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-air-charts',
  imports: [SvgIconComponent, TranslateModule],
  standalone: true,
  templateUrl: './air-charts.component.html',
  styles: ``,
})
export class AirChartsComponent {}
