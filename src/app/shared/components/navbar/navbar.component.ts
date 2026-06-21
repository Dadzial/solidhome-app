import { Component , signal , inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { LogoutService } from '@core/services/logout/logout.service';
import { ClickOutsideDirective } from '@shared/directives/click-outside/click-outside.directive';
import { SettingsModalComponent } from '@features/settings/components/settings-modal/settings-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [TranslateModule, SvgIconComponent, RouterLink, RouterLinkActive, ClickOutsideDirective, SettingsModalComponent],
  templateUrl: './navbar.component.html',
  styles: ``,
})
export class NavbarComponent {
  private logoutService = inject(LogoutService);
  private router = inject(Router);
  public isMobileMenuOpen = signal(false);
  public isSettingsOpen = signal(false);

  public toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(val => !val);
  }

  public toggleSettings(): void {
    this.isSettingsOpen.update(val => !val);
    if (this.isSettingsOpen()) {
      this.isMobileMenuOpen.set(false);
    }
  }

  public logout(): void {
    this.logoutService.logout().subscribe({
      next: () => this.handleSuccessfulLogout(),
      error: (err) => {
        console.error('Error in logout:', err);
        this.handleSuccessfulLogout();
      }
    });
  }

  private handleSuccessfulLogout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }
}
