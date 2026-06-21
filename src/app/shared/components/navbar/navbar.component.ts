import { Component , signal , inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { LogoutService } from '@core/services/logout/logout.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [TranslateModule, SvgIconComponent, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styles: ``,
})
export class NavbarComponent {
  private logoutService = inject(LogoutService);
  private router = inject(Router);

  public logout(): void {
    const userId = localStorage.getItem('userId');

    if (userId) {
      this.logoutService.logout({ userId }).subscribe({
        next: () => this.handleSuccessfulLogout(),
        error: (err) => {
          console.error('Error in logout:', err);
          this.handleSuccessfulLogout();
        }
      });
    } else {
      this.handleSuccessfulLogout();
    }
  }

  private handleSuccessfulLogout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    this.router.navigate(['/']);
  }
}
