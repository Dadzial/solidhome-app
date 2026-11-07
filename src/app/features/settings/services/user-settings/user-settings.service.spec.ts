import { TestBed } from '@angular/core/testing';
import { UserSettingsService } from './user-settings.service';
import { ApiService } from '@core/services/api/api.service';
import { UpdateUserRequest, UpdateUserResponse } from '@features/settings/models/settings.models';
import { of, throwError } from 'rxjs';

describe('UserSettingsService', () => {
  let service: UserSettingsService;
  let apiServiceMock: { post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiServiceMock = {
      post: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UserSettingsService,
        { provide: ApiService, useValue: apiServiceMock },
      ],
    });

    service = TestBed.inject(UserSettingsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('updateUser', () => {
    it('should send a POST request with userName and return UpdateUserResponse', () => {
      const mockRequest: UpdateUserRequest = { userName: 'newuser' };
      const mockResponse: UpdateUserResponse = { _id: 'abc123', userName: 'newuser' };
      apiServiceMock.post.mockReturnValue(of(mockResponse));

      let responseData: UpdateUserResponse | undefined;
      service.updateUser(mockRequest).subscribe((res) => {
        responseData = res;
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('user/update', mockRequest);
      expect(responseData).toEqual(mockResponse);
    });

    it('should send a POST request with email only', () => {
      const mockRequest: UpdateUserRequest = { email: 'new@email.com' };
      const mockResponse: UpdateUserResponse = { _id: 'abc123', userName: 'existinguser' };
      apiServiceMock.post.mockReturnValue(of(mockResponse));

      let responseData: UpdateUserResponse | undefined;
      service.updateUser(mockRequest).subscribe((res) => {
        responseData = res;
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('user/update', mockRequest);
      expect(responseData).toEqual(mockResponse);
    });

    it('should send a POST request with currentPassword and new password', () => {
      const mockRequest: UpdateUserRequest = {
        currentPassword: 'oldPassword1',
        password: 'newPassword1',
      };
      const mockResponse: UpdateUserResponse = { _id: 'abc123', userName: 'testuser' };
      apiServiceMock.post.mockReturnValue(of(mockResponse));

      let responseData: UpdateUserResponse | undefined;
      service.updateUser(mockRequest).subscribe((res) => {
        responseData = res;
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('user/update', mockRequest);
      expect(responseData).toEqual(mockResponse);
    });

    it('should propagate error when updateUser request fails with 400', () => {
      const mockError = new Error('Username already taken');
      apiServiceMock.post.mockReturnValue(throwError(() => mockError));

      let capturedError: unknown;
      service.updateUser({ userName: 'taken' }).subscribe({
        next: () => {},
        error: (err) => {
          capturedError = err;
        },
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('user/update', { userName: 'taken' });
      expect(capturedError).toBe(mockError);
    });

    it('should propagate error when updateUser request fails with 401', () => {
      const mockError = new Error('Invalid current password');
      apiServiceMock.post.mockReturnValue(throwError(() => mockError));

      let capturedError: unknown;
      service.updateUser({ currentPassword: 'wrong', password: 'newPass1' }).subscribe({
        next: () => {},
        error: (err) => {
          capturedError = err;
        },
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('user/update', {
        currentPassword: 'wrong',
        password: 'newPass1',
      });
      expect(capturedError).toBe(mockError);
    });
  });
});
