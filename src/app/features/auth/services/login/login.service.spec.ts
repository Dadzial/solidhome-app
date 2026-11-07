import { TestBed } from '@angular/core/testing';
import { LoginService } from './login.service';
import { ApiService } from '@core/services/api/api.service';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
} from '@features/auth/models/auth.models';
import { of, throwError } from 'rxjs';

describe('LoginService', () => {
  let service: LoginService;
  let apiServiceMock: { post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    apiServiceMock = {
      post: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        LoginService,
        { provide: ApiService, useValue: apiServiceMock },
      ],
    });

    service = TestBed.inject(LoginService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should call api.post with "user/auth" and credentials and return LoginResponse', () => {
      const mockRequest: LoginRequest = { userName: 'testuser', password: 'password123' };
      const mockResponse: LoginResponse = { token: 'jwt-token-abc' };
      apiServiceMock.post.mockReturnValue(of(mockResponse));

      let responseData: LoginResponse | undefined;
      service.login(mockRequest).subscribe((res) => {
        responseData = res;
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('user/auth', mockRequest);
      expect(responseData).toEqual(mockResponse);
    });

    it('should propagate error when login request fails', () => {
      const mockError = new Error('Invalid credentials');
      apiServiceMock.post.mockReturnValue(throwError(() => mockError));

      let capturedError: unknown;
      service.login({ userName: 'bad', password: 'bad' }).subscribe({
        next: () => {},
        error: (err) => {
          capturedError = err;
        },
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('user/auth', { userName: 'bad', password: 'bad' });
      expect(capturedError).toBe(mockError);
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

  describe('token helpers', () => {
    it('should return access token via getAccessToken from localStorage or sessionStorage', () => {
      expect(service.getAccessToken()).toBeNull();

      sessionStorage.setItem('token', 'sess-token');
      expect(service.getAccessToken()).toBe('sess-token');

      localStorage.setItem('token', 'local-token');
      expect(service.getAccessToken()).toBe('local-token');
    });

    it('should return refresh token via getRefreshToken from localStorage or sessionStorage', () => {
      expect(service.getRefreshToken()).toBeNull();

      sessionStorage.setItem('refreshToken', 'sess-refresh');
      expect(service.getRefreshToken()).toBe('sess-refresh');

      localStorage.setItem('refreshToken', 'local-refresh');
      expect(service.getRefreshToken()).toBe('local-refresh');
    });

    it('should save tokens to localStorage when localStorage has existing token', () => {
      localStorage.setItem('token', 'old-token');

      service.saveTokens('new-token', 'new-refresh');

      expect(localStorage.getItem('token')).toBe('new-token');
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
      expect(sessionStorage.getItem('token')).toBeNull();
    });

    it('should save tokens to sessionStorage by default when localStorage is empty', () => {
      service.saveTokens('new-token', 'new-refresh');

      expect(sessionStorage.getItem('token')).toBe('new-token');
      expect(sessionStorage.getItem('refreshToken')).toBe('new-refresh');
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should clear all tokens and reset userName signal on clearTokens', () => {
      localStorage.setItem('token', 'tok1');
      localStorage.setItem('refreshToken', 'ref1');
      sessionStorage.setItem('token', 'tok2');
      sessionStorage.setItem('refreshToken', 'ref2');
      service.userName.set('testUser');

      service.clearTokens();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(sessionStorage.getItem('token')).toBeNull();
      expect(sessionStorage.getItem('refreshToken')).toBeNull();
      expect(service.userName()).toBe('');
    });
  });

  describe('refreshAccessToken', () => {
    it('should call api.post with "user/auth/refresh" and stored refreshToken', () => {
      localStorage.setItem('refreshToken', 'my-refresh-token');
      const mockResponse: RefreshTokenResponse = {
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      apiServiceMock.post.mockReturnValue(of(mockResponse));

      let response: any;
      service.refreshAccessToken().subscribe((res) => {
        response = res;
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('user/auth/refresh', {
        refreshToken: 'my-refresh-token',
      });
      expect(response).toEqual(mockResponse);
    });
  });
});
