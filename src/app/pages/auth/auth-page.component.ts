import { Component } from '@angular/core';
import { ThemeButtonComponent } from '@shared/components/theme-button/theme-button.component';
@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [ThemeButtonComponent],
  templateUrl: './auth-page.component.html',
  styles: ``,
})
export class AuthPageComponent {}
