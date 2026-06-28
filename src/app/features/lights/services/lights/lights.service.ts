import { Injectable , inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '@environments/environment';
import { catchError, throwError, Observable } from 'rxjs';

export const LIGHT_ID_MAP: Record<string, number> = {
  'living_room': 1,
  'kitchen': 2,
  'bedroom': 3,
  'bathroom': 4,
  'hallway': 5,
  'garage': 6,
};

interface ApiError {
  error?: string;
  message?: string;
  details?: string | string[];
}

@Injectable({
  providedIn: 'root',
})
export class LightsService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/lights`;

  public getStatus(): Observable<Record<number, number>> {
    return this.http.get<Record<number, number>>(`${this.apiUrl}/get-status`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  public updateStatus(lightIdStr: string, state: boolean): Observable<any> {
    const numericId = LIGHT_ID_MAP[lightIdStr];
    if (!numericId) {
      return throwError(() => ({ message: 'Unknown light ID', details: lightIdStr } as ApiError));
    }
    const payload = { [numericId.toString()]: state ? 1 : 0 };
    return this.http.post(`${this.apiUrl}/update-status`, payload).pipe(
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
