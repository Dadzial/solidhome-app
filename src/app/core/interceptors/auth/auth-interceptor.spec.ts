import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);

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
});
