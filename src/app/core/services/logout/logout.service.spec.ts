import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LogoutService } from './logout.service';
import { LogoutResponse } from '@core/models/core.models';
import { environment } from '@environments/environment';

describe('LogoutService', () => {
  let service: LogoutService;
  let httpMock: HttpTestingController;
  const expectedUrl = `${environment.apiUrl}/user/logout`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        LogoutService,
      ],
    });

    service = TestBed.inject(LogoutService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('logout', () => {
    it('should send a DELETE request to logout endpoint and return LogoutResponse', () => {
      const mockResponse: LogoutResponse = { message: 'Logged out successfully' };
      let responseData: LogoutResponse | undefined;

      service.logout().subscribe((res) => {
        responseData = res;
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('DELETE');

      req.flush(mockResponse);

      expect(responseData).toEqual(mockResponse);
    });

    it('should propagate error when logout request fails', () => {
      let capturedError: unknown;

      service.logout().subscribe({
        next: () => {},
        error: (err) => {
          capturedError = err;
        },
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('DELETE');

      req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(capturedError).toBeDefined();
    });
  });
});
