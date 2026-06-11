import { Component, output, inject, signal } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import {
  form,
  FormField,
  FormRoot,
  required,
  submit } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';

interface NewPasswordCredentials {
  code : string;
  newPassword : string;
}

interface ApiError {
  error: string;
  details?: string[];
  value?: string;
}

@Component({
  selector: 'app-restore-form',
  imports: [SvgIconComponent, TranslatePipe],
  standalone: true,
  templateUrl: './restore-form.component.html',
  styles: ``,
})
export class RestoreFormComponent {
  public switchToLogin = output<void>();
}
