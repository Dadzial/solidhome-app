import { Component ,output , inject, signal } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import {
  form,
  FormField,
  FormRoot,
  required,
  submit,
} from '@angular/forms/signals';
import {TranslateModule} from '@ngx-translate/core';
import {VerifyEmailService} from '@features/auth/services/verify/verify-email.service';

interface VerifyEmailCredentials {
  email: string;
}

interface ApiError {
  error: string;
  details?: string[];
  value?: string;
}

@Component({
  selector: 'app-verify-form',
  imports: [TranslateModule, SvgIconComponent,FormRoot, FormField],
  standalone: true,
  templateUrl: './verify-form.component.html',
  styles: ``,
})
export class VerifyFormComponent {
  public switchToLogin = output<void>();
  private verifyService = inject(VerifyEmailService);

  public isLoading = signal(false);
  public serverError = signal<string | null>(null);
  public showLocalErrors = signal(false);

  public verifyEmailModel = signal<VerifyEmailCredentials>({
    email: '',
  });

  protected verifyEmailForm = form(
    this.verifyEmailModel,
    (s) => {
      required(s.email, { message: 'authPagesErrors.emailRequired' });
    },
    {
      submission: {
        action: async () => {
          this.isLoading.set(true);
          this.serverError.set(null);
          try {
            await new Promise<void>((resolve, reject) => {
              this.verifyService.verifyEmail(this.verifyEmailModel()).subscribe({
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
    submit(this.verifyEmailForm);

    if (this.verifyEmailForm().invalid()) {
      this.triggerTemporaryErrors();
    }
  }

  private triggerTemporaryErrors(backendError: string | null = null): void {
    this.showLocalErrors.set(true);
    if (backendError) this.serverError.set(backendError);

    setTimeout(() => {
      this.showLocalErrors.set(false);
      this.serverError.set(null);

      this.verifyEmailForm.email().reset();
    }, 3000);
  }
}
