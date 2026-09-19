import { Component, signal, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { LogoutService } from '@core/services/logout/logout.service';
import { ClickOutsideDirective } from '@shared/directives/click-outside/click-outside.directive';
import { SettingsModalComponent } from '@features/settings/components/settings-modal/settings-modal.component';
/**
 * Komponent głównego paska nawigacyjnego (Navbar) aplikacji.
 *
 * Wyświetla logo aplikacji, menu odnośników nawigacyjnych dla widoku desktopowego oraz mobilnego,
 * a także przyciski wywołujące modal ustawień oraz procedurę wylogowania użytkownika.
 *
 * ### Zasady działania:
 * - Obsługuje responsywne menu mobilne przełączane sygnałem `isMobileMenuOpen`.
 * - Obsługuje otwieranie/zamykanie modalu ustawień (`SettingsModalComponent`) sygnałem `isSettingsOpen`.
 * - Otwarcie menu mobilnego automatycznie zamyka modal ustawień (i odwrotnie).
 * - Dyrektywa `appClickOutside` zamyka menu mobilne po kliknięciu poza jego obszarem.
 * - Procedura `logout` wywołuje `LogoutService.logout() `, czyści tokeny autoryzacyjne w `localStorage` i `sessionStorage` oraz nawiguje do `/`.
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    TranslateModule,
    SvgIconComponent,
    RouterLink,
    RouterLinkActive,
    ClickOutsideDirective,
    SettingsModalComponent,
  ],
  templateUrl: './navbar.component.html',
  styles: ``,
})
export class NavbarComponent {
  /** Serwis obsługujący operację wylogowania użytkownika. */
  private logoutService = inject(LogoutService);
  /** Router Angulara do przekierowywania po wylogowaniu. */
  private router = inject(Router);
  /**
   * Sygnał określający stan otwarcia menu mobilnego.
   * @type {signal}
   */
  public isMobileMenuOpen = signal(false);
  /**
   * Sygnał określający stan otwarcia modalu ustawień.
   * @type {signal}
   */
  public isSettingsOpen = signal(false);
  /**
   * Przełącza stan widoczności menu mobilnego.
   * W przypadku otwarcia zamyka modal ustawień.
   *
   * @returns {void}
   */
  public toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((val) => !val);
    if (this.isMobileMenuOpen()) {
      this.isSettingsOpen.set(false);
    }
  }
  /**
   * Przełącza stan widoczności modalu ustawień.
   * W przypadku otwarcia zamyka menu mobilne.
   *
   * @returns {void}
   */
  public toggleSettings(): void {
    this.isSettingsOpen.update((val) => !val);
    if (this.isSettingsOpen()) {
      this.isMobileMenuOpen.set(false);
    }
  }
  /**
   * Inicjuje proces wylogowania użytkownika z systemu przez API.
   * Niezależnie od wyniku zapytania czyści pamięć podręczną i przekierowuje do strony logowania.
   *
   * @returns {void}
   */
  public logout(): void {
    this.logoutService.logout().subscribe({
      next: () => this.handleSuccessfulLogout(),
      error: (err) => {
        console.error('Error in logout:', err);
        this.handleSuccessfulLogout();
      },
    });
  }
  /**
   * Czyści tokeny autoryzacyjne i przekierowuje użytkownika do widoku autoryzacji (`/`).
   *
   * @private
   * @returns {void}
   */
  private handleSuccessfulLogout(): void {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    this.router.navigate(['/']);
  }
}
