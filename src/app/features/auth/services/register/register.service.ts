import { Injectable , inject } from '@angular/core';
import {environment} from "@environments/environment";
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export interface RegisterRequest {
  email: string;
  userName: string;
  password: string;
}

export interface RegisterResponse {
  _id: string;
  email: string;
  userName: string;
}

export interface ApiError {
  error: string;
  details?: string[];
  value?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/user`;

  public register(data: RegisterRequest) {
    return this.http
      .post<RegisterResponse>(`${this.apiUrl}/create`, data)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 400) {
      const apiError = error.error as ApiError;
      return throwError(() => apiError);
    }
    if (error.status === 429) {
      return throwError(() => ({ error: 'Too many requests, try again later' }));
    }
    return throwError(() => ({ error: 'Server error, try again later' }));
  }
}
