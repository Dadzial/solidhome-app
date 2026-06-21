import { Component , inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';

@Component({
  selector: 'app-navbar',
  imports: [TranslateModule, SvgIconComponent],
  templateUrl: './navbar.component.html',
  styles: ``,
})
export class NavbarComponent {}
