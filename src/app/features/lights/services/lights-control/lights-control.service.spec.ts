import { TestBed } from '@angular/core/testing';
import { LightsControlService } from './lights-control.service';
import { ApiConnectService } from '@core/services/api/api-connect.service';
import { LightsHistoryService } from '../lights-history/lights-history.service';
import { LightsEnergyService } from '../lights-energy/lights-energy.service';
import { LightItem } from '@features/lights/models/lights.models';
import { of, throwError } from 'rxjs';

describe('LightsControlService', () => {
  let service: LightsControlService;
  let historyService: LightsHistoryService;
  let energyService: LightsEnergyService;
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    apiServiceMock = {
      get: vi.fn(),
      post: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        LightsControlService,
        { provide: ApiConnectService, useValue: apiServiceMock },
        {
          provide: LightsHistoryService,
          useValue: { loadHistory: vi.fn() },
        },
        {
          provide: LightsEnergyService,
          useValue: { loadEnergyStats: vi.fn() },
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

  describe('hasError signal', () => {
    it('should default to false', () => {
      expect(service.hasError()).toBe(false);
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
    it('should update lights signal from API response and set hasError to false', () => {
      const mockItems: LightItem[] = [
        { name: 'living_room', state: 1 },
        { name: 'kitchen', state: 0 },
        { name: 'boiler_room', state: 1 },
        { name: 'bathroom', state: 0 },
        { name: 'hallway', state: 1 },
        { name: 'garage', state: 0 },
      ];
      apiServiceMock.get.mockReturnValue(of(mockItems));

      service.hasError.set(true);
      service.loadLights();

      expect(apiServiceMock.get).toHaveBeenCalledWith('lights/status/app');
      const lights = service.lights();
      expect(lights.find((l) => l.id === 'living_room')?.on).toBe(true);
      expect(lights.find((l) => l.id === 'kitchen')?.on).toBe(false);
      expect(lights.find((l) => l.id === 'boiler_room')?.on).toBe(true);
      expect(service.hasError()).toBe(false);
    });

    it('should set hasError to true when loadLights request fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Server error');
      apiServiceMock.get.mockReturnValue(throwError(() => mockError));

      service.loadLights();

      expect(service.hasError()).toBe(true);
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
      expect(service.hasError()).toBe(false);
      expect(historyService.loadHistory).toHaveBeenCalled();
      expect(energyService.loadEnergyStats).toHaveBeenCalled();
    });

    it('should revert light state and set hasError to true on error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const id = 'hallway';
      const mockError = new Error('Server error');
      apiServiceMock.post.mockReturnValue(throwError(() => mockError));

      service.toggleLight(id);

      expect(service.lights().find((l) => l.id === id)?.on).toBe(false);
      expect(service.hasError()).toBe(true);
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
      expect(service.hasError()).toBe(false);
      expect(historyService.loadHistory).toHaveBeenCalled();
      expect(energyService.loadEnergyStats).toHaveBeenCalled();
    });

    it('should revert all lights to original state and set hasError to true on error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalLights = service.lights();
      const mockError = new Error('Server error');
      apiServiceMock.post.mockReturnValue(throwError(() => mockError));

      service.toggleAllLights();

      expect(service.lights()).toEqual(originalLights);
      expect(service.hasError()).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update lights status', mockError);
    });
  });
});
