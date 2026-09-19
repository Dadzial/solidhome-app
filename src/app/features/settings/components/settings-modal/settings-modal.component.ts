import { Component, output, input, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { ClickOutsideDirective } from '@shared/directives/click-outside/click-outside.directive';
import { AccentColorService } from '@core/services/accent-color/accent-color.service';
import { UserSettingsService } from '@features/settings/services/user-settings/user-settings.service';
import { LoginService } from '@features/auth/services/login/login.service';
import { ApiError } from '@core/models/core.models';
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
/**
 * Komponent reprezentujący modal ustawień użytkownika.
 *
 * Umożliwia zmianę nazwy użytkownika, adresu e-mail oraz hasła, a także
 * wybór koloru akcentu aplikacji i jednostek wyświetlanych danych.
 * Modal jest wyświetlany jako rozwijany panel w prawym górnym rogu interfejsu.
 *
 * ### Zasady działania:
 * - Widoczność modalu sterowana jest przez wejściowy sygnał `isOpen` oraz dyrektywę `appClickOutside`.
 * - Każda sekcja edycji (username / email / password) jest rozwijana niezależnie przez `expandedSection`.
 * - Formularz hasła dodatkowo weryfikuje zgodność nowego hasła z potwierdzeniem przed wysłaniem do API.
 * - Błędy walidacji lokalnej i błędy z backendu (`ApiError`) są wyświetlane tymczasowo przez 3 sekundy.
 * - Po sukcesie zmiany nazwy użytkownika lokalny sygnał `userName` w `LoginService` jest aktualizowany natychmiast.
 */
@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [TranslateModule, SvgIconComponent, ClickOutsideDirective, FormField, FormRoot],
  templateUrl: './settings-modal.component.html',
})
export class SettingsModalComponent {
  /** Serwis zarządzający kolorem akcentu aplikacji — dostępny publiczne dla szablonu. */
  public accentColorService = inject(AccentColorService);
  /** Serwis obsługujący aktualizację danych profilu użytkownika. */
  private userSettingsService = inject(UserSettingsService);
  /** Serwis logowania — używany do aktualizacji sygnału `userName` po zmianie nazwy użytkownika. */
  private loginService = inject(LoginService);
  /**
   * Wejściowy sygnał sterujący widocznością modalu ustawień.
   */
  public isOpen = input(false);
  /** Zdarzenie wywoływane w celu zamknięcia modalu ustawień. */
  public closeSettings = output<void>();
  /** Zdarzenie wywoływane po wybraniu nowego koloru akcentu. */
  public selectedColor = output();
  /**
   * Sygnał informujący o trwającym procesie zapisu danych do API.
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
   * Sygnał przechowujący identyfikator aktualnie rozwiniętej sekcji formularza
   * (`'username'`, `'email'`, `'password'`) lub `null` gdy żadna nie jest aktywna.
   * @type {signal}
   */
  public expandedSection = signal<'username' | 'email' | 'password' | null>(null);
  /**
   * Przełącza widoczność wybranej sekcji formularza.
   * Jeśli sekcja jest już otwarta, zamyka ją (toggle).
   *
   * @param {'username' | 'email' | 'password'} section Identyfikator sekcji do przełączenia.
   * @returns {void}
   */
  public toggleSection(section: 'username' | 'email' | 'password'): void {
    this.expandedSection.update((current) => (current === section ? null : section));
  }
  /**
   * Model danych formularza zmiany nazwy użytkownika.
   * @type {signal}
   */
  public usernameModel = signal({ userName: '' });
  /**
   * Reaktywny formularz zmiany nazwy użytkownika oparty o Signal Forms z walidacją i logiką zapisu.
   */
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
            const newUserName = this.usernameModel().userName;
            await firstValueFrom(this.userSettingsService.updateUser({ userName: newUserName }));
            this.loginService.userName.set(newUserName);
            this.usernameModel.set({ userName: '' });
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
   * Model danych formularza zmiany adresu e-mail.
   * @type {signal}
   */
  public emailModel = signal({ email: '' });
  /**
   * Reaktywny formularz zmiany adresu e-mail oparty o Signal Forms z walidacją formatu RFC i logiką zapisu.
   */
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
            await firstValueFrom(
              this.userSettingsService.updateUser({ email: this.emailModel().email }),
            );
            this.emailModel.set({ email: '' });
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
   * Model danych formularza zmiany hasła (aktualne hasło, nowe hasło, potwierdzenie nowego hasła).
   * @type {signal}
   */
  public passwordModel = signal({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  /**
   * Reaktywny formularz zmiany hasła oparty o Signal Forms.
   * Przed wysłaniem do API weryfikuje zgodność `newPassword` z `confirmPassword`.
   */
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
            await firstValueFrom(
              this.userSettingsService.updateUser({ currentPassword, password: newPassword }),
            );
            this.passwordModel.set({
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
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
  /**
   * Obsługuje zdarzenie zatwierdzenia formularza zmiany nazwy użytkownika.
   *
   * @param {Event} event Zdarzenie submit z formularza DOM.
   * @returns {void}
   */
  public onSubmitUsername(event: Event): void {
    event.preventDefault();
    submit(this.usernameForm);
    if (this.usernameForm().invalid()) {
      this.triggerTemporaryErrors();
    }
  }
  /**
   * Obsługuje zdarzenie zatwierdzenia formularza zmiany adresu e-mail.
   *
   * @param {Event} event Zdarzenie submit z formularza DOM.
   * @returns {void}
   */
  public onSubmitEmail(event: Event): void {
    event.preventDefault();
    submit(this.emailForm);
    if (this.emailForm().invalid()) {
      this.triggerTemporaryErrors();
    }
  }
  /**
   * Obsługuje zdarzenie zatwierdzenia formularza zmiany hasła.
   *
   * @param {Event} event Zdarzenie submit z formularza DOM.
   * @returns {void}
   */
  public onSubmitPassword(event: Event): void {
    event.preventDefault();
    submit(this.passwordForm);
    if (this.passwordForm().invalid()) {
      this.triggerTemporaryErrors();
    }
  }
  /**
   * Aktywuje wyświetlanie błędów walidacji lub błędu serwera na określony czas (3 sekundy),
   * po czym resetuje stan błędów i czyści wszystkie kontrolki formularzy.
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

      this.usernameForm.userName().reset();
      this.emailForm.email().reset();
      this.passwordForm.currentPassword().reset();
      this.passwordForm.newPassword().reset();
      this.passwordForm.confirmPassword().reset();
    }, 3000);
  }
}
