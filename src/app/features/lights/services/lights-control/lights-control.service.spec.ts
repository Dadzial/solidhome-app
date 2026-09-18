import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LightsControlService } from './lights-control.service';
import { LightItem } from '@features/lights/models/lights.models';
import { environment } from '@environments/environment';

describe('LightsControlService', () => {
  let service: LightsControlService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/lights`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        LightsControlService,
      ],
    });

    service = TestBed.inject(LightsControlService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
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
});
