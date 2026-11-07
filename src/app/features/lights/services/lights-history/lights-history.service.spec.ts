import { TestBed } from '@angular/core/testing';
import { LightsHistoryService } from './lights-history.service';
import { ApiService } from '@core/services/api/api.service';
import { LightHistoryItem, ResetHistoryResponse } from '@features/lights/models/lights.models';
import { of, throwError } from 'rxjs';

describe('LightsHistoryService', () => {
  let service: LightsHistoryService;
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    apiServiceMock = {
      get: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [LightsHistoryService, { provide: ApiService, useValue: apiServiceMock }],
    });

    service = TestBed.inject(LightsHistoryService);
  });

  afterEach(() => {
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
        {
          _id: 'h1',
          name: 'living_room',
          state: 1,
          createdAt: '2024-01-01T12:00:00Z',
          userId: { _id: 'u1', userName: 'admin', email: 'a@a.com' },
        },
      ];
      apiServiceMock.get.mockReturnValue(of(mockResponse));
      let responseData: LightHistoryItem[] | undefined;

      service.getHistory().subscribe((res) => {
        responseData = res;
      });

      expect(apiServiceMock.get).toHaveBeenCalledWith('lights/history', {});
      expect(responseData).toEqual(mockResponse);
    });

    it('should send a GET request with limit param when limit is provided', () => {
      apiServiceMock.get.mockReturnValue(of([]));

      service.getHistory(20).subscribe();

      expect(apiServiceMock.get).toHaveBeenCalledWith('lights/history', {
        params: { limit: '20' },
      });
    });

    it('should propagate error when getHistory request fails', () => {
      const mockError = new Error('Unauthorized');
      apiServiceMock.get.mockReturnValue(throwError(() => mockError));
      let capturedError: unknown;

      service.getHistory().subscribe({
        next: () => {},
        error: (err) => {
          capturedError = err;
        },
      });

      expect(apiServiceMock.get).toHaveBeenCalledWith('lights/history', {});
      expect(capturedError).toBe(mockError);
    });
  });

  describe('resetHistory', () => {
    it('should send a DELETE request to lights/history/reset and return ResetHistoryResponse', () => {
      const mockResponse: ResetHistoryResponse = { message: 'History cleared', deletedCount: 5 };
      apiServiceMock.delete.mockReturnValue(of(mockResponse));
      let responseData: ResetHistoryResponse | undefined;

      service.resetHistory().subscribe((res) => {
        responseData = res;
      });

      expect(apiServiceMock.delete).toHaveBeenCalledWith('lights/history/reset');
      expect(responseData).toEqual(mockResponse);
    });

    it('should propagate error when resetHistory request fails', () => {
      const mockError = new Error('Server error');
      apiServiceMock.delete.mockReturnValue(throwError(() => mockError));
      let capturedError: unknown;

      service.resetHistory().subscribe({
        next: () => {},
        error: (err) => {
          capturedError = err;
        },
      });

      expect(apiServiceMock.delete).toHaveBeenCalledWith('lights/history/reset');
      expect(capturedError).toBe(mockError);
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
      apiServiceMock.get.mockReturnValue(of(mockItems));

      service.loadHistory(20);

      expect(apiServiceMock.get).toHaveBeenCalledWith('lights/history', {
        params: { limit: '20' },
      });
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
      apiServiceMock.get.mockReturnValue(of(mockItems));

      service.loadHistory();

      expect(service.history()[0].name).toBe('unknown_room');
    });

    it('should fall back to "System" when userId is undefined', () => {
      const mockItems: LightHistoryItem[] = [
        { _id: 'h4', name: 'garage', state: 0, createdAt: '2024-01-01T08:00:00Z' },
      ];
      apiServiceMock.get.mockReturnValue(of(mockItems));

      service.loadHistory();

      expect(service.history()[0].user).toBe('System');
    });

    it('should not update history signal on error', () => {
      service.history.set([
        { id: 'existing', name: 'Living Room', action: 'ON', time: '10:00', user: 'admin' },
      ]);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Server error');
      apiServiceMock.get.mockReturnValue(throwError(() => mockError));

      service.loadHistory();

      expect(service.history()).toHaveLength(1);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load lights history', mockError);
    });
  });

  describe('clearHistory', () => {
    it('should clear history signal on success', () => {
      service.history.set([
        { id: 'h1', name: 'Living Room', action: 'ON', time: '10:00', user: 'admin' },
        { id: 'h2', name: 'Kitchen', action: 'OFF', time: '11:00', user: 'System' },
      ]);
      apiServiceMock.delete.mockReturnValue(of({ message: 'History cleared', deletedCount: 2 }));

      service.clearHistory();

      expect(apiServiceMock.delete).toHaveBeenCalledWith('lights/history/reset');
      expect(service.history()).toEqual([]);
    });

    it('should not clear history signal on error', () => {
      service.history.set([
        { id: 'h1', name: 'Living Room', action: 'ON', time: '10:00', user: 'admin' },
      ]);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Server error');
      apiServiceMock.delete.mockReturnValue(throwError(() => mockError));

      service.clearHistory();

      expect(apiServiceMock.delete).toHaveBeenCalledWith('lights/history/reset');
      expect(service.history()).toHaveLength(1);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to reset lights history', mockError);
    });
  });
});
