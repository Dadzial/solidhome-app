import { Component } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-humidity-display',
  imports: [SvgIconComponent, TranslateModule],
  standalone: true,
  templateUrl: './humidity-display.component.html',
  styles: ``,
})
export class HumidityDisplayComponent {}
