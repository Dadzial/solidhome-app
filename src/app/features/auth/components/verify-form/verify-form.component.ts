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
import { VerifyEmailService } from '@features/auth/services/verify/verify-email.service';
import { VerifyEmailRequest } from '@features/auth/models/auth.models';
import { ApiError } from '@core/models/core.models';
/**
 * Komponent reprezentujący formularz weryfikacji adresu e-mail (odzyskiwanie hasła).
 *
 * Umożliwia użytkownikowi podanie adresu e-mail, na który zostanie wysłany
 * jednorazowy kod weryfikacyjny do zresetowania hasła. Po pomyślnym wysłaniu
 * przełącza widok na formularz potwierdzenia nowego hasła.
 *
 * ### Zasady działania:
 * - Zarządza stanem formularza przy użyciu Angular Signal Forms (`form`).
 * - Waliduje wymagane pole `email`.
 * - Wysyła żądanie weryfikacji e-mail przez `VerifyEmailService`.
 * - Po sukcesie emituje zdarzenie `switchToNewPassword`, by przejść do etapu ustawiania nowego hasła.
 * - Umożliwia powrót do logowania przez zdarzenie `switchToLogin`.
 * - Obsługuje błędy walidacji lokalnej oraz błędy z backendu (`ApiError`), wyświetlając je tymczasowo przez 3 sekundy.
 */
@Component({
  selector: 'app-verify-form',
  imports: [TranslateModule, SvgIconComponent, FormRoot, FormField],
  standalone: true,
  templateUrl: './verify-form.component.html',
  styles: ``,
})
export class VerifyFormComponent {
  /** Serwis obsługujący wysyłanie wiadomości weryfikacyjnej e-mail. */
  private verifyService = inject(VerifyEmailService);
  /** Zdarzenie wywoływane w celu powrotu do formularza logowania. */
  public switchToLogin = output<void>();
  /** Zdarzenie wywoływane po pomyślnym wysłaniu kodu — przełącza widok na formularz ustawiania nowego hasła. */
  public switchToNewPassword = output<void>();
  /**
   * Sygnał informujący o trwającym procesie wysyłania formularza i weryfikacji e-mail.
   * @type {signal}
   */
  public isLoading = signal(false);
  /**
   * Sygnał przechowujący komunikat o błędzie zwrócony z serwera (lub `null` przy braku błędu).
   * @type {signal}
   */
  public serverError = signal<string | null>(null);
  /**
   * Sygnał sterujący widocznością błędów walidacji (lokalnych i serwerowych) w szablonie.
   * @type {signal}
   */
  public showLocalErrors = signal(false);
  /**
   * Model danych formularza weryfikacji e-mail (adres e-mail użytkownika).
   * @type {signal}
   */
  public verifyEmailModel = signal<VerifyEmailRequest>({
    email: '',
  });
  /**
   * Reaktywny formularz weryfikacji e-mail oparty o Signal Forms z regułami walidacji i logiką wysyłania (submit action).
   */
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
            this.switchToNewPassword.emit();
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
  /**
   * Obsługuje zdarzenie zatwierdzenia formularza (submit).
   *
   * Zapobiega domyślnej akcji przeglądarki, wywołuje akcję `submit` na `verifyEmailForm`
   * i wyświetla błędy walidacji, jeśli formularz jest niepoprawny.
   *
   * @param {Event} event Zdarzenie submit z formularza DOM.
   * @returns {void}
   */
  public onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.verifyEmailForm);

    if (this.verifyEmailForm().invalid()) {
      this.triggerTemporaryErrors();
    }
  }
  /**
   * Aktywuje wyświetlanie błędów walidacji lub błędu serwera na określony czas (3 sekundy),
   * po czym resetuje stan błędów i czyści kontrolki formularza.
   *
   * @private
   * @param {string | null} [backendError=null] Opcjonalna treść błędu zwrócona z API.
   * @returns {void}
   */
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
