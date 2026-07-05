import { Component, inject, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';
import {
  form,
  FormField,
  FormRoot,
  required,
  submit,
} from '@angular/forms/signals';
import {Router} from '@angular/router';
import { LoginService } from '@features/auth/services/login/login.service';
import { LoadingService } from '@core/services/loading/loading.service';

interface LoginCredentials {
  userName: string;
  password: string;
  rememberMe: boolean;
}

interface ApiError {
  error: string;
  details?: string[];
  value?: string;
}

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [SvgIconComponent, TranslateModule, FormField, FormRoot],
  templateUrl: './login-form.component.html',
  styles: ``,
})
export class LoginFormComponent {
  public switchToSignup = output<void>();
  public switchToVerify = output<void>();
  private loginService = inject(LoginService);
  private router = inject(Router);
  private loadingService = inject(LoadingService);

  public isLoading = signal(false);
  public serverError = signal<string | null>(null);
  public showLocalErrors = signal(false);

  public loginModel = signal<LoginCredentials>({
    userName: '',
    password: '',
    rememberMe: false,
  });

  protected loginForm = form(this.loginModel, (s) => {
    required(s.userName, { message: 'authPagesErrors.userNameRequired' });
    required(s.password, { message: 'authPagesErrors.passwordRequired' });
  }, {
    submission: {
      action: async () => {
        this.isLoading.set(true);
        this.serverError.set(null);
        try {
          await new Promise<void>((resolve, reject) => {
            const credentials = this.loginModel();
            this.loginService.login(credentials).subscribe({
              next: (response) => {
                if (credentials.rememberMe) {
                  localStorage.setItem('token', response.token);
                } else {
                  sessionStorage.setItem('token', response.token);
                }
                this.loginService.initUserFromToken();
                resolve();
              },
              error: (err: ApiError) => reject(err),
            });
          });

          this.loadingService.showLoadingWindow();

          setTimeout(() => {
            this.router.navigate(['home']);
            setTimeout(() => this.loadingService.hideLoadingWindow(), 300);
          }, 800);

        } catch (err) {
          const apiError = err as ApiError;
          this.triggerTemporaryErrors(apiError.details?.[0] ?? apiError.error);
        } finally {
          this.isLoading.set(false);
        }
      }
    }
  });

  public toggleRememberMe(): void {
    this.loginModel.update(m => ({ ...m, rememberMe: !m.rememberMe }));
  }

  public onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.loginForm);

    if (this.loginForm().invalid()) {
      this.triggerTemporaryErrors();
    }
  }

  private triggerTemporaryErrors(backendError: string | null = null): void {
    this.showLocalErrors.set(true);
    if (backendError) this.serverError.set(backendError);

    setTimeout(() => {
      this.showLocalErrors.set(false);
      this.serverError.set(null);

      this.loginForm.userName().reset();
      this.loginForm.password().reset();
    }, 3000);
  }
}
