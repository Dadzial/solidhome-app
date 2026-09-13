import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { RegisterRequest, RegisterResponse } from '@features/auth/models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/user`;

  public register(data: RegisterRequest) {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/create`, data);
  }
}
