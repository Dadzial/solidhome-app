import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LightsControlService } from './lights-control.service';
import { LightsHistoryService } from '../lights-history/lights-history.service';
import { LightItem } from '@features/lights/models/lights.models';
import { environment } from '@environments/environment';

describe('LightsControlService', () => {
  let service: LightsControlService;
  let historyService: LightsHistoryService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/lights`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        LightsHistoryService,
        LightsControlService,
      ],
    });

    service = TestBed.inject(LightsControlService);
    historyService = TestBed.inject(LightsHistoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
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
        expect.arrayContaining(['living_room', 'kitchen', 'boiler_room', 'bathroom', 'hallway', 'garage']),
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
      service.lights.update((lights) =>
        lights.map((l, i) => ({ ...l, on: i === 0 })),
      );
      expect(service.allLightsOn()).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should send a GET request to status/app endpoint and return LightItem[]', () => {
      const mockResponse: LightItem[] = [
        { _id: '1', name: 'living_room', state: 1 },
        { _id: '2', name: 'kitchen', state: 0 },
      ];
      let responseData: LightItem[] | undefined;

      service.getStatus().subscribe((res) => {
        responseData = res;
      });

      const req = httpMock.expectOne(`${apiUrl}/status/app`);
      expect(req.request.method).toBe('GET');

      req.flush(mockResponse);

      expect(responseData).toEqual(mockResponse);
    });

    it('should propagate error when getStatus request fails', () => {
      let capturedError: unknown;

      service.getStatus().subscribe({
        next: () => {},
        error: (err) => { capturedError = err; },
      });

      const req = httpMock.expectOne(`${apiUrl}/status/app`);
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      expect(capturedError).toBeDefined();
    });
  });

  describe('updateStatus', () => {
    it('should send a POST request with state=1 when state is true', () => {
      const mockResponse: LightItem = { _id: '1', name: 'living_room', state: 1 };
      let responseData: LightItem | undefined;

      service.updateStatus('living_room', true).subscribe((res) => {
        responseData = res;
      });

      const req = httpMock.expectOne(`${apiUrl}/update`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: 'living_room', state: 1 });

      req.flush(mockResponse);

      expect(responseData).toEqual(mockResponse);
    });

    it('should send a POST request with state=0 when state is false', () => {
      const mockResponse: LightItem = { _id: '1', name: 'kitchen', state: 0 };

      service.updateStatus('kitchen', false).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/update`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: 'kitchen', state: 0 });

      req.flush(mockResponse);
    });

    it('should propagate error when updateStatus request fails', () => {
      let capturedError: unknown;

      service.updateStatus('garage', true).subscribe({
        next: () => {},
        error: (err) => { capturedError = err; },
      });

      const req = httpMock.expectOne(`${apiUrl}/update`);
      req.flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });

      expect(capturedError).toBeDefined();
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

      service.hasError.set(true);
      service.loadLights();

      const req = httpMock.expectOne(`${apiUrl}/status/app`);
      req.flush(mockItems);

      const lights = service.lights();
      expect(lights.find((l) => l.id === 'living_room')?.on).toBe(true);
      expect(lights.find((l) => l.id === 'kitchen')?.on).toBe(false);
      expect(lights.find((l) => l.id === 'boiler_room')?.on).toBe(true);
      expect(service.hasError()).toBe(false);
    });

    it('should set hasError to true when loadLights request fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      service.loadLights();

      const req = httpMock.expectOne(`${apiUrl}/status/app`);
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      expect(service.hasError()).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load initial lights status', expect.any(Object));
    });
  });

  describe('toggleLight', () => {
    it('should optimistically update light state and call historyService.loadHistory on success', () => {
      const historySpy = vi.spyOn(historyService, 'loadHistory').mockImplementation(() => {});
      const id = 'living_room';

      service.toggleLight(id);

      expect(service.lights().find((l) => l.id === id)?.on).toBe(true);

      const req = httpMock.expectOne(`${apiUrl}/update`);
      req.flush({ name: id, state: 1 });

      expect(service.hasError()).toBe(false);
      expect(historySpy).toHaveBeenCalled();
    });

    it('should revert light state and set hasError to true on error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const id = 'hallway';

      service.toggleLight(id);
      expect(service.lights().find((l) => l.id === id)?.on).toBe(true);

      const req = httpMock.expectOne(`${apiUrl}/update`);
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      expect(service.lights().find((l) => l.id === id)?.on).toBe(false);
      expect(service.hasError()).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update light status', expect.any(Object));
    });
  });

  describe('toggleAllLights', () => {
    it('should turn all lights on and call historyService.loadHistory on success', () => {
      const historySpy = vi.spyOn(historyService, 'loadHistory').mockImplementation(() => {});
      service.lights.update((lights) => lights.map((l) => ({ ...l, on: false })));

      service.toggleAllLights();

      const requests = httpMock.match(`${apiUrl}/update`);
      expect(requests).toHaveLength(6);
      requests.forEach((req) => req.flush({ name: req.request.body.name, state: 1 }));

      expect(service.lights().every((l) => l.on === true)).toBe(true);
      expect(service.hasError()).toBe(false);
      expect(historySpy).toHaveBeenCalled();
    });

    it('should revert all lights to original state and set hasError to true on error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalLights = service.lights();

      service.toggleAllLights();

      const requests = httpMock.match(`${apiUrl}/update`);
      expect(requests).toHaveLength(6);
      requests[0].flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      expect(service.lights()).toEqual(originalLights);
      expect(service.hasError()).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update lights status', expect.any(Object));
    });
  });
});
