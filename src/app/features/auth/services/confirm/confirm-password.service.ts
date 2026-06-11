import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '@environments/environment';
import { catchError, throwError } from 'rxjs';

interface ConfirmPasswordRequest {
  message: string;
  password: string;
}

interface VerifyEmailResponse {
  newPassword: string;
}

interface ApiError {
  error: string;
  details?: string[];
  value?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmPasswordService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/user`;

  public confirmNewPassword(data: ConfirmPasswordRequest) {
    return this.http
      .post<VerifyEmailResponse>(`${this.apiUrl}/reset/password`, data)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 400) {
      return throwError(() => error.error as ApiError);
    }
    if (error.status === 401) {
      return throwError(() => ({ error: 'Invalid password' }));
    }
    if (error.status === 429) {
      return throwError(() => ({ error: 'Too many requests, try again later' }));
    }
    return throwError(() => ({ error: 'Server error, try again later' }));
  }
}
