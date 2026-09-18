import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfirmPasswordService } from './confirm-password.service';
import { ConfirmPasswordRequest, ConfirmPasswordResponse } from '@features/auth/models/auth.models';
import { environment } from '@environments/environment';

describe('ConfirmPasswordService', () => {
  let service: ConfirmPasswordService;
  let httpMock: HttpTestingController;
  const expectedUrl = `${environment.apiUrl}/user/reset/password`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ConfirmPasswordService,
      ],
    });

    service = TestBed.inject(ConfirmPasswordService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('confirmNewPassword', () => {
    it('should send a POST request to reset/password endpoint and return ConfirmPasswordResponse', () => {
      const mockRequest: ConfirmPasswordRequest = { code: 'ABC123', password: 'newPassword1' };
      const mockResponse: ConfirmPasswordResponse = { message: 'Password changed successfully' };
      let responseData: ConfirmPasswordResponse | undefined;

      service.confirmNewPassword(mockRequest).subscribe((res) => {
        responseData = res;
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);

      req.flush(mockResponse);

      expect(responseData).toEqual(mockResponse);
    });

    it('should propagate error when confirmNewPassword request fails', () => {
      let capturedError: unknown;

      service.confirmNewPassword({ code: 'WRONG', password: 'newPassword1' }).subscribe({
        next: () => {},
        error: (err) => { capturedError = err; },
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');

      req.flush({ error: 'Invalid or expired code' }, { status: 400, statusText: 'Bad Request' });

      expect(capturedError).toBeDefined();
    });
  });
});
