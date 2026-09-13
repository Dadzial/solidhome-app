import { Component, output, input, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { ClickOutsideDirective } from '@shared/directives/click-outside/click-outside.directive';
import { AccentColorService } from '@core/services/accent-color/accent-color.service';
import { UserSettingsService } from '@features/settings/services/user-settings/user-settings.service';
import { LoginService } from '@features/auth/services/login/login.service';
import {
  email,
  form,
  FormField,
  FormRoot,
  maxLength,
  minLength,
  pattern,
  required,
  submit,
} from '@angular/forms/signals';

interface ApiError {
  error?: string;
  details?: string[];
  value?: string;
}

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [TranslateModule, SvgIconComponent, ClickOutsideDirective, FormField, FormRoot],
  templateUrl: './settings-modal.component.html',
})
export class SettingsModalComponent {
  public accentColorService = inject(AccentColorService);
  private userSettingsService = inject(UserSettingsService);
  private loginService = inject(LoginService);

  public isOpen = input(false);
  public closeSettings = output<void>();
  public selectedColor = output();

  public isLoading = signal(false);
  public serverError = signal<string | null>(null);
  public showLocalErrors = signal(false);

  public expandedSection = signal<'username' | 'email' | 'password' | null>(null);

  public toggleSection(section: 'username' | 'email' | 'password') {
    this.expandedSection.update((current) => (current === section ? null : section));
  }

  public usernameModel = signal({ userName: '' });
  protected usernameForm = form(
    this.usernameModel,
    (s) => {
      required(s.userName, { message: 'authPagesErrors.userNameRequired' });
      minLength(s.userName, 3, { message: 'authPagesErrors.userNameMinLength' });
      maxLength(s.userName, 30, { message: 'authPagesErrors.userNameMaxLength' });
      pattern(s.userName, /^[a-zA-Z0-9]+$/, { message: 'authPagesErrors.userNamePattern' });
    },
    {
      submission: {
        action: async () => {
          this.isLoading.set(true);
          this.serverError.set(null);
          try {
            await new Promise<void>((resolve, reject) => {
              this.userSettingsService
                .updateUser({ userName: this.usernameModel().userName })
                .subscribe({
                  next: (res) => {
                    this.loginService.userName.set(res.userName);
                    this.usernameModel.set({ userName: '' });
                    resolve();
                  },
                  error: (err: ApiError) => reject(err),
                });
            });
          } catch (err) {
            const apiError = err as ApiError;
            this.triggerTemporaryErrors(apiError.details?.[0] ?? apiError.error);
          } finally {
            this.isLoading.set(false);
          }
        },
      },
    },
  );

  public emailModel = signal({ email: '' });
  protected emailForm = form(
    this.emailModel,
    (s) => {
      required(s.email, { message: 'authPagesErrors.emailRequired' });
      email(s.email, { message: 'authPagesErrors.emailInvalid' });
    },
    {
      submission: {
        action: async () => {
          this.isLoading.set(true);
          this.serverError.set(null);
          try {
            await new Promise<void>((resolve, reject) => {
              this.userSettingsService.updateUser({ email: this.emailModel().email }).subscribe({
                next: () => {
                  this.emailModel.set({ email: '' });
                  resolve();
                },
                error: (err: ApiError) => reject(err),
              });
            });
          } catch (err) {
            const apiError = err as ApiError;
            this.triggerTemporaryErrors(apiError.details?.[0] ?? apiError.error);
          } finally {
            this.isLoading.set(false);
          }
        },
      },
    },
  );

  public passwordModel = signal({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  protected passwordForm = form(
    this.passwordModel,
    (s) => {
      required(s.currentPassword, { message: 'authPagesErrors.currentPasswordRequired' });
      required(s.newPassword, { message: 'authPagesErrors.newPasswordRequired' });
      minLength(s.newPassword, 8, { message: 'authPagesErrors.passwordMinLength' });
      required(s.confirmPassword, { message: 'authPagesErrors.confirmPasswordRequired' });
    },
    {
      submission: {
        action: async () => {
          const { currentPassword, newPassword, confirmPassword } = this.passwordModel();
          if (newPassword !== confirmPassword) {
            this.triggerTemporaryErrors('authPagesErrors.passwordsMismatch');
            return;
          }
          this.isLoading.set(true);
          this.serverError.set(null);
          try {
            await new Promise<void>((resolve, reject) => {
              this.userSettingsService
                .updateUser({ currentPassword, password: newPassword })
                .subscribe({
                  next: () => {
                    this.passwordModel.set({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                    resolve();
                  },
                  error: (err: ApiError) => reject(err),
                });
            });
          } catch (err) {
            const apiError = err as ApiError;
            this.triggerTemporaryErrors(apiError.details?.[0] ?? apiError.error);
          } finally {
            this.isLoading.set(false);
          }
        },
      },
    },
  );

  public onSubmitUsername(event: Event): void {
    event.preventDefault();
    submit(this.usernameForm);
    if (this.usernameForm().invalid()) {
      this.triggerTemporaryErrors();
    }
  }

  public onSubmitEmail(event: Event): void {
    event.preventDefault();
    submit(this.emailForm);
    if (this.emailForm().invalid()) {
      this.triggerTemporaryErrors();
    }
  }

  public onSubmitPassword(event: Event): void {
    event.preventDefault();
    submit(this.passwordForm);
    if (this.passwordForm().invalid()) {
      this.triggerTemporaryErrors();
    }
  }

  private triggerTemporaryErrors(backendError: string | null = null): void {
    this.showLocalErrors.set(true);
    if (backendError) this.serverError.set(backendError);

    setTimeout(() => {
      this.showLocalErrors.set(false);
      this.serverError.set(null);

      this.usernameForm.userName().reset();
      this.emailForm.email().reset();
      this.passwordForm.currentPassword().reset();
      this.passwordForm.newPassword().reset();
      this.passwordForm.confirmPassword().reset();
    }, 3000);
  }
}
