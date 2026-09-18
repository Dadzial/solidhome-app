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
import { ConfirmPasswordRequest } from '@features/auth/models/auth.models';
import { ApiError } from '@core/models/core.models';
/**
 * Komponent reprezentujący formularz potwierdzenia resetu hasła.
 *
 * Umożliwia użytkownikowi ustawienie nowego hasła poprzez podanie jednorazowego kodu
 * weryfikacyjnego (otrzymanego e-mailem) oraz nowego hasła. Po sukcesie przełącza widok
 * na formularz logowania.
 *
 * ### Zasady działania:
 * - Zarządza stanem formularza przy użyciu Angular Signal Forms (`form`).
 * - Waliduje wymagane pola: `code` (kod weryfikacyjny) i `password` (nowe hasło).
 * - Wysyła żądanie potwierdzenia zmiany hasła przez `ConfirmPasswordService`.
 * - Po sukcesie emituje zdarzenie `switchToLogin`, by przekierować użytkownika do logowania.
 * - Obsługuje błędy walidacji lokalnej oraz błędy z backendu (`ApiError`), wyświetlając je tymczasowo przez 3 sekundy.
 */
@Component({
  selector: 'app-restore-form',
  imports: [SvgIconComponent, TranslateModule, FormRoot, FormField],
  standalone: true,
  templateUrl: './restore-form.component.html',
  styles: ``,
})
export class RestoreFormComponent {
  /** Serwis obsługujący potwierdzenie resetu hasła użytkownika. */
  private confirmPasswordService = inject(ConfirmPasswordService);
  /** Zdarzenie wywoływane po pomyślnej zmianie hasła — przełącza widok na formularz logowania. */
  public switchToLogin = output<void>();
  /**
   * Sygnał informujący o trwającym procesie wysyłania formularza i zmiany hasła.
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
   * Model danych formularza resetu hasła (jednorazowy kod weryfikacyjny, nowe hasło).
   * @type {signal}
   */
  public restoreModel = signal<ConfirmPasswordRequest>({
    code: '',
    password: '',
  });
  /**
   * Reaktywny formularz resetu hasła oparty o Signal Forms z regułami walidacji i logiką wysyłania (submit action).
   */
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
  /**
   * Obsługuje zdarzenie zatwierdzenia formularza (submit).
   *
   * Zapobiega domyślnej akcji przeglądarki, wywołuje akcję `submit` na `restoreForm`
   * i wyświetla błędy walidacji, jeśli formularz jest niepoprawny.
   *
   * @param {Event} event Zdarzenie submit z formularza DOM.
   * @returns {void}
   */
  public onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.restoreForm);

    if (this.restoreForm().invalid()) {
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

      this.restoreForm.code().reset();
      this.restoreForm.password().reset();
    }, 3000);
  }
}
