import { TestBed } from '@angular/core/testing';
import { LightsEnergyService } from './lights-energy.service';
import { ApiConnectService } from '@core/services/api/api-connect.service';
import { SseService } from '@core/services/sse/sse.service';
import { LightEnergyData } from '@features/lights/models/lights.models';
import { of, throwError, Subject } from 'rxjs';

describe('LightsEnergyService', () => {
  let service: LightsEnergyService;
  let sseSubject: Subject<LightEnergyData>;
  let disconnectSubject: Subject<void>;
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let sseServiceMock: {
    onEvent: ReturnType<typeof vi.fn>;
    onDisconnect: ReturnType<typeof vi.fn>;
  };

  const mockEnergyData: LightEnergyData = {
    name: 'entireHouse',
    timeframe: 'today',
    totalKwh: 0.45,
    chartData: [0, 0.05, 0.06],
    categories: ['18:00', '18:01', '18:02'],
    topRooms: [
      { name: 'living_room', kwh: 0.25, percentage: 56 },
      { name: 'kitchen', kwh: 0.15, percentage: 33 },
      { name: 'garage', kwh: 0.05, percentage: 11 },
    ],
    lightsKwh: {
      living_room: 0.25,
      kitchen: 0.15,
      garage: 0.05,
      bathroom: 0,
      hallway: 0,
      boiler_room: 0,
    },
    totalHouseKwh: 0.45,
  };

  beforeEach(() => {
    sseSubject = new Subject<LightEnergyData>();
    disconnectSubject = new Subject<void>();
    apiServiceMock = {
      get: vi.fn(),
      delete: vi.fn(),
    };
    sseServiceMock = {
      onEvent: vi.fn().mockReturnValue(sseSubject.asObservable()),
      onDisconnect: vi.fn().mockReturnValue(disconnectSubject.asObservable()),
    };

    TestBed.configureTestingModule({
      providers: [
        LightsEnergyService,
        { provide: ApiConnectService, useValue: apiServiceMock },
        { provide: SseService, useValue: sseServiceMock },
      ],
    });

    service = TestBed.inject(LightsEnergyService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial signals state', () => {
    it('should initialize energyData signal with null', () => {
      expect(service.energyData()).toBeNull();
    });

    it('should initialize currentTimeframe signal with "today"', () => {
      expect(service.currentTimeframe()).toBe('today');
    });

    it('should initialize currentRoom signal with "entireHouse"', () => {
      expect(service.currentRoom()).toBe('entireHouse');
    });

    it('should initialize errorMessage signal with null', () => {
      expect(service.errorMessage()).toBeNull();
    });
  });

  describe('getEnergyStats', () => {
    it('should send a GET request with default params when none are provided', () => {
      apiServiceMock.get.mockReturnValue(of(mockEnergyData));
      let responseData: LightEnergyData | undefined;

      service.getEnergyStats().subscribe((res) => {
        responseData = res;
      });

      expect(apiServiceMock.get).toHaveBeenCalledWith(
        'lights/energy',
        expect.objectContaining({
          params: expect.anything(),
        }),
      );
      expect(responseData).toEqual(mockEnergyData);
    });

    it('should send a GET request with custom timeframe and room params', () => {
      const customResponse = { ...mockEnergyData, timeframe: 'week' as const, name: 'kitchen' };
      apiServiceMock.get.mockReturnValue(of(customResponse));
      let responseData: LightEnergyData | undefined;

      service.getEnergyStats('week', 'kitchen').subscribe((res) => {
        responseData = res;
      });

      expect(apiServiceMock.get).toHaveBeenCalledWith(
        'lights/energy',
        expect.objectContaining({
          params: expect.anything(),
        }),
      );
      expect(responseData?.timeframe).toBe('week');
      expect(responseData?.name).toBe('kitchen');
    });

    it('should propagate error when getEnergyStats request fails', () => {
      const mockError = new Error('Server Error');
      apiServiceMock.get.mockReturnValue(throwError(() => mockError));
      let capturedError: unknown;

      service.getEnergyStats().subscribe({
        next: () => {},
        error: (err) => {
          capturedError = err;
        },
      });

      expect(apiServiceMock.get).toHaveBeenCalledWith('lights/energy', expect.anything());
      expect(capturedError).toBe(mockError);
    });
  });

  describe('loadEnergyStats', () => {
    it('should update energyData signal and clear errorMessage on success', () => {
      service.errorMessage.set('apiErrors.server');
      apiServiceMock.get.mockReturnValue(of(mockEnergyData));

      service.loadEnergyStats('today', 'entireHouse');

      expect(apiServiceMock.get).toHaveBeenCalledWith('lights/energy', expect.anything());
      expect(service.errorMessage()).toBeNull();
      expect(service.energyData()).toEqual(mockEnergyData);
    });

    it('should update currentTimeframe and currentRoom signals when arguments are provided', () => {
      const customResponse = { ...mockEnergyData, timeframe: 'month' as const, name: 'garage' };
      apiServiceMock.get.mockReturnValue(of(customResponse));

      service.loadEnergyStats('month', 'garage');

      expect(service.currentTimeframe()).toBe('month');
      expect(service.currentRoom()).toBe('garage');
      expect(service.energyData()?.name).toBe('garage');
    });

    it('should use current signal values when arguments are omitted', () => {
      service.currentTimeframe.set('week');
      service.currentRoom.set('boiler_room');
      const customResponse = { ...mockEnergyData, timeframe: 'week' as const, name: 'boiler_room' };
      apiServiceMock.get.mockReturnValue(of(customResponse));

      service.loadEnergyStats();

      expect(apiServiceMock.get).toHaveBeenCalledWith('lights/energy', expect.anything());
    });

    it('should set errorMessage and keep energyData unchanged on error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Failed');
      apiServiceMock.get.mockReturnValue(throwError(() => mockError));

      service.loadEnergyStats('today', 'living_room');

      expect(service.errorMessage()).toBe('apiErrors.server');
      expect(service.energyData()).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load energy stats', expect.anything());
    });
  });

  describe('resetEnergyStats', () => {
    it('should send a DELETE request to lights/energy/reset and return response', () => {
      const mockResponse = { message: 'Energy stats reset successfully', deletedCount: 5 };
      apiServiceMock.delete.mockReturnValue(of(mockResponse));
      let response: { message: string; deletedCount: number } | undefined;

      service.resetEnergyStats().subscribe((res) => {
        response = res;
      });

      expect(apiServiceMock.delete).toHaveBeenCalledWith('lights/energy/reset');
      expect(response).toEqual(mockResponse);
    });

    it('should propagate error when resetEnergyStats request fails', () => {
      const mockError = new Error('Reset Failed');
      apiServiceMock.delete.mockReturnValue(throwError(() => mockError));
      let capturedError: unknown;

      service.resetEnergyStats().subscribe({
        next: () => {},
        error: (err) => {
          capturedError = err;
        },
      });

      expect(apiServiceMock.delete).toHaveBeenCalledWith('lights/energy/reset');
      expect(capturedError).toBe(mockError);
    });
  });

  describe('listenToSseUpdates', () => {
    it('should subscribe to lights:energy_updated events on SseService', () => {
      expect(sseServiceMock.onEvent).toHaveBeenCalledWith('lights', 'energy_updated');
    });

    it('should directly update energyData and clear errorMessage for today and entireHouse', () => {
      service.currentTimeframe.set('today');
      service.currentRoom.set('entireHouse');
      service.errorMessage.set('apiErrors.server');

      sseSubject.next(mockEnergyData);

      expect(service.energyData()).toEqual(mockEnergyData);
      expect(service.errorMessage()).toBeNull();
      expect(apiServiceMock.get).not.toHaveBeenCalled();
    });

    it('should call loadEnergyStats for today when a specific room is selected', () => {
      service.currentTimeframe.set('today');
      service.currentRoom.set('kitchen');
      const loadSpy = vi.spyOn(service, 'loadEnergyStats').mockImplementation(() => {});

      sseSubject.next(mockEnergyData);

      expect(loadSpy).toHaveBeenCalledTimes(1);
    });

    it('should ignore SSE updates when timeframe is not today', () => {
      service.currentTimeframe.set('week');
      service.currentRoom.set('entireHouse');
      service.energyData.set(null);

      sseSubject.next(mockEnergyData);

      expect(service.energyData()).toBeNull();
      expect(apiServiceMock.get).not.toHaveBeenCalled();
    });

    it('should set server errorMessage when SSE disconnects while online', () => {
      const onLineSpy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
      disconnectSubject.next();
      expect(service.errorMessage()).toBe('apiErrors.server');
      onLineSpy.mockRestore();
    });

    it('should set network errorMessage when SSE disconnects while offline', () => {
      const onLineSpy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
      disconnectSubject.next();
      expect(service.errorMessage()).toBe('apiErrors.network');
      onLineSpy.mockRestore();
    });
  });
});
