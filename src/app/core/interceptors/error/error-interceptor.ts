import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '@core/models/core.models';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let normalizedError: ApiError;

      if (error.status === 400 || error.status === 409) {
        normalizedError = typeof error.error === 'object' ? error.error : { error: error.message };
      } else if (error.status === 401) {
        normalizedError = { error: error.error?.error || 'Invalid credentials or unauthorized' };
      } else if (error.status === 429) {
        normalizedError = { error: 'Too many requests, try again later' };
      } else {
        normalizedError = { error: error.error?.error || 'Server error, try again later' };
      }

      return throwError(() => normalizedError);
    }),
  );
};
