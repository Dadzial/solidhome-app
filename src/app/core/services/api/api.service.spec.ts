import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { ApiOptions } from '@core/models/core.models';
import { environment } from '@environments/environment';
import { describe } from 'vitest';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
      ],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get', () => {
    it('should send a GET request without options', () => {
      const mockResponse = { data: 'test' };
      const endpoint = 'lights/status';

      service.get(endpoint).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should send a GET request with headers and query params', () => {
      const mockResponse = [{ id: 1 }];
      const endpoint = 'lights/history';
      const options: ApiOptions = {
        headers: { 'Custom-Header': 'value' },
        params: { limit: 10, room: 'kitchen' },
      };

      service.get(endpoint, options).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/${endpoint}` &&
          request.params.get('limit') === '10' &&
          request.params.get('room') === 'kitchen',
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Custom-Header')).toBe('value');
      req.flush(mockResponse);
    });
  });

  describe('post', () => {
    it('should send a POST request with body', () => {
      const mockResponse = { success: true };
      const endpoint = 'user/auth';
      const payload = { username: 'testuser', password: 'password123' };

      service.post(endpoint, payload).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should send a POST request with body and options', () => {
      const mockResponse = { id: 123 };
      const endpoint = 'lights/update';
      const payload = { name: 'living_room', state: 1 };
      const options: ApiOptions = { headers: { 'X-Custom-Auth': 'token123' } };

      service.post(endpoint, payload, options).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      expect(req.request.headers.get('X-Custom-Auth')).toBe('token123');
      req.flush(mockResponse);
    });
  });

  describe('put', () => {
    it('should send a PUT request with body and options', () => {
      const mockResponse = { updated: true };
      const endpoint = 'user/update';
      const payload = { email: 'new@email.com' };
      const options: ApiOptions = { headers: { 'X-Update-Source': 'web' } };

      service.put(endpoint, payload, options).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      expect(req.request.headers.get('X-Update-Source')).toBe('web');
      req.flush(mockResponse);
    });
  });

  describe('delete', () => {
    it('should send a DELETE request without options', () => {
      const mockResponse = { message: 'Deleted' };
      const endpoint = 'lights/rules/1';

      service.delete(endpoint).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should send a DELETE request with options', () => {
      const mockResponse = { message: 'Reset done' };
      const endpoint = 'lights/history/reset';
      const options: ApiOptions = { headers: { 'X-Confirm': 'true' } };

      service.delete(endpoint, options).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/${endpoint}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('X-Confirm')).toBe('true');
      req.flush(mockResponse);
    });
  });
});
