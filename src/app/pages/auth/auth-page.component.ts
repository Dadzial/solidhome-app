import { Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeButtonComponent } from '@shared/components/theme-button/theme-button.component';
import { LangButtonComponent } from '@shared/components/lang-button/lang-button.component';
import { LoginFormComponent } from '@features/auth/components/login-form/login-form.component';
import { RegisterFormComponent } from '@features/auth/components/register-form/register-form.component';
import { VerifyFormComponent } from '@features/auth/components/verify-form/verify-form.component';
import { RestoreFormComponent } from '@features/auth/components/restore-form/restore-form.component';
/**
 * Komponent strony autoryzacji — główny kontener dla wszystkich formularzy uwierzytelniania.
 *
 * Wyświetla dwukolumnowy layout: lewa kolumna z logo i opisem aplikacji (widoczna tylko na desktop),
 * prawa kolumna z aktywnym formularzem sterowanym sygnałem `authMode`.
 *
 * ### Zasady działania:
 * - Renderuje jeden z czterech formularzy w zależności od aktualnej wartości `authMode`:
 *   `'login'` → `LoginFormComponent`,
 *   `'signUp'` → `RegisterFormComponent`,
 *   `'verify'` → `VerifyFormComponent`,
 *   `'restore'` → `RestoreFormComponent`.
 * - Przełączanie między formularzami odbywa się przez zdarzenia wyjściowe poszczególnych komponentów
 *   (np. `switchToSignup`, `switchToVerify`, `switchToLogin`, `switchToNewPassword`).
 * - Domyślnym trybem po wejściu na stronę jest formularz logowania (`'login'`).
 */
@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [
    ThemeButtonComponent,
    LangButtonComponent,
    LoginFormComponent,
    TranslateModule,
    RegisterFormComponent,
    VerifyFormComponent,
    RestoreFormComponent,
  ],
  templateUrl: './auth-page.component.html',
  styles: ``,
})
export class AuthPageComponent {
  /**
   * Sygnał sterujący aktywnym formularzem autoryzacji wyświetlanym w prawej kolumnie.
   *
   * Możliwe wartości:
   * - `'login'` — formularz logowania (domyślny)
   * - `'signUp'` — formularz rejestracji nowego konta
   * - `'verify'` — formularz wysyłania kodu weryfikacyjnego na e-mail
   * - `'restore'` — formularz ustawiania nowego hasła za pomocą kodu weryfikacyjnego
   *
   * @type {signal}
   */
  public authMode = signal<'login' | 'signUp' | 'verify' | 'restore'>('login');
}
