import { Component } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-outside-data',
  imports: [SvgIconComponent, TranslatePipe],
  standalone: true,
  templateUrl: './outside-data.component.html',
  styles: ``,
})
export class OutsideDataComponent {}
