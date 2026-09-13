import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { VerifyEmailRequest, VerifyEmailResponse } from '@features/auth/models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class VerifyEmailService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/user`;

  public verifyEmail(data: VerifyEmailRequest) {
    return this.http.post<VerifyEmailResponse>(`${this.apiUrl}/reset/code`, data);
  }
}
