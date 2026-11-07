import { TestBed } from '@angular/core/testing';
import { VerifyEmailService } from './verify-email.service';
import { ApiService } from '@core/services/api/api.service';
import { VerifyEmailRequest, VerifyEmailResponse } from '@features/auth/models/auth.models';
import { of, throwError } from 'rxjs';

describe('VerifyEmailService', () => {
  let service: VerifyEmailService;
  let apiServiceMock: { post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiServiceMock = {
      post: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        VerifyEmailService,
        {
          provide: ApiService,
          useValue: apiServiceMock,
        },
      ],
    });

    service = TestBed.inject(VerifyEmailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('verifyEmail', () => {
    it('should send a POST request to "user/reset/code" and return VerifyEmailResponse', () => {
      const mockRequest: VerifyEmailRequest = { email: 'test@test.com' };
      const mockResponse: VerifyEmailResponse = { message: 'Verification email sent' };
      apiServiceMock.post.mockReturnValue(of(mockResponse));

      let responseData: VerifyEmailResponse | undefined;
      service.verifyEmail(mockRequest).subscribe((res) => {
        responseData = res;
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('user/reset/code', mockRequest);
      expect(responseData).toEqual(mockResponse);
    });

    it('should propagate error when verifyEmail request fails', () => {
      const mockError = new Error('User not found');
      apiServiceMock.post.mockReturnValue(throwError(() => mockError));

      let capturedError: unknown;
      service.verifyEmail({ email: 'notexist@test.com' }).subscribe({
        next: () => {},
        error: (err) => {
          capturedError = err;
        },
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('user/reset/code', { email: 'notexist@test.com' });
      expect(capturedError).toBe(mockError);
    });
  });
});
