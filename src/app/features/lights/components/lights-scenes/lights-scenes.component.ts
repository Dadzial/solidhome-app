import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';

@Component({
  selector: 'app-lights-scenes',
  imports: [SvgIconComponent,TranslateModule],
  standalone: true,
  templateUrl: './lights-scenes.component.html',
  styles: ``,
})
export class LightsScenesComponent {}
