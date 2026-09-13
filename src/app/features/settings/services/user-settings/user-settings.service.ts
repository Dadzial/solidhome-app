import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '@environments/environment';
import { catchError, throwError } from 'rxjs';
import {ApiError} from '@core/models/api-error.model';

interface UpdateUserRequest {
  email?: string;
  userName?: string;
  currentPassword?: string;
  password?: string;
}

interface UpdateUserResponse {
  _id: string;
  userName: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/user`;

  public updateUser(data: UpdateUserRequest) {
    return this.http
      .post<UpdateUserResponse>(`${this.apiUrl}/update`, data)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 400 || error.status === 409) {
      return throwError(() => error.error as ApiError);
    }
    if (error.status === 401) {
      return throwError(() => ({ error: 'Invalid current password' }));
    }
    if (error.status === 429) {
      return throwError(() => ({ error: 'Too many requests, try again later' }));
    }
    return throwError(() => ({ error: 'Server error, try again later' }));
  }
}
