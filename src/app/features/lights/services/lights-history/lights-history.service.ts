import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '@environments/environment';
import { catchError, throwError, Observable } from 'rxjs';

export interface LightHistoryItem{
  _id: string;
  name: string;
  state: 0 | 1;
  createdAt: string;
  userId?: {
    _id: string;
    userName: string;
    email: string;
  } | null;
}

export interface ResetHistoryResponse {
  message: string;
  deletedCount?: number;
}

interface ApiError {
  error?: string;
  message?: string;
  details?: string | string[];
}

@Injectable({
  providedIn: 'root',
})
export class LightsHistoryService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/lights`;

  public getHistory(limit?: number): Observable<LightHistoryItem[]> {
    const options = limit ? { params: { limit: limit.toString() } } : {};
    return this.http
      .get<LightHistoryItem[]>(`${this.apiUrl}/history`, options)
      .pipe(catchError(this.handleError.bind(this)));
  }

  public resetHistory(): Observable<ResetHistoryResponse> {
    return this.http
      .delete<ResetHistoryResponse>(`${this.apiUrl}/history/reset`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  public deleteHistory(): Observable<ResetHistoryResponse> {
    return this.resetHistory();
  }

  private handleError(response: HttpErrorResponse) {
    const apiError: ApiError = response.error || {};

    if (response.status === 400) {
      return throwError(() => apiError);
    }
    if (response.status === 401) {
      return throwError(
        () =>
          ({ message: 'Unauthorized', details: apiError.error || apiError.message }) as ApiError,
      );
    }
    if (response.status === 429) {
      return throwError(
        () => ({ message: 'Too many requests', details: 'Try again later' }) as ApiError,
      );
    }

    return throwError(
      () =>
        ({
          message: apiError.message || 'Server error',
          error: apiError.error || 'Something went wrong',
        }) as ApiError,
    );
  }
}
