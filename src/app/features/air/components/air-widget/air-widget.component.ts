import { Component } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Widżet prezentujący bieżące parametry powietrza (temperatura, wilgotność, ciśnienie z czujnika BMP280).
 */
@Component({
  selector: 'app-air-widget',
  imports: [SvgIconComponent, TranslateModule],
  standalone: true,
  templateUrl: './air-widget.component.html',
  styles: ``,
})
export class AirWidgetComponent {}
