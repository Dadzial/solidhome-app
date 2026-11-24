import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AirDataReadService } from './air-data-read.service';
import { ApiConnectService } from '@core/services/api/api-connect.service';
import { SseService } from '@core/services/sse/sse.service';
import { HardwareStatusService } from '@core/services/hardware-status/hardware-status.service';
import { AirMeasurement } from '@features/air/models/air.models';
import { of, throwError, Subject } from 'rxjs';

describe('AirDataReadService', () => {
  let service: AirDataReadService;
  let sseSubject: Subject<AirMeasurement>;
  let reconnectSubject: Subject<void>;
  let disconnectSubject: Subject<void>;
  let sseServiceMock: {
    onEvent: ReturnType<typeof vi.fn>;
    onReconnect: ReturnType<typeof vi.fn>;
    onDisconnect: ReturnType<typeof vi.fn>;
  };
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
  };
  const mockMeasurement: AirMeasurement = {
    _id: 'air123',
    temperature: 22.5,
    pressure: 1013.2,
    humidity: 45.0,
    createdAt: '2026-11-18T20:00:00Z',
  };

  beforeEach(() => {
    sseSubject = new Subject<AirMeasurement>();
    reconnectSubject = new Subject<void>();
    disconnectSubject = new Subject<void>();
    sseServiceMock = {
      onEvent: vi.fn().mockReturnValue(sseSubject.asObservable()),
      onReconnect: vi.fn().mockReturnValue(reconnectSubject.asObservable()),
      onDisconnect: vi.fn().mockReturnValue(disconnectSubject.asObservable()),
    };

    apiServiceMock = {
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AirDataReadService,
        { provide: ApiConnectService, useValue: apiServiceMock },
        { provide: SseService, useValue: sseServiceMock },
        {
          provide: HardwareStatusService,
          useValue: { isBoardOnline: signal(true) },
        },
      ],
    });

    service = TestBed.inject(AirDataReadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial null values for computed signals', () => {
    expect(service.currentAir()).toBeNull();
    expect(service.temperature()).toBeNull();
    expect(service.pressure()).toBeNull();
    expect(service.humidity()).toBeNull();
    expect(service.errorMessage()).toBeNull();
  });

  it('should load current air data and update signals on success', () => {
    apiServiceMock.get.mockReturnValue(of(mockMeasurement));

    service.loadCurrentAir();

    expect(apiServiceMock.get).toHaveBeenCalledWith('air/current');
    expect(service.currentAir()).toEqual(mockMeasurement);
    expect(service.temperature()).toBe(22.5);
    expect(service.pressure()).toBe(1013.2);
    expect(service.humidity()).toBe(45.0);
    expect(service.errorMessage()).toBeNull();
  });

  it('should set errorMessage on loadCurrentAir failure', () => {
    apiServiceMock.get.mockReturnValue(throwError(() => ({ error: 'apiErrors.timeout' })));

    service.loadCurrentAir();

    expect(service.errorMessage()).toBe('apiErrors.timeout');
  });

  it('should update currentAir and clear errorMessage on SSE update', () => {
    service.errorMessage.set('apiErrors.server');

    sseSubject.next(mockMeasurement);

    expect(service.currentAir()).toEqual(mockMeasurement);
    expect(service.temperature()).toBe(22.5);
    expect(service.errorMessage()).toBeNull();
  });

  it('should reload current air data when SSE reconnects', () => {
    apiServiceMock.get.mockReturnValue(of(mockMeasurement));

    reconnectSubject.next();

    expect(apiServiceMock.get).toHaveBeenCalledWith('air/current');
    expect(service.currentAir()).toEqual(mockMeasurement);
  });

  it('should set network errorMessage when SSE disconnects', () => {
    disconnectSubject.next();
    expect(service.errorMessage()).toBe('apiErrors.network');
  });
});
