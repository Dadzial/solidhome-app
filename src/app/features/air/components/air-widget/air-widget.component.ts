import { Component } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-air-widget',
  imports: [SvgIconComponent, TranslateModule],
  standalone: true,
  templateUrl: './air-widget.component.html',
  styles: ``,
})
export class AirWidgetComponent {}
