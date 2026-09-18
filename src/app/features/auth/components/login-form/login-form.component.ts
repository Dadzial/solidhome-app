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
import { Router } from '@angular/router';
import { LoginService } from '@features/auth/services/login/login.service';
import { LoadingService } from '@core/services/loading/loading.service';
import { LoginRequest } from '@features/auth/models/auth.models';
import { ApiError } from '@core/models/core.models';
/**
 * Komponent reprezentujący formularz logowania użytkownika.
 *
 * Umożliwia uwierzytelnienie za pomocą nazwy użytkownika i hasła, zapamiętanie sesji,
 * a także przełączanie na formularze rejestracji oraz odzyskiwania hasła.
 *
 * ### Zasady działania:
 * - Zarządza stanem formularza przy użyciu Angular Signal Forms (`form`).
 * - Waliduje wymagane pola (`userName`, `password`) po stronie klienta.
 * - Wysyła żądanie logowania przez `LoginService` i zapisuje token JWT w `localStorage` (opcja Remember Me) lub `sessionStorage`.
 * - Inicjalizuje dane użytkownika z tokenu i przekierowuje do strony głównej (`/home`) z animacją okna ładowania (`LoadingService`).
 * - Obsługuje błędy walidacji lokalnej oraz błędy z backendu (`ApiError`), wyświetlając je tymczasowo na 3 sekundy.
 */
@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [SvgIconComponent, TranslateModule, FormField, FormRoot],
  templateUrl: './login-form.component.html',
  styles: ``,
})
export class LoginFormComponent {
  /** Serwis zarządzający globalnym oknem ładowania aplikacji. */
  private loadingService = inject(LoadingService);
  /** Serwis obsługujący operacje logowania i dekodowania tokenu użytkownika. */
  private loginService = inject(LoginService);
  /** Serwis routingu do przekierowań między widokami. */
  private router = inject(Router);
  /** Zdarzenie wywoływane w celu przełączenia widoku na formularz rejestracji. */
  public switchToSignup = output<void>();
  /** Zdarzenie wywoływane w celu przełączenia widoku na formularz odzyskiwania hasła. */
  public switchToVerify = output<void>();
  /**
   * Sygnał informujący o trwającym procesie wysyłania formularza i logowania.
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
   * Model danych formularza logowania (nazwa użytkownika, hasło, opcja zapamiętania).
   * @type {signal}
   */
  public loginModel = signal<LoginRequest>({
    userName: '',
    password: '',
    rememberMe: false,
  });
  /**
   * Reaktywny formularz logowania oparty o Signal Forms z regułami walidacji i logiką wysyłania (submit action).
   */
  protected loginForm = form(
    this.loginModel,
    (s) => {
      required(s.userName, { message: 'authPagesErrors.userNameRequired' });
      required(s.password, { message: 'authPagesErrors.passwordRequired' });
    },
    {
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
        },
      },
    },
  );
  /**
   * Przełącza stan opcji "Zapamiętaj mnie" (Remember Me) w modelu formularza.
   *
   * @returns {void}
   */
  public toggleRememberMe(): void {
    this.loginModel.update((m) => ({ ...m, rememberMe: !m.rememberMe }));
  }
  /**
   * Obsługuje zdarzenie zatwierdzenia formularza (submit).
   *
   * Zapobiega domyślnej akcji przeglądarki, wywołuje akcję `submit (this.loginForm)`
   * i wyświetla błędy walidacji, jeśli formularz jest niepoprawny.
   *
   * @param {Event} event Zdarzenie submit z formularza DOM.
   * @returns {void}
   */
  public onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.loginForm);

    if (this.loginForm().invalid()) {
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

      this.loginForm.userName().reset();
      this.loginForm.password().reset();
    }, 3000);
  }
}
