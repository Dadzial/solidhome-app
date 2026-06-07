import { Component, output, inject, signal } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { email, form, FormField, FormRoot, maxLength, minLength, pattern, required, submit,} from '@angular/forms/signals';
import { RegisterService } from '@features/auth/services/register/register.service';

interface RegisterCredentials {
  email: string;
  userName: string;
  password: string;
}

interface ApiError {
  error: string;
  details?: string[];
  value?: string;
}

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [SvgIconComponent, TranslateModule, FormField, FormRoot],
  templateUrl: './register-form.component.html',
  styles: ``,
})
export class RegisterFormComponent {
  public switchToLogin = output<void>();
  private registerService = inject(RegisterService);

  public isLoading = signal(false);
  public serverError = signal<string | null>(null);
  public showLocalErrors = signal(false);

  public registerModel = signal<RegisterCredentials>({
    email: '',
    userName: '',
    password: '',
  });

  protected registerForm = form(this.registerModel, (s) => {

    required(s.email, { message: 'authPagesErrors.emailRequired' });
    email(s.email, { message: 'authPagesErrors.emailInvalid' });

    required(s.userName, { message: 'authPagesErrors.userNameRequired' });
    minLength(s.userName, 3, { message: 'authPagesErrors.userNameMinLength' });
    maxLength(s.userName, 30, { message: 'authPagesErrors.userNameMaxLength' });
    pattern(s.userName, /^[a-zA-Z0-9]+$/, { message: 'authPagesErrors.userNamePattern' });

    required(s.password, { message: 'authPagesErrors.passwordRequired' });
    minLength(s.password, 8, { message: 'authPagesErrors.passwordMinLength' });
  }, {
    submission: {
      action: async () => {
        this.isLoading.set(true);
        this.serverError.set(null);
        try {
          await new Promise<void>((resolve, reject) => {
            this.registerService.register(this.registerModel()).subscribe({
              next: () => resolve(),
              error: (err: ApiError) => reject(err),
            });
          });
          this.switchToLogin.emit();
        } catch (err) {
          const apiError = err as ApiError;
          this.triggerTemporaryErrors(apiError.details?.[0] ?? apiError.error);
        } finally {
          this.isLoading.set(false);
        }
      }
    }
  });

  public onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.registerForm);

    if (this.registerForm().invalid()) {
      this.triggerTemporaryErrors();
    }
  }

  private triggerTemporaryErrors(backendError: string | null = null): void {

    this.showLocalErrors.set(true);
    if (backendError) this.serverError.set(backendError);

    setTimeout(() => {
      this.showLocalErrors.set(false);
      this.serverError.set(null);

      this.registerForm.email().reset();
      this.registerForm.userName().reset();
      this.registerForm.password().reset();
    }, 2000);
  }
}
