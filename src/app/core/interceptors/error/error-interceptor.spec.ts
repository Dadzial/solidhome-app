import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './error-interceptor';
import { ApiError } from '@core/models/core.models';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => errorInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should pass through successful requests', () => {
    const mockData = { success: true };
    let responseData: unknown;

    httpClient.get('/api/test').subscribe((res) => {
      responseData = res;
    });

    const req = httpMock.expectOne('/api/test');
    req.flush(mockData);

    expect(responseData).toEqual(mockData);
  });

  describe('when response status is 400', () => {
    it('should return backend error object on status 400', () => {
      const backendError: ApiError = { error: 'Validation failed', details: ['Invalid email'] };
      let capturedError: ApiError | undefined;

      httpClient.get('/api/test').subscribe({
        next: () => {},
        error: (err: ApiError) => {
          capturedError = err;
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(backendError, { status: 400, statusText: 'Bad Request' });

      expect(capturedError).toEqual(backendError);
    });

    it('should fallback to default error translation key if status 400 error body is not an object', () => {
      let capturedError: ApiError | undefined;

      httpClient.get('/api/test').subscribe({
        next: () => {},
        error: (err: ApiError) => {
          capturedError = err;
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Bad request string error', { status: 400, statusText: 'Bad Request' });

      expect(capturedError).toEqual({ error: 'serverErrors.default' });
    });
  });

  describe('when response status is 409', () => {
    it('should return conflict error translation key on status 409', () => {
      let capturedError: ApiError | undefined;

      httpClient.get('/api/test').subscribe({
        next: () => {},
        error: (err: ApiError) => {
          capturedError = err;
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({ error: 'User already exists' }, { status: 409, statusText: 'Conflict' });

      expect(capturedError).toEqual({ error: 'serverErrors.conflict' });
    });
  });

  describe('when response status is 401', () => {
    it('should return unauthorized translation key when backend error message is provided', () => {
      let capturedError: ApiError | undefined;

      httpClient.get('/api/test').subscribe({
        next: () => {},
        error: (err: ApiError) => {
          capturedError = err;
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({ error: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

      expect(capturedError).toEqual({ error: 'serverErrors.unauthorized' });
    });

    it('should return unauthorized translation key if backend does not provide one', () => {
      let capturedError: ApiError | undefined;

      httpClient.get('/api/test').subscribe({
        next: () => {},
        error: (err: ApiError) => {
          capturedError = err;
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(capturedError).toEqual({ error: 'serverErrors.unauthorized' });
    });
  });

  describe('when response status is 429', () => {
    it('should return rate limit message translation key', () => {
      let capturedError: ApiError | undefined;

      httpClient.get('/api/test').subscribe({
        next: () => {},
        error: (err: ApiError) => {
          capturedError = err;
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(null, { status: 429, statusText: 'Too Many Requests' });

      expect(capturedError).toEqual({ error: 'serverErrors.tooManyRequests' });
    });
  });

  describe('when response status is 500 or any other error', () => {
    it('should return server error translation key when backend error is present', () => {
      let capturedError: ApiError | undefined;

      httpClient.get('/api/test').subscribe({
        next: () => {},
        error: (err: ApiError) => {
          capturedError = err;
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({ error: 'Database connection failed' }, { status: 500, statusText: 'Internal Server Error' });

      expect(capturedError).toEqual({ error: 'serverErrors.serverError' });
    });

    it('should return default server error translation key if no backend error is present', () => {
      let capturedError: ApiError | undefined;

      httpClient.get('/api/test').subscribe({
        next: () => {},
        error: (err: ApiError) => {
          capturedError = err;
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(capturedError).toEqual({ error: 'serverErrors.serverError' });
    });
  });
});
