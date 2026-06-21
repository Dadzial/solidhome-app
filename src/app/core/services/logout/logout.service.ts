import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '@environments/environment';
import { catchError, throwError } from 'rxjs';

interface LogoutRequest {
  userId: string;
}

interface LoginResponse {
  message: string;
}

interface ApiError {
  error: string;
  details?: string[];
  value?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LogoutService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/user`;

  public logout(data: LogoutRequest) {
    return this.http
      .delete<LoginResponse>(`${this.apiUrl}/logout/${data.userId}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 400 || error.status === 401 || error.status === 403) {
      const apiError = error.error as ApiError;
      return throwError(() => apiError);
    }
    if (error.status === 429) {
      return throwError(() => ({ error: 'Too many requests, try again later' }));
    }
    return throwError(() => ({ error: 'Server error, try again later' }));
  }
}
