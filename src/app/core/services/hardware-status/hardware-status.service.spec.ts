import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HardwareStatusService } from './hardware-status.service';
import { ApiConnectService } from '../api/api-connect.service';
import { SseService } from '../sse/sse.service';
import { LoginService } from '@features/auth/services/login/login.service';
import { BoardStatusEvent } from '@core/models/core.models';

describe('HardwareStatusService', () => {
  let service: HardwareStatusService;
  let apiMock: { get: ReturnType<typeof vi.fn> };
  let sseMock: { onEvent: ReturnType<typeof vi.fn>; onReconnect: ReturnType<typeof vi.fn> };
  let loginMock: { getAccessToken: ReturnType<typeof vi.fn> };
  let sseSubject: Subject<BoardStatusEvent>;
  let reconnectSubject: Subject<void>;

  beforeEach(() => {
    sseSubject = new Subject<BoardStatusEvent>();
    reconnectSubject = new Subject<void>();

    apiMock = {
      get: vi.fn().mockReturnValue(of({ online: true })),
    };

    sseMock = {
      onEvent: vi.fn().mockReturnValue(sseSubject.asObservable()),
      onReconnect: vi.fn().mockReturnValue(reconnectSubject.asObservable()),
    };

    loginMock = {
      getAccessToken: vi.fn().mockReturnValue('mock-jwt-token'),
    };

    TestBed.configureTestingModule({
      providers: [
        HardwareStatusService,
        { provide: ApiConnectService, useValue: apiMock },
        { provide: SseService, useValue: sseMock },
        { provide: LoginService, useValue: loginMock },
      ],
    });

    service = TestBed.inject(HardwareStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check initial status on init and set isBoardOnline', () => {
    expect(apiMock.get).toHaveBeenCalledWith('hardware/status');
    expect(service.isBoardOnline()).toBe(true);
  });

  it('should not check initial status when user has no access token', () => {
    apiMock.get.mockClear();
    loginMock.getAccessToken.mockReturnValue(null);
    service.checkInitialStatus();
    expect(apiMock.get).not.toHaveBeenCalled();
  });

  it('should update isBoardOnline when initial status is false', () => {
    apiMock.get.mockReturnValue(of({ online: false }));
    service.checkInitialStatus();
    expect(service.isBoardOnline()).toBe(false);
  });

  it('should handle API error gracefully on checkInitialStatus', () => {
    apiMock.get.mockReturnValue(throwError(() => new Error('API failure')));
    service.isBoardOnline.set(true);
    service.checkInitialStatus();
    expect(service.isBoardOnline()).toBe(true);
  });

  it('should listen to SSE board_status events and update isBoardOnline', () => {
    expect(sseMock.onEvent).toHaveBeenCalledWith('hardware', 'status');

    sseSubject.next({ online: false });
    expect(service.isBoardOnline()).toBe(false);

    sseSubject.next({ online: true });
    expect(service.isBoardOnline()).toBe(true);
  });

  it('should recheck board status when SSE reconnects', () => {
    apiMock.get.mockClear();
    apiMock.get.mockReturnValue(of({ online: false }));

    reconnectSubject.next();

    expect(apiMock.get).toHaveBeenCalledWith('hardware/status');
    expect(service.isBoardOnline()).toBe(false);
  });
});
