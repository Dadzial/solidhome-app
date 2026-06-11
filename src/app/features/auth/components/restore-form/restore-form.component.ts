import { Component, output, inject, signal } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import {
  form,
  FormField,
  FormRoot,
  required,
  submit,
} from '@angular/forms/signals';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmPasswordService } from '@features/auth/services/confirm/confirm-password.service';

interface RestoreCredentials {
  code: string;
  password: string;
}

interface ApiError {
  error: string;
  details?: string[];
  value?: string;
}

@Component({
  selector: 'app-restore-form',
  imports: [SvgIconComponent, TranslateModule, FormRoot, FormField],
  standalone: true,
  templateUrl: './restore-form.component.html',
  styles: ``,
})
export class RestoreFormComponent {
  public switchToLogin = output<void>();
  private confirmPasswordService = inject(ConfirmPasswordService);

  public isLoading = signal(false);
  public serverError = signal<string | null>(null);
  public showLocalErrors = signal(false);

  public restoreModel = signal<RestoreCredentials>({
    code: '',
    password: '',
  });

  protected restoreForm = form(
    this.restoreModel,
    (s) => {
      required(s.code, { message: 'authPagesErrors.codeRequired' });
      required(s.password, { message: 'authPagesErrors.passwordRequired' });
    },
    {
      submission: {
        action: async () => {
          this.isLoading.set(true);
          this.serverError.set(null);
          try {
            await new Promise<void>((resolve, reject) => {
              this.confirmPasswordService
                .confirmNewPassword(this.restoreModel())
                .subscribe({
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
        },
      },
    },
  );

  public onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.restoreForm);

    if (this.restoreForm().invalid()) {
      this.triggerTemporaryErrors();
    }
  }

  private triggerTemporaryErrors(backendError: string | null = null): void {
    this.showLocalErrors.set(true);
    if (backendError) this.serverError.set(backendError);

    setTimeout(() => {
      this.showLocalErrors.set(false);
      this.serverError.set(null);

      this.restoreForm.code().reset();
      this.restoreForm.password().reset();
    }, 3000);
  }
}
