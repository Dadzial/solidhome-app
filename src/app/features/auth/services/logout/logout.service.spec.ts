import { TestBed } from '@angular/core/testing';
import { LogoutService } from './logout.service';
import { ApiService } from '@core/services/api/api.service';
import { LogoutResponse } from '@features/auth/models/auth.models';
import { of, throwError } from 'rxjs';

describe('LogoutService', () => {
  let service: LogoutService;
  let apiServiceMock: { delete: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiServiceMock = {
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        LogoutService,
        {
          provide: ApiService,
          useValue: apiServiceMock,
        },
      ],
    });

    service = TestBed.inject(LogoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('logout', () => {
    it('should call api.delete with "user/logout" and return response', () => {
      const mockResponse: LogoutResponse = { message: 'Logged out successfully' };
      apiServiceMock.delete.mockReturnValue(of(mockResponse));

      let responseData: LogoutResponse | undefined;
      service.logout().subscribe((res) => {
        responseData = res;
      });

      expect(apiServiceMock.delete).toHaveBeenCalledWith('user/logout');
      expect(responseData).toEqual(mockResponse);
    });

    it('should propagate error when api.delete fails', () => {
      const mockError = new Error('Unauthorized');
      apiServiceMock.delete.mockReturnValue(throwError(() => mockError));

      let capturedError: unknown;
      service.logout().subscribe({
        next: () => {},
        error: (err) => {
          capturedError = err;
        },
      });

      expect(apiServiceMock.delete).toHaveBeenCalledWith('user/logout');
      expect(capturedError).toBe(mockError);
    });
  });
});
