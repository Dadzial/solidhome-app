import { Component } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-outside-data',
  imports: [SvgIconComponent, TranslateModule],
  standalone: true,
  templateUrl: './outside-data.component.html',
  styles: ``,
})
export class OutsideDataComponent {}
