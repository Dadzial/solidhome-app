import { Component, inject } from '@angular/core';
import { ThemeService } from '@core/services/theme/theme.service';
import { SvgIconComponent } from 'angular-svg-icon';

@Component({
  selector: 'app-theme-button',
  standalone: true,
  imports: [SvgIconComponent],
  templateUrl: './theme-button.component.html',
  styles: ``,
})
export class ThemeButtonComponent {
  public themeService = inject(ThemeService);
}
