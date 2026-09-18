import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VerifyEmailService } from './verify-email.service';
import { VerifyEmailRequest, VerifyEmailResponse } from '@features/auth/models/auth.models';
import { environment } from '@environments/environment';

describe('VerifyEmailService', () => {
  let service: VerifyEmailService;
  let httpMock: HttpTestingController;
  const expectedUrl = `${environment.apiUrl}/user/reset/code`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        VerifyEmailService,
      ],
    });

    service = TestBed.inject(VerifyEmailService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('verifyEmail', () => {
    it('should send a POST request to reset/code endpoint and return VerifyEmailResponse', () => {
      const mockRequest: VerifyEmailRequest = { email: 'test@test.com' };
      const mockResponse: VerifyEmailResponse = { message: 'Verification email sent' };
      let responseData: VerifyEmailResponse | undefined;

      service.verifyEmail(mockRequest).subscribe((res) => {
        responseData = res;
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);

      req.flush(mockResponse);

      expect(responseData).toEqual(mockResponse);
    });

    it('should propagate error when verifyEmail request fails', () => {
      let capturedError: unknown;

      service.verifyEmail({ email: 'notexist@test.com' }).subscribe({
        next: () => {},
        error: (err) => { capturedError = err; },
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');

      req.flush({ error: 'User not found' }, { status: 404, statusText: 'Not Found' });

      expect(capturedError).toBeDefined();
    });
  });
});
