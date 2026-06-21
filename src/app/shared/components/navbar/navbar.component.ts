import { Component , signal , inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [TranslateModule, SvgIconComponent],
  templateUrl: './navbar.component.html',
  styles: ``,
})
export class NavbarComponent {

}
