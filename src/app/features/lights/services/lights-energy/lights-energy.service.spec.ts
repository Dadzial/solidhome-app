import { TestBed } from '@angular/core/testing';
import { LightsEnergyService } from './lights-energy.service';
import { ApiConnectService } from '@core/services/api/api-connect.service';
import { LightEnergyData } from '@features/lights/models/lights.models';
import { of, throwError } from 'rxjs';

describe('LightsEnergyService', () => {
  let service: LightsEnergyService;
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
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
    apiServiceMock = {
      get: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [LightsEnergyService, { provide: ApiConnectService, useValue: apiServiceMock }],
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

    it('should initialize isLoading signal with false', () => {
      expect(service.isLoading()).toBe(false);
    });

    it('should initialize currentTimeframe signal with "today"', () => {
      expect(service.currentTimeframe()).toBe('today');
    });

    it('should initialize currentRoom signal with "entireHouse"', () => {
      expect(service.currentRoom()).toBe('entireHouse');
    });

    it('should initialize hasError signal with false', () => {
      expect(service.hasError()).toBe(false);
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
    it('should update energyData signal and toggle isLoading on success', () => {
      service.hasError.set(true);
      apiServiceMock.get.mockReturnValue(of(mockEnergyData));

      service.loadEnergyStats('today', 'entireHouse');

      expect(apiServiceMock.get).toHaveBeenCalledWith('lights/energy', expect.anything());
      expect(service.isLoading()).toBe(false);
      expect(service.hasError()).toBe(false);
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

    it('should set isLoading to false, hasError to true and keep energyData unchanged on error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Failed');
      apiServiceMock.get.mockReturnValue(throwError(() => mockError));

      service.loadEnergyStats('today', 'living_room');

      expect(service.isLoading()).toBe(false);
      expect(service.hasError()).toBe(true);
      expect(service.energyData()).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load energy stats',
        expect.anything(),
      );
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
});
