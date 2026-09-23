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
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('history signal', () => {
    it('should default to an empty array', () => {
      expect(service.history()).toEqual([]);
    });
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

  describe('loadHistory', () => {
    it('should map LightHistoryItem[] to LightHistory[] and update history signal', () => {
      const mockItems: LightHistoryItem[] = [
        {
          _id: 'h1',
          name: 'living_room',
          state: 1,
          createdAt: '2024-01-01T12:05:00Z',
          userId: { _id: 'u1', userName: 'admin', email: 'a@a.com' },
        },
        {
          _id: 'h2',
          name: 'kitchen',
          state: 0,
          createdAt: '2024-01-01T13:30:00Z',
          userId: null,
        },
      ];

      service.loadHistory(20);

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/history`);
      expect(req.request.params.get('limit')).toBe('20');
      req.flush(mockItems);

      const history = service.history();
      expect(history).toHaveLength(2);

      expect(history[0].id).toBe('h1');
      expect(history[0].name).toBe('home.lightsWidget.rooms.livingRoom');
      expect(history[0].action).toBe('ON');
      expect(history[0].user).toBe('admin');

      expect(history[1].id).toBe('h2');
      expect(history[1].name).toBe('home.lightsWidget.rooms.kitchen');
      expect(history[1].action).toBe('OFF');
      expect(history[1].user).toBe('System');
    });

    it('should use raw name when room id is not in ROOMS_NAMES_TRANSLATIONS', () => {
      const mockItems: LightHistoryItem[] = [
        { _id: 'h3', name: 'unknown_room', state: 1, createdAt: '2024-01-01T10:00:00Z' },
      ];

      service.loadHistory();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/history`);
      req.flush(mockItems);

      expect(service.history()[0].name).toBe('unknown_room');
    });

    it('should fall back to "System" when userId is undefined', () => {
      const mockItems: LightHistoryItem[] = [
        { _id: 'h4', name: 'garage', state: 0, createdAt: '2024-01-01T08:00:00Z' },
      ];

      service.loadHistory();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/history`);
      req.flush(mockItems);

      expect(service.history()[0].user).toBe('System');
    });

    it('should not update history signal on error', () => {
      service.history.set([
        { id: 'existing', name: 'Living Room', action: 'ON', time: '10:00', user: 'admin' },
      ]);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      service.loadHistory();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/history`);
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      expect(service.history()).toHaveLength(1);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load lights history', expect.any(Object));
    });
  });

  describe('clearHistory', () => {
    it('should clear history signal on success', () => {
      service.history.set([
        { id: 'h1', name: 'Living Room', action: 'ON', time: '10:00', user: 'admin' },
        { id: 'h2', name: 'Kitchen', action: 'OFF', time: '11:00', user: 'System' },
      ]);

      service.clearHistory();

      const req = httpMock.expectOne(`${apiUrl}/history/reset`);
      req.flush({ message: 'History cleared', deletedCount: 2 });

      expect(service.history()).toEqual([]);
    });

    it('should not clear history signal on error', () => {
      service.history.set([
        { id: 'h1', name: 'Living Room', action: 'ON', time: '10:00', user: 'admin' },
      ]);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      service.clearHistory();

      const req = httpMock.expectOne(`${apiUrl}/history/reset`);
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      expect(service.history()).toHaveLength(1);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to reset lights history', expect.any(Object));
    });
  });
});
