import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LightsHistoryService } from './lights-history.service';
import { LightHistoryItem, ResetHistoryResponse } from '@features/lights/models/lights.models';
import { environment } from '@environments/environment';

describe('LightsHistoryService', () => {
  let service: LightsHistoryService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/lights`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        LightsHistoryService,
      ],
    });

    service = TestBed.inject(LightsHistoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getHistory', () => {
    it('should send a GET request without params when limit is not provided', () => {
      const mockResponse: LightHistoryItem[] = [
        { _id: 'h1', name: 'living_room', state: 1, createdAt: '2024-01-01T12:00:00Z', userId: { _id: 'u1', userName: 'admin', email: 'a@a.com' } },
      ];
      let responseData: LightHistoryItem[] | undefined;

      service.getHistory().subscribe((res) => {
        responseData = res;
      });

      const req = httpMock.expectOne(`${apiUrl}/history`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('limit')).toBe(false);

      req.flush(mockResponse);

      expect(responseData).toEqual(mockResponse);
    });

    it('should send a GET request with limit param when limit is provided', () => {
      service.getHistory(20).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/history`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('limit')).toBe('20');

      req.flush([]);
    });

    it('should propagate error when getHistory request fails', () => {
      let capturedError: unknown;

      service.getHistory().subscribe({
        next: () => {},
        error: (err) => { capturedError = err; },
      });

      const req = httpMock.expectOne(`${apiUrl}/history`);
      req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(capturedError).toBeDefined();
    });
  });

  describe('resetHistory', () => {
    it('should send a DELETE request to history/reset endpoint and return ResetHistoryResponse', () => {
      const mockResponse: ResetHistoryResponse = { message: 'History cleared', deletedCount: 5 };
      let responseData: ResetHistoryResponse | undefined;

      service.resetHistory().subscribe((res) => {
        responseData = res;
      });

      const req = httpMock.expectOne(`${apiUrl}/history/reset`);
      expect(req.request.method).toBe('DELETE');

      req.flush(mockResponse);

      expect(responseData).toEqual(mockResponse);
    });

    it('should propagate error when resetHistory request fails', () => {
      let capturedError: unknown;

      service.resetHistory().subscribe({
        next: () => {},
        error: (err) => { capturedError = err; },
      });

      const req = httpMock.expectOne(`${apiUrl}/history/reset`);
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      expect(capturedError).toBeDefined();
    });
  });
});
