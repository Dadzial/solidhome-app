import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { ConfirmPasswordRequest, ConfirmPasswordResponse } from '@features/auth/models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class ConfirmPasswordService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/user`;

  public confirmNewPassword(data: ConfirmPasswordRequest) {
    return this.http.post<ConfirmPasswordResponse>(`${this.apiUrl}/reset/password`, data);
  }
}
