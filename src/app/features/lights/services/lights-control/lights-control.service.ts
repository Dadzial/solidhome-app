import { Injectable , inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '@environments/environment';
import { catchError, throwError, Observable } from 'rxjs';

export interface LightItem {
  _id?: string;
  name: string;
  state: 0 | 1;
  updatedAt?: string;
}

interface ApiError {
  error?: string;
  message?: string;
  details?: string | string[];
}

@Injectable({
  providedIn: 'root',
})
export class LightsControlService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/lights`;

  public getStatus(): Observable<LightItem[]> {
    return this.http.get<LightItem[]>(`${this.apiUrl}/status/app`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  public updateStatus(name: string, state: boolean): Observable<LightItem> {
    const payload = {
      name: name,
      state: state ? 1 : 0,
    };

    return this.http.post<LightItem>(`${this.apiUrl}/update`, payload).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  private handleError(response: HttpErrorResponse) {
    const apiError: ApiError = response.error || {};

    if (response.status === 400) {
      return throwError(() => apiError);
    }
    if (response.status === 401) {
      return throwError(() => ({ message: 'Unauthorized', details: apiError.error || apiError.message } as ApiError));
    }
    if (response.status === 429) {
      return throwError(() => ({ message: 'Too many requests', details: 'Try again later' } as ApiError));
    }

    return throwError(() => ({
      message: apiError.message || 'Server error',
      error: apiError.error || 'Something went wrong'
    } as ApiError));
  }
}
