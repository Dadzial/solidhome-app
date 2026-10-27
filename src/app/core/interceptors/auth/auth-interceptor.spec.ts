import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { authInterceptor } from './auth-interceptor';
import { LoginService } from '@features/auth/services/login/login.service';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let router: Router;
  let loginService: LoginService;

  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        LoginService,
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    loginService = TestBed.inject(LoginService);

    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  describe('when user has NO token', () => {
    it('should NOT add Authorization header to the request', () => {
      httpClient.get('/api/data').subscribe();

      const req = httpMock.expectOne('/api/data');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('when user HAS token in localStorage', () => {
    it('should add Authorization header with Bearer token', () => {
      localStorage.setItem('token', 'local-jwt-token');

      httpClient.get('/api/data').subscribe();

      const req = httpMock.expectOne('/api/data');
      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe('Bearer local-jwt-token');
      req.flush({});
    });
  });

  describe('when user HAS token in sessionStorage', () => {
    it('should add Authorization header with Bearer token', () => {
      sessionStorage.setItem('token', 'session-jwt-token');

      httpClient.get('/api/data').subscribe();

      const req = httpMock.expectOne('/api/data');
      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe('Bearer session-jwt-token');
      req.flush({});
    });
  });

  describe('when user HAS token in both localStorage and sessionStorage', () => {
    it('should prioritize localStorage token', () => {
      localStorage.setItem('token', 'local-jwt-token');
      sessionStorage.setItem('token', 'session-jwt-token');

      httpClient.get('/api/data').subscribe();

      const req = httpMock.expectOne('/api/data');
      expect(req.request.headers.get('Authorization')).toBe('Bearer local-jwt-token');
      req.flush({});
    });
  });

  it('should preserve existing headers when adding Authorization', () => {
    localStorage.setItem('token', 'local-jwt-token');

    httpClient.get('/api/data', {
      headers: { 'Custom-Header': 'TestValue' },
    }).subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.get('Custom-Header')).toBe('TestValue');
    expect(req.request.headers.get('Authorization')).toBe('Bearer local-jwt-token');
    req.flush({});
  });

  describe('silent refresh on 401 error', () => {
    it('should refresh token and retry the original request when 401 occurs and refreshToken exists', () => {
      localStorage.setItem('token', 'expired-access-token');
      localStorage.setItem('refreshToken', 'valid-refresh-token');

      let responseData: any;
      httpClient.get('/api/protected-data').subscribe((data) => {
        responseData = data;
      });

      const initialReq = httpMock.expectOne('/api/protected-data');
      expect(initialReq.request.headers.get('Authorization')).toBe('Bearer expired-access-token');
      initialReq.flush({ error: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

      const refreshReq = httpMock.expectOne((req) => req.url.includes('/user/auth/refresh'));
      expect(refreshReq.request.method).toBe('POST');
      expect(refreshReq.request.body).toEqual({ refreshToken: 'valid-refresh-token' });
      refreshReq.flush({ token: 'new-access-token', refreshToken: 'valid-refresh-token' });

      const retriedReq = httpMock.expectOne('/api/protected-data');
      expect(retriedReq.request.headers.get('Authorization')).toBe('Bearer new-access-token');
      retriedReq.flush({ secret: 'success-data' });

      expect(responseData).toEqual({ secret: 'success-data' });
      expect(localStorage.getItem('token')).toBe('new-access-token');
    });

    it('should clear tokens and navigate to root when 401 occurs and NO refreshToken exists', () => {
      localStorage.setItem('token', 'expired-access-token');
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      let capturedError: any;
      httpClient.get('/api/protected-data').subscribe({
        next: () => {},
        error: (err) => { capturedError = err; },
      });

      const initialReq = httpMock.expectOne('/api/protected-data');
      initialReq.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(localStorage.getItem('token')).toBeNull();
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
      expect(capturedError).toBeDefined();
    });

    it('should NOT trigger refresh when 401 occurs on auth endpoint (/user/auth)', () => {
      let capturedError: any;
      httpClient.post('/api/user/auth', { userName: 'bad', password: 'bad' }).subscribe({
        next: () => {},
        error: (err) => { capturedError = err; },
      });

      const authReq = httpMock.expectOne('/api/user/auth');
      authReq.flush({ error: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      httpMock.expectNone((req) => req.url.includes('/user/auth/refresh'));
      expect(capturedError).toBeDefined();
    });

    it('should clear tokens and redirect to root when refresh token itself fails with 401', () => {
      localStorage.setItem('token', 'expired-access-token');
      localStorage.setItem('refreshToken', 'expired-refresh-token');
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      let capturedError: any;
      httpClient.get('/api/protected-data').subscribe({
        next: () => {},
        error: (err) => { capturedError = err; },
      });

      const initialReq = httpMock.expectOne('/api/protected-data');
      initialReq.flush({ error: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

      const refreshReq = httpMock.expectOne((req) => req.url.includes('/user/auth/refresh'));
      refreshReq.flush({ error: 'Refresh token expired' }, { status: 401, statusText: 'Unauthorized' });

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
      expect(capturedError).toBeDefined();
    });
  });
});
