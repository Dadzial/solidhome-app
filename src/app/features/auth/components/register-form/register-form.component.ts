import { Component, output, inject, signal } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
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
import { RegisterService } from '@features/auth/services/register/register.service';
import { RegisterRequest } from '@features/auth/models/auth.models';
import { ApiError } from '@core/models/core.models';
/**
 * Komponent reprezentujący formularz rejestracji nowego użytkownika.
 *
 * Umożliwia utworzenie konta za pomocą adresu e-mail, nazwy użytkownika i hasła,
 * a po pomyślnej rejestracji automatycznie przełącza widok na formularz logowania.
 *
 * ### Zasady działania:
 * - Zarządza stanem formularza przy użyciu Angular Signal Forms (`form`).
 * - Waliduje pole `email` (format RFC), `userName` (długość 3–30 znaków, tylko litery i cyfry) oraz `password` (min. 8 znaków).
 * - Wysyła żądanie rejestracji przez `RegisterService`.
 * - Po sukcesie emituje zdarzenie `switchToLogin`, by przekierować użytkownika do logowania.
 * - Obsługuje błędy walidacji lokalnej oraz błędy z backendu (`ApiError`), wyświetlając je tymczasowo przez 3 sekundy.
 */
@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [SvgIconComponent, TranslateModule, FormField, FormRoot],
  templateUrl: './register-form.component.html',
  styles: ``,
})
export class RegisterFormComponent {
  /** Serwis obsługujący operację rejestracji nowego konta użytkownika. */
  private registerService = inject(RegisterService);
  /** Zdarzenie wywoływane po pomyślnej rejestracji — przełącza widok na formularz logowania. */
  public switchToLogin = output<void>();
  /**
   * Sygnał informujący o trwającym procesie wysyłania formularza i rejestracji.
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
   * Model danych formularza rejestracji (adres e-mail, nazwa użytkownika, hasło).
   * @type {signal}
   */
  public registerModel = signal<RegisterRequest>({
    email: '',
    userName: '',
    password: '',
  });
  /**
   * Reaktywny formularz rejestracji oparty o Signal Forms z regułami walidacji i logiką wysyłania (submit action).
   */
  protected registerForm = form(
    this.registerModel,
    (s) => {
      required(s.email, { message: 'authPagesErrors.emailRequired' });
      email(s.email, { message: 'authPagesErrors.emailInvalid' });

      required(s.userName, { message: 'authPagesErrors.userNameRequired' });
      minLength(s.userName, 3, { message: 'authPagesErrors.userNameMinLength' });
      maxLength(s.userName, 30, { message: 'authPagesErrors.userNameMaxLength' });
      pattern(s.userName, /^[a-zA-Z0-9]+$/, { message: 'authPagesErrors.userNamePattern' });

      required(s.password, { message: 'authPagesErrors.passwordRequired' });
      minLength(s.password, 8, { message: 'authPagesErrors.passwordMinLength' });
    },
    {
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
        },
      },
    },
  );
  /**
   * Obsługuje zdarzenie zatwierdzenia formularza (submit).
   *
   * Zapobiega domyślnej akcji przeglądarki, wywołuje akcję `submit` na `registerForm`
   * i wyświetla błędy walidacji, jeśli formularz jest niepoprawny.
   *
   * @param {Event} event Zdarzenie submit z formularza DOM.
   * @returns {void}
   */
  public onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.registerForm);

    if (this.registerForm().invalid()) {
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

      this.registerForm.email().reset();
      this.registerForm.userName().reset();
      this.registerForm.password().reset();
    }, 3000);
  }
}
