import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { environment } from '@environments/environment';
import { LoginRequest, LoginResponse } from '@features/auth/models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/user`;
  public readonly userName = signal<string>('');

  constructor() {
    this.initUserFromToken();
  }

  public login(data: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth`, data);
  }

  public initUserFromToken(): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<{ userName: string }>(token);
        this.userName.set(decoded.userName);
      } catch (error) {
        console.error('Error in decode token', error);
      }
    } else {
      this.userName.set('');
    }
  }
}
