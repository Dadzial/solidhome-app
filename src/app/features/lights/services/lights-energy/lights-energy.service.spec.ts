import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LightsEnergyService } from './lights-energy.service';
import { LightEnergyData } from '@features/lights/models/lights.models';
import { environment } from '@environments/environment';

describe('LightsEnergyService', () => {
  let service: LightsEnergyService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/lights`;

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
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        LightsEnergyService,
      ],
    });

    service = TestBed.inject(LightsEnergyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
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
      let responseData: LightEnergyData | undefined;

      service.getEnergyStats().subscribe((res) => {
        responseData = res;
      });

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/energy`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('timeframe')).toBe('today');
      expect(req.request.params.get('room')).toBe('entireHouse');

      req.flush(mockEnergyData);

      expect(responseData).toEqual(mockEnergyData);
    });

    it('should send a GET request with custom timeframe and room params', () => {
      let responseData: LightEnergyData | undefined;

      service.getEnergyStats('week', 'kitchen').subscribe((res) => {
        responseData = res;
      });

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/energy`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('timeframe')).toBe('week');
      expect(req.request.params.get('room')).toBe('kitchen');

      req.flush({ ...mockEnergyData, timeframe: 'week', name: 'kitchen' });

      expect(responseData?.timeframe).toBe('week');
      expect(responseData?.name).toBe('kitchen');
    });

    it('should propagate error when getEnergyStats request fails', () => {
      let capturedError: unknown;

      service.getEnergyStats().subscribe({
        next: () => {},
        error: (err) => {
          capturedError = err;
        },
      });

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/energy`);
      req.flush({ error: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });

      expect(capturedError).toBeDefined();
    });
  });

  describe('loadEnergyStats', () => {
    it('should update energyData signal and toggle isLoading on success', () => {
      service.hasError.set(true);
      service.loadEnergyStats('today', 'entireHouse');

      expect(service.isLoading()).toBe(true);

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/energy`);
      expect(req.request.params.get('timeframe')).toBe('today');
      expect(req.request.params.get('room')).toBe('entireHouse');

      req.flush(mockEnergyData);

      expect(service.isLoading()).toBe(false);
      expect(service.hasError()).toBe(false);
      expect(service.energyData()).toEqual(mockEnergyData);
    });

    it('should update currentTimeframe and currentRoom signals when arguments are provided', () => {
      service.loadEnergyStats('month', 'garage');

      expect(service.currentTimeframe()).toBe('month');
      expect(service.currentRoom()).toBe('garage');

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/energy`);
      req.flush({ ...mockEnergyData, timeframe: 'month', name: 'garage' });

      expect(service.energyData()?.name).toBe('garage');
    });

    it('should use current signal values when arguments are omitted', () => {
      service.currentTimeframe.set('week');
      service.currentRoom.set('boiler_room');

      service.loadEnergyStats();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/energy`);
      expect(req.request.params.get('timeframe')).toBe('week');
      expect(req.request.params.get('room')).toBe('boiler_room');

      req.flush({ ...mockEnergyData, timeframe: 'week', name: 'boiler_room' });
    });

    it('should set isLoading to false, hasError to true and keep energyData unchanged on error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.loadEnergyStats('today', 'living_room');
      expect(service.isLoading()).toBe(true);

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/energy`);
      req.flush({ error: 'Failed' }, { status: 500, statusText: 'Internal Server Error' });

      expect(service.isLoading()).toBe(false);
      expect(service.hasError()).toBe(true);
      expect(service.energyData()).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[LightsEnergyService] Failed to load energy stats',
        expect.anything()
      );
    });
  });
});
