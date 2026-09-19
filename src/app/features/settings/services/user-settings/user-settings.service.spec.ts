import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserSettingsService } from './user-settings.service';
import { UpdateUserRequest, UpdateUserResponse } from '@features/settings/models/settings.models';
import { environment } from '@environments/environment';

describe('UserSettingsService', () => {
  let service: UserSettingsService;
  let httpMock: HttpTestingController;
  const expectedUrl = `${environment.apiUrl}/user/update`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UserSettingsService,
      ],
    });

    service = TestBed.inject(UserSettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('updateUser', () => {
    it('should send a POST request with userName and return UpdateUserResponse', () => {
      const mockRequest: UpdateUserRequest = { userName: 'newuser' };
      const mockResponse: UpdateUserResponse = { _id: 'abc123', userName: 'newuser' };
      let responseData: UpdateUserResponse | undefined;

      service.updateUser(mockRequest).subscribe((res) => {
        responseData = res;
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);

      req.flush(mockResponse);

      expect(responseData).toEqual(mockResponse);
    });

    it('should send a POST request with email only', () => {
      const mockRequest: UpdateUserRequest = { email: 'new@email.com' };
      const mockResponse: UpdateUserResponse = { _id: 'abc123', userName: 'existinguser' };

      service.updateUser(mockRequest).subscribe();

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);

      req.flush(mockResponse);
    });

    it('should send a POST request with currentPassword and new password', () => {
      const mockRequest: UpdateUserRequest = {
        currentPassword: 'oldPassword1',
        password: 'newPassword1',
      };
      const mockResponse: UpdateUserResponse = { _id: 'abc123', userName: 'testuser' };

      service.updateUser(mockRequest).subscribe();

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);

      req.flush(mockResponse);
    });

    it('should propagate error when updateUser request fails with 400', () => {
      let capturedError: unknown;

      service.updateUser({ userName: 'taken' }).subscribe({
        next: () => {},
        error: (err) => { capturedError = err; },
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush({ error: 'Username already taken' }, { status: 400, statusText: 'Bad Request' });

      expect(capturedError).toBeDefined();
    });

    it('should propagate error when updateUser request fails with 401', () => {
      let capturedError: unknown;

      service.updateUser({ currentPassword: 'wrong', password: 'newPass1' }).subscribe({
        next: () => {},
        error: (err) => { capturedError = err; },
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush({ error: 'Invalid current password' }, { status: 401, statusText: 'Unauthorized' });

      expect(capturedError).toBeDefined();
    });
  });
});
