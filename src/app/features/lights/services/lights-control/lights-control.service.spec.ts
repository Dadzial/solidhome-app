import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { LightsControlService } from './lights-control.service';
import { ApiConnectService } from '@core/services/api/api-connect.service';
import { SseService } from '@core/services/sse/sse.service';
import { LightsHistoryService } from '../lights-history/lights-history.service';
import { LightsEnergyService } from '../lights-energy/lights-energy.service';
import { HardwareStatusService } from '@core/services/hardware-status/hardware-status.service';
import { LightItem, LightUpdatedEvent } from '@features/lights/models/lights.models';
import { of, throwError, Subject } from 'rxjs';

describe('LightsControlService', () => {
  let service: LightsControlService;
  let historyService: LightsHistoryService;
  let energyService: LightsEnergyService;
  let sseSubject: Subject<LightUpdatedEvent>;
  let reconnectSubject: Subject<void>;
  let disconnectSubject: Subject<void>;
  let sseServiceMock: {
    onEvent: ReturnType<typeof vi.fn>;
    onReconnect: ReturnType<typeof vi.fn>;
    onDisconnect: ReturnType<typeof vi.fn>;
  };
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    sseSubject = new Subject<LightUpdatedEvent>();
    reconnectSubject = new Subject<void>();
    disconnectSubject = new Subject<void>();
    sseServiceMock = {
      onEvent: vi.fn().mockReturnValue(sseSubject.asObservable()),
      onReconnect: vi.fn().mockReturnValue(reconnectSubject.asObservable()),
      onDisconnect: vi.fn().mockReturnValue(disconnectSubject.asObservable()),
    };

    apiServiceMock = {
      get: vi.fn(),
      post: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        LightsControlService,
        { provide: ApiConnectService, useValue: apiServiceMock },
        { provide: SseService, useValue: sseServiceMock },
        {
          provide: LightsHistoryService,
          useValue: { loadHistory: vi.fn() },
        },
        {
          provide: LightsEnergyService,
          useValue: { loadEnergyStats: vi.fn() },
        },
        {
          provide: HardwareStatusService,
          useValue: { isBoardOnline: signal(true) },
        },
      ],
    });

    service = TestBed.inject(LightsControlService);
    historyService = TestBed.inject(LightsHistoryService);
    energyService = TestBed.inject(LightsEnergyService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('lights signal', () => {
    it('should have 6 lights by default, all off', () => {
      const lights = service.lights();
      expect(lights).toHaveLength(6);
      expect(lights.every((l) => l.on === false)).toBe(true);
    });

    it('should contain all expected room ids', () => {
      const ids = service.lights().map((l) => l.id);
      expect(ids).toEqual(
        expect.arrayContaining([
          'living_room',
          'kitchen',
          'boiler_room',
          'bathroom',
          'hallway',
          'garage',
        ]),
      );
    });
  });

  describe('errorMessage signal', () => {
    it('should default to null', () => {
      expect(service.errorMessage()).toBeNull();
    });
  });

  describe('allLightsOn computed', () => {
    it('should return false when not all lights are on', () => {
      expect(service.allLightsOn()).toBe(false);
    });

    it('should return true when all lights are on', () => {
      service.lights.update((lights) => lights.map((l) => ({ ...l, on: true })));
      expect(service.allLightsOn()).toBe(true);
    });

    it('should return false when only some lights are on', () => {
      service.lights.update((lights) => lights.map((l, i) => ({ ...l, on: i === 0 })));
      expect(service.allLightsOn()).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should send a GET request to lights/status/app and return LightItem[]', () => {
      const mockResponse: LightItem[] = [
        { _id: '1', name: 'living_room', state: 1 },
        { _id: '2', name: 'kitchen', state: 0 },
      ];
      apiServiceMock.get.mockReturnValue(of(mockResponse));

      let responseData: LightItem[] | undefined;
      service.getStatus().subscribe((res) => {
        responseData = res;
      });

      expect(apiServiceMock.get).toHaveBeenCalledWith('lights/status/app');
      expect(responseData).toEqual(mockResponse);
    });

    it('should propagate error when getStatus request fails', () => {
      const mockError = new Error('Server error');
      apiServiceMock.get.mockReturnValue(throwError(() => mockError));

      let capturedError: unknown;
      service.getStatus().subscribe({
        next: () => {},
        error: (err) => {
          capturedError = err;
        },
      });

      expect(apiServiceMock.get).toHaveBeenCalledWith('lights/status/app');
      expect(capturedError).toBe(mockError);
    });
  });

  describe('updateStatus', () => {
    it('should send a POST request with state=1 when state is true', () => {
      const mockResponse: LightItem = { _id: '1', name: 'living_room', state: 1 };
      apiServiceMock.post.mockReturnValue(of(mockResponse));

      let responseData: LightItem | undefined;
      service.updateStatus('living_room', true).subscribe((res) => {
        responseData = res;
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('lights/update', {
        name: 'living_room',
        state: 1,
      });
      expect(responseData).toEqual(mockResponse);
    });

    it('should send a POST request with state=0 when state is false', () => {
      const mockResponse: LightItem = { _id: '1', name: 'kitchen', state: 0 };
      apiServiceMock.post.mockReturnValue(of(mockResponse));

      service.updateStatus('kitchen', false).subscribe();

      expect(apiServiceMock.post).toHaveBeenCalledWith('lights/update', {
        name: 'kitchen',
        state: 0,
      });
    });

    it('should propagate error when updateStatus request fails', () => {
      const mockError = new Error('Not found');
      apiServiceMock.post.mockReturnValue(throwError(() => mockError));

      let capturedError: unknown;
      service.updateStatus('garage', true).subscribe({
        next: () => {},
        error: (err) => {
          capturedError = err;
        },
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('lights/update', {
        name: 'garage',
        state: 1,
      });
      expect(capturedError).toBe(mockError);
    });
  });

  describe('loadLights', () => {
    it('should update lights signal from API response and clear errorMessage', () => {
      const mockItems: LightItem[] = [
        { name: 'living_room', state: 1 },
        { name: 'kitchen', state: 0 },
        { name: 'boiler_room', state: 1 },
        { name: 'bathroom', state: 0 },
        { name: 'hallway', state: 1 },
        { name: 'garage', state: 0 },
      ];
      apiServiceMock.get.mockReturnValue(of(mockItems));

      service.errorMessage.set('apiErrors.server');
      service.loadLights();

      expect(apiServiceMock.get).toHaveBeenCalledWith('lights/status/app');
      const lights = service.lights();
      expect(lights.find((l) => l.id === 'living_room')?.on).toBe(true);
      expect(lights.find((l) => l.id === 'kitchen')?.on).toBe(false);
      expect(lights.find((l) => l.id === 'boiler_room')?.on).toBe(true);
      expect(service.errorMessage()).toBeNull();
    });

    it('should set errorMessage when loadLights request fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Server error');
      apiServiceMock.get.mockReturnValue(throwError(() => mockError));

      service.loadLights();

      expect(service.errorMessage()).toBe('apiErrors.server');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load initial lights status', mockError);
    });
  });

  describe('toggleLight', () => {
    it('should optimistically update light state and call history and energy on success', () => {
      const id = 'living_room';
      apiServiceMock.post.mockReturnValue(of({ name: id, state: 1 }));

      service.toggleLight(id);

      expect(service.lights().find((l) => l.id === id)?.on).toBe(true);
      expect(apiServiceMock.post).toHaveBeenCalledWith('lights/update', { name: id, state: 1 });
      expect(service.errorMessage()).toBeNull();
      expect(historyService.loadHistory).toHaveBeenCalled();
      expect(energyService.loadEnergyStats).toHaveBeenCalled();
    });

    it('should revert light state and set errorMessage on error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const id = 'hallway';
      const mockError = new Error('Server error');
      apiServiceMock.post.mockReturnValue(throwError(() => mockError));

      service.toggleLight(id);

      expect(service.lights().find((l) => l.id === id)?.on).toBe(false);
      expect(service.errorMessage()).toBe('apiErrors.server');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update light status', mockError);
    });
  });

  describe('toggleAllLights', () => {
    it('should turn all lights on and call history and energy on success', () => {
      service.lights.update((lights) => lights.map((l) => ({ ...l, on: false })));
      apiServiceMock.post.mockImplementation((_endpoint, body: { name: string; state: number }) =>
        of({ name: body.name, state: body.state }),
      );

      service.toggleAllLights();

      expect(apiServiceMock.post).toHaveBeenCalledTimes(6);
      expect(service.lights().every((l) => l.on === true)).toBe(true);
      expect(service.errorMessage()).toBeNull();
      expect(historyService.loadHistory).toHaveBeenCalled();
      expect(energyService.loadEnergyStats).toHaveBeenCalled();
    });

    it('should revert all lights to original state and set errorMessage on error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalLights = service.lights();
      const mockError = new Error('Server error');
      apiServiceMock.post.mockReturnValue(throwError(() => mockError));

      service.toggleAllLights();

      expect(service.lights()).toEqual(originalLights);
      expect(service.errorMessage()).toBe('apiErrors.server');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update lights status', mockError);
    });
  });

  describe('listenToSseUpdates', () => {
    it('should subscribe to lights:light_updated events on SseService', () => {
      expect(sseServiceMock.onEvent).toHaveBeenCalledWith('lights', 'light_updated');
    });

    it('should update light state to on when event with state 1 is received', () => {
      service.lights.update((lights) => lights.map((l) => ({ ...l, on: false })));

      sseSubject.next({ name: 'kitchen', state: 1 });

      const kitchen = service.lights().find((l) => l.id === 'kitchen');
      expect(kitchen?.on).toBe(true);
      expect(historyService.loadHistory).toHaveBeenCalled();
      expect(energyService.loadEnergyStats).toHaveBeenCalled();
    });

    it('should update light state to off when event with state 0 is received', () => {
      service.lights.update((lights) => lights.map((l) => ({ ...l, on: true })));

      sseSubject.next({ name: 'kitchen', state: 0 });

      const kitchen = service.lights().find((l) => l.id === 'kitchen');
      expect(kitchen?.on).toBe(false);
      expect(historyService.loadHistory).toHaveBeenCalled();
      expect(energyService.loadEnergyStats).toHaveBeenCalled();
    });

    it('should reload lights, history and energy stats when SSE reconnects', () => {
      const loadLightsSpy = vi.spyOn(service, 'loadLights').mockImplementation(() => {});

      reconnectSubject.next();

      expect(loadLightsSpy).toHaveBeenCalledTimes(1);
      expect(historyService.loadHistory).toHaveBeenCalled();
      expect(energyService.loadEnergyStats).toHaveBeenCalled();
    });

    it('should set network errorMessage when SSE disconnects', () => {
      disconnectSubject.next();
      expect(service.errorMessage()).toBe('apiErrors.network');
    });
  });

  describe('hardware offline protection', () => {
    it('should not toggle light when board is offline', () => {
      const hwService = TestBed.inject(HardwareStatusService);
      (hwService.isBoardOnline as any).set(false);

      const initialLights = service.lights();
      service.toggleLight('living_room');

      expect(apiServiceMock.post).not.toHaveBeenCalled();
      expect(service.lights()).toEqual(initialLights);
    });

    it('should not toggle all lights when board is offline', () => {
      const hwService = TestBed.inject(HardwareStatusService);
      (hwService.isBoardOnline as any).set(false);

      const initialLights = service.lights();
      service.toggleAllLights();

      expect(apiServiceMock.post).not.toHaveBeenCalled();
      expect(service.lights()).toEqual(initialLights);
    });
  });
});
