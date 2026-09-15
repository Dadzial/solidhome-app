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

  describe('when response status is 400 or 409', () => {
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

    it('should return backend error object on status 409', () => {
      const backendError: ApiError = { error: 'User already exists' };
      let capturedError: ApiError | undefined;

      httpClient.get('/api/test').subscribe({
        next: () => {},
        error: (err: ApiError) => {
          capturedError = err;
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(backendError, { status: 409, statusText: 'Conflict' });

      expect(capturedError).toEqual(backendError);
    });
  });

  describe('when response status is 401', () => {
    it('should return backend error message if provided', () => {
      let capturedError: ApiError | undefined;

      httpClient.get('/api/test').subscribe({
        next: () => {},
        error: (err: ApiError) => {
          capturedError = err;
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({ error: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

      expect(capturedError).toEqual({ error: 'Token expired' });
    });

    it('should return default unauthorized message if backend does not provide one', () => {
      let capturedError: ApiError | undefined;

      httpClient.get('/api/test').subscribe({
        next: () => {},
        error: (err: ApiError) => {
          capturedError = err;
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(capturedError).toEqual({ error: 'Invalid credentials or unauthorized' });
    });
  });

  describe('when response status is 429', () => {
    it('should return rate limit message', () => {
      let capturedError: ApiError | undefined;

      httpClient.get('/api/test').subscribe({
        next: () => {},
        error: (err: ApiError) => {
          capturedError = err;
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(null, { status: 429, statusText: 'Too Many Requests' });

      expect(capturedError).toEqual({ error: 'Too many requests, try again later' });
    });
  });

  describe('when response status is 500 or any other error', () => {
    it('should return backend error if present', () => {
      let capturedError: ApiError | undefined;

      httpClient.get('/api/test').subscribe({
        next: () => {},
        error: (err: ApiError) => {
          capturedError = err;
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({ error: 'Database connection failed' }, { status: 500, statusText: 'Internal Server Error' });

      expect(capturedError).toEqual({ error: 'Database connection failed' });
    });

    it('should return default server error message if no backend error is present', () => {
      let capturedError: ApiError | undefined;

      httpClient.get('/api/test').subscribe({
        next: () => {},
        error: (err: ApiError) => {
          capturedError = err;
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(capturedError).toEqual({ error: 'Server error, try again later' });
    });
  });
});
