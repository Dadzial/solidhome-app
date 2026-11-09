import { TestBed } from '@angular/core/testing';
import { ConfirmPasswordService } from './confirm-password.service';
import { ApiConnectService } from '@core/services/api/api-connect.service';
import { ConfirmPasswordRequest, ConfirmPasswordResponse } from '@features/auth/models/auth.models';
import { of, throwError } from 'rxjs';

describe('ConfirmPasswordService', () => {
  let service: ConfirmPasswordService;
  let apiServiceMock: { post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiServiceMock = {
      post: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ConfirmPasswordService,
        {
          provide: ApiConnectService,
          useValue: apiServiceMock,
        },
      ],
    });

    service = TestBed.inject(ConfirmPasswordService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('confirmNewPassword', () => {
    it('should send a POST request to "user/reset/password" and return ConfirmPasswordResponse', () => {
      const mockRequest: ConfirmPasswordRequest = { code: 'ABC123', password: 'newPassword1' };
      const mockResponse: ConfirmPasswordResponse = { message: 'Password changed successfully' };
      apiServiceMock.post.mockReturnValue(of(mockResponse));

      let responseData: ConfirmPasswordResponse | undefined;
      service.confirmNewPassword(mockRequest).subscribe((res) => {
        responseData = res;
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('user/reset/password', mockRequest);
      expect(responseData).toEqual(mockResponse);
    });

    it('should propagate error when confirmNewPassword request fails', () => {
      const mockError = new Error('Invalid or expired code');
      apiServiceMock.post.mockReturnValue(throwError(() => mockError));

      let capturedError: unknown;
      service.confirmNewPassword({ code: 'WRONG', password: 'newPassword1' }).subscribe({
        next: () => {},
        error: (err) => {
          capturedError = err;
        },
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('user/reset/password', {
        code: 'WRONG',
        password: 'newPassword1',
      });
      expect(capturedError).toBe(mockError);
    });
  });
});
