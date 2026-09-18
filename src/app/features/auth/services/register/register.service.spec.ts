import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RegisterService } from './register.service';
import { RegisterRequest, RegisterResponse } from '@features/auth/models/auth.models';
import { environment } from '@environments/environment';

describe('RegisterService', () => {
  let service: RegisterService;
  let httpMock: HttpTestingController;
  const expectedUrl = `${environment.apiUrl}/user/create`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RegisterService,
      ],
    });

    service = TestBed.inject(RegisterService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('register', () => {
    it('should send a POST request to create endpoint and return RegisterResponse', () => {
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
      let responseData: RegisterResponse | undefined;

      service.register(mockRequest).subscribe((res) => {
        responseData = res;
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);

      req.flush(mockResponse);

      expect(responseData).toEqual(mockResponse);
    });

    it('should propagate error when register request fails', () => {
      let capturedError: unknown;

      service.register({ email: 'taken@test.com', userName: 'taken', password: 'pass' }).subscribe({
        next: () => {},
        error: (err) => { capturedError = err; },
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');

      req.flush({ error: 'Username already exists' }, { status: 409, statusText: 'Conflict' });

      expect(capturedError).toBeDefined();
    });
  });
});
