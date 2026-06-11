import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '@environments/environment';
import { catchError, throwError } from 'rxjs';

interface VerifyEmailRequest {
  email: string;
}

interface VerifyEmailResponse {
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
export class VerifyEmailService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/user`;

  public verifyEmail(data: VerifyEmailRequest) {
    return this.http
      .post<VerifyEmailResponse>(`${this.apiUrl}/reset/code`, data)
      .pipe(catchError(this.handleError));
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
