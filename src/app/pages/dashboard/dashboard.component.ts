import { Component } from '@angular/core';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { ThemeButtonComponent } from '@shared/components/theme-button/theme-button.component';
import { LangButtonComponent } from '@shared/components/lang-button/lang-button.component';

@Component({
  selector: 'app-dashboard',
  imports: [NavbarComponent, LangButtonComponent, ThemeButtonComponent],
  templateUrl: './dashboard.component.html',
  styles: ``,
})
export class DashboardComponent {}
