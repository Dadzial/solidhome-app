import { Component, computed, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { form, FormField } from '@angular/forms/signals';


interface LoginCredentials {
  username: string;
  password: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [SvgIconComponent, TranslateModule, FormField],
  templateUrl: './login-form.component.html',
  styles: ``,
})
export class LoginFormComponent {
  public switchToSignup = output<void>();
  public switchToVerify = output<void>();
  public isLoading = signal(false);

  public loginModel = signal<LoginCredentials>({
    username: '',
    password: '',
    rememberMe: false,
  });

  protected readonly loginForm = form(this.loginModel);

  public isFormInvalid = computed(() => {
    const data = this.loginModel();
    return !data.username || !data.password;
  });


  public toggleRememberMe(): void {
    this.loginForm.rememberMe().value.update((current) => !current);
  }

  public async onSubmit(event: Event) {
    event.preventDefault();

    if (this.isFormInvalid() || this.isLoading()) return;

    this.isLoading.set(true);

    const credentials = this.loginModel();

    try {
      console.log('send Data to api:', credentials);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
