import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LoginService } from './login.service';
import { LoginRequest, LoginResponse } from '@features/auth/models/auth.models';
import { environment } from '@environments/environment';

describe('LoginService', () => {
  let service: LoginService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/user`;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        LoginService,
      ],
    });

    service = TestBed.inject(LoginService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should send a POST request to auth endpoint and return LoginResponse', () => {
      const mockRequest: LoginRequest = { userName: 'testuser', password: 'password123' };
      const mockResponse: LoginResponse = { token: 'jwt-token-abc' };
      let responseData: LoginResponse | undefined;

      service.login(mockRequest).subscribe((res) => {
        responseData = res;
      });

      const req = httpMock.expectOne(`${apiUrl}/auth`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);

      req.flush(mockResponse);

      expect(responseData).toEqual(mockResponse);
    });

    it('should propagate error when login request fails', () => {
      let capturedError: unknown;

      service.login({ userName: 'bad', password: 'bad' }).subscribe({
        next: () => {},
        error: (err) => { capturedError = err; },
      });

      const req = httpMock.expectOne(`${apiUrl}/auth`);
      expect(req.request.method).toBe('POST');

      req.flush({ error: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      expect(capturedError).toBeDefined();
    });
  });

  describe('initUserFromToken', () => {
    it('should set userName to empty string when no token is present', () => {
      service.initUserFromToken();
      expect(service.userName()).toBe('');
    });

    it('should decode token from localStorage and set userName signal', () => {
      const fakeToken =
        'eyJhbGciOiJIUzI1NiJ9.' +
        btoa(JSON.stringify({ userName: 'localUser' })) +
        '.signature';
      localStorage.setItem('token', fakeToken);

      service.initUserFromToken();

      expect(service.userName()).toBe('localUser');
    });

    it('should decode token from sessionStorage and set userName signal', () => {
      const fakeToken =
        'eyJhbGciOiJIUzI1NiJ9.' +
        btoa(JSON.stringify({ userName: 'sessionUser' })) +
        '.signature';
      sessionStorage.setItem('token', fakeToken);

      service.initUserFromToken();

      expect(service.userName()).toBe('sessionUser');
    });

    it('should prefer localStorage token over sessionStorage token', () => {
      const localToken =
        'eyJhbGciOiJIUzI1NiJ9.' +
        btoa(JSON.stringify({ userName: 'localUser' })) +
        '.signature';
      const sessionToken =
        'eyJhbGciOiJIUzI1NiJ9.' +
        btoa(JSON.stringify({ userName: 'sessionUser' })) +
        '.signature';

      localStorage.setItem('token', localToken);
      sessionStorage.setItem('token', sessionToken);

      service.initUserFromToken();

      expect(service.userName()).toBe('localUser');
    });

    it('should set userName to empty string when token is malformed', () => {
      localStorage.setItem('token', 'this-is-not-a-valid-jwt');

      service.initUserFromToken();

      expect(service.userName()).toBe('');
    });
  });
});
