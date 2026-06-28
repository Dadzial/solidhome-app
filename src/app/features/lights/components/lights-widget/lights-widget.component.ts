import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {SvgIconComponent} from 'angular-svg-icon';

@Component({
  selector: 'app-lights-widget',
  imports: [TranslatePipe,SvgIconComponent],
  templateUrl: './lights-widget.component.html',
  styles: ``,
})
export class LightsWidgetComponent {}
