import { inject, Injectable , signal,} from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { environment } from '@environments/environment';
import { catchError, Observable, throwError ,of} from 'rxjs';


interface LoginRequest {
  userName: string;
  password: string;
}

interface LoginResponse {
  token: string;
  userId: string;
}

interface ApiError {
  error: string;
  details?: string[];
  value?: string;
}

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
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth`, data)
      .pipe(catchError(this.handleError));
  }

  public initUserFromToken(): void {
    const token = localStorage.getItem('token');
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

  private handleError(error: HttpErrorResponse) {
    if (error.status === 400) {
      return throwError(() => error.error as ApiError);
    }
    if (error.status === 401) {
      return throwError(() => ({ error: 'Invalid username or password' }));
    }
    if (error.status === 429) {
      return throwError(() => ({ error: 'Too many requests, try again later' }));
    }
    return throwError(() => ({ error: 'Server error, try again later' }));
  }
}
