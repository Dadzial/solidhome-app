import { Component, input } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-air-widget',
  imports: [SvgIconComponent, TranslateModule],
  standalone: true,
  templateUrl: './air-widget.component.html',
  styles: ``,
})
export class AirWidgetComponent {
  /**
   * Wariant wyświetlania widgetu:
   * - 'compact': zwięzły widok dla pulpitu głównego (Home)
   * - 'expanded': pełnowymiarowy widok ze szczegółami dla dedykowanej strony Powietrze (Air)
   */
  public variant = input<'compact' | 'expanded'>('compact');
}
