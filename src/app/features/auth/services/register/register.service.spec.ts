import { TestBed } from '@angular/core/testing';
import { RegisterService } from './register.service';
import { ApiService } from '@core/services/api/api.service';
import { RegisterRequest, RegisterResponse } from '@features/auth/models/auth.models';
import { of, throwError } from 'rxjs';

describe('RegisterService', () => {
  let service: RegisterService;
  let apiServiceMock: { post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiServiceMock = {
      post: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        RegisterService,
        {
          provide: ApiService,
          useValue: apiServiceMock,
        },
      ],
    });

    service = TestBed.inject(RegisterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('register', () => {
    it('should send a POST request to "user/create" and return RegisterResponse', () => {
      const mockRequest: RegisterRequest = {
        email: 'test@test.com',
        userName: 'testuser',
        password: 'password123',
      };
      const mockResponse: RegisterResponse = {
        _id: 'abc123',
        email: 'test@test.com',
        userName: 'testuser',
      };
      apiServiceMock.post.mockReturnValue(of(mockResponse));

      let responseData: RegisterResponse | undefined;
      service.register(mockRequest).subscribe((res) => {
        responseData = res;
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('user/create', mockRequest);
      expect(responseData).toEqual(mockResponse);
    });

    it('should propagate error when register request fails', () => {
      const mockError = new Error('Username already exists');
      apiServiceMock.post.mockReturnValue(throwError(() => mockError));

      let capturedError: unknown;
      service.register({ email: 'taken@test.com', userName: 'taken', password: 'pass' }).subscribe({
        next: () => {},
        error: (err) => {
          capturedError = err;
        },
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('user/create', {
        email: 'taken@test.com',
        userName: 'taken',
        password: 'pass',
      });
      expect(capturedError).toBe(mockError);
    });
  });
});
