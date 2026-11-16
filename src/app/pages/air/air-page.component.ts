import { Component } from '@angular/core';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { FooterComponent } from '@shared/components/footer/footer.component';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Komponent strony jakości powietrza.
 */
@Component({
  selector: 'app-air',
  imports: [NavbarComponent, FooterComponent, TranslateModule],
  standalone: true,
  templateUrl: './air-page.component.html',
  styles: ``,
})
export class AirPageComponent {}
