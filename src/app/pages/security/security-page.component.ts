import { Component, signal } from '@angular/core';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { FooterComponent } from '@shared/components/footer/footer.component';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Komponent strony reprezentujący bezpieczeństwo domu (w rozwoju).
 */
@Component({
  selector: 'app-security',
  imports: [NavbarComponent, FooterComponent, SvgIconComponent, TranslateModule],
  standalone: true,
  templateUrl: './security-page.component.html',
  styles: ``,
})
export class SecurityPageComponent {
  /**
   * Sygnał tymczasowy sterujący pokazaniem komunikatu o tym ze strona jest w budowie
   *
   * @type {signal}
   */
  public readonly workInProgress = signal<boolean>(true);
}
