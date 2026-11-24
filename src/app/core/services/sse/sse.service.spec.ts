import { TestBed } from '@angular/core/testing';
import { SseService } from './sse.service';
import { LoginService } from '@features/auth/services/login/login.service';
import { environment } from '@environments/environment';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('SseService', () => {
  let service: SseService;
  let fetchEventSourceMock: ReturnType<typeof vi.fn>;
  let loginServiceMock: {
    getAccessToken: ReturnType<typeof vi.fn>;
    getRefreshToken: ReturnType<typeof vi.fn>;
    refreshAccessToken: ReturnType<typeof vi.fn>;
    saveTokens: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    fetchEventSourceMock = vi.fn().mockResolvedValue(undefined);

    loginServiceMock = {
      getAccessToken: vi.fn().mockReturnValue('mock-jwt-token'),
      getRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
      refreshAccessToken: vi
        .fn()
        .mockReturnValue(of({ token: 'fresh-jwt-token', refreshToken: 'fresh-refresh-token' })),
      saveTokens: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SseService,
        {
          provide: LoginService,
          useValue: loginServiceMock,
        },
      ],
    });

    service = TestBed.inject(SseService);
    service.fetchEventSource = fetchEventSourceMock as any;
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.ngOnDestroy();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial isConnected state set to false', () => {
    expect(service.isConnected()).toBe(false);
  });

  describe('connect', () => {
    it('should not initiate connection when token is not available', async () => {
      loginServiceMock.getAccessToken.mockReturnValue(null);

      await service.connect();

      expect(fetchEventSourceMock).not.toHaveBeenCalled();
      expect(service.isConnected()).toBe(false);
    });

    it('should not initiate connection when already connected', async () => {
      service.isConnected.set(true);

      await service.connect();

      expect(fetchEventSourceMock).not.toHaveBeenCalled();
    });

    it('should prevent duplicate concurrent connection attempts while connecting', async () => {
      let resolveFetch!: () => void;
      fetchEventSourceMock.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveFetch = resolve;
          }),
      );

      const first = service.connect();
      const second = service.connect();

      expect(fetchEventSourceMock).toHaveBeenCalledTimes(1);

      resolveFetch();
      await Promise.all([first, second]);
    });

    it('should call fetchEventSource with correct endpoint, headers and signal', async () => {
      await service.connect();

      expect(fetchEventSourceMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchEventSourceMock.mock.calls[0];

      expect(url).toBe(`${environment.apiUrl}/events`);
      expect(options.method).toBe('GET');
      expect(options.headers).toEqual({
        Authorization: 'Bearer mock-jwt-token',
        Accept: 'text/event-stream',
      });
      expect(options.openWhenHidden).toBe(true);
      expect(options.signal).toBeInstanceOf(AbortSignal);
    });

    it('should set isConnected to true on successful onopen response and emit onReconnect only on subsequent opens', async () => {
      let reconnectCount = 0;
      const sub = service.onReconnect().subscribe(() => {
        reconnectCount += 1;
      });

      const mockResponse = {
        ok: true,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'text/event-stream' : null),
        },
      } as unknown as Response;

      await service.connect();
      const options1 = fetchEventSourceMock.mock.calls[0][1];
      await options1.onopen!(mockResponse);

      expect(service.isConnected()).toBe(true);
      expect(reconnectCount).toBe(0);

      // Simulate reconnect
      service.isConnected.set(false);
      await service.connect();
      const options2 = fetchEventSourceMock.mock.calls[1][1];
      await options2.onopen!(mockResponse);

      expect(service.isConnected()).toBe(true);
      expect(reconnectCount).toBe(1);
      sub.unsubscribe();
    });

    it('should refresh access token on 401 response and throw to trigger reconnect', async () => {
      await service.connect();
      const options = fetchEventSourceMock.mock.calls[0][1];

      const unauthorizedResponse = {
        ok: false,
        status: 401,
        headers: {
          get: () => 'application/json',
        },
      } as unknown as Response;

      await expect(options.onopen!(unauthorizedResponse)).rejects.toThrow(
        'SSE token refreshed, reconnecting',
      );
      expect(loginServiceMock.refreshAccessToken).toHaveBeenCalledTimes(1);
      expect(loginServiceMock.saveTokens).toHaveBeenCalledWith(
        'fresh-jwt-token',
        'fresh-refresh-token',
      );
    });

    it('should disconnect when 401 token refresh fails', async () => {
      loginServiceMock.refreshAccessToken.mockReturnValue(throwError(() => new Error('Expired')));
      await service.connect();

      const options = fetchEventSourceMock.mock.calls[0][1];
      const disconnectSpy = vi.spyOn(service, 'disconnect');

      const unauthorizedResponse = {
        ok: false,
        status: 401,
        headers: {
          get: () => 'application/json',
        },
      } as unknown as Response;

      await expect(options.onopen!(unauthorizedResponse)).rejects.toThrow('SSE unauthorized');
      expect(disconnectSpy).toHaveBeenCalled();
      expect(service.isConnected()).toBe(false);
    });

    it('should set isConnected to false and throw on onclose to trigger reconnect', async () => {
      await service.connect();
      service.isConnected.set(true);

      const options = fetchEventSourceMock.mock.calls[0][1];
      expect(() => options.onclose!()).toThrow('SSE stream closed by server');
      expect(service.isConnected()).toBe(false);
    });

    it('should set isConnected to false, log error and rethrow on onerror', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await service.connect();
      service.isConnected.set(true);

      const options = fetchEventSourceMock.mock.calls[0][1];
      const err = new Error('Network error');

      expect(() => options.onerror!(err)).toThrow('Network error');
      expect(service.isConnected()).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('SSE connection error:', err);
    });

    it('should schedule reconnect with fresh token when fetchEventSource rejects', async () => {
      vi.useFakeTimers();
      fetchEventSourceMock.mockRejectedValueOnce(new Error('Fetch fatal error'));
      loginServiceMock.getAccessToken
        .mockReturnValueOnce('old-jwt-token')
        .mockReturnValueOnce('new-jwt-token');

      await service.connect();
      expect(service.isConnected()).toBe(false);
      expect(fetchEventSourceMock).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1000);

      expect(fetchEventSourceMock).toHaveBeenCalledTimes(2);
      expect(fetchEventSourceMock.mock.calls[1][1].headers.Authorization).toBe(
        'Bearer new-jwt-token',
      );
    });

    it('should emit onDisconnect and set connectionFailed after reaching failure threshold', async () => {
      vi.useFakeTimers();
      let disconnectEvents = 0;
      const sub = service.onDisconnect().subscribe(() => {
        disconnectEvents += 1;
      });

      fetchEventSourceMock
        .mockRejectedValueOnce(new Error('Drop 1'))
        .mockRejectedValueOnce(new Error('Drop 2'));

      await service.connect();
      expect(service.connectionFailed()).toBe(false);
      expect(disconnectEvents).toBe(0);

      await vi.advanceTimersByTimeAsync(1000);
      expect(service.connectionFailed()).toBe(true);
      expect(disconnectEvents).toBe(1);

      sub.unsubscribe();
    });

    it('should emit onReconnect when first successful open happens after failed attempts', async () => {
      vi.useFakeTimers();
      let reconnectCount = 0;
      const sub = service.onReconnect().subscribe(() => {
        reconnectCount += 1;
      });

      fetchEventSourceMock.mockRejectedValueOnce(new Error('Backend offline'));
      await service.connect();

      await vi.advanceTimersByTimeAsync(1000);
      const options = fetchEventSourceMock.mock.calls[1][1];
      const mockResponse = {
        ok: true,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'text/event-stream' : null),
        },
      } as unknown as Response;

      await options.onopen!(mockResponse);

      expect(service.isConnected()).toBe(true);
      expect(service.connectionFailed()).toBe(false);
      expect(reconnectCount).toBe(1);
      sub.unsubscribe();
    });

    it('should trigger reconnect via heartbeat watchdog when no messages arrive within timeout', async () => {
      vi.useFakeTimers();
      await service.connect();
      const options = fetchEventSourceMock.mock.calls[0][1];
      await options.onopen!({
        ok: true,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'text/event-stream' : null),
        },
      } as unknown as Response);

      expect(service.isConnected()).toBe(true);

      // Advance past HEARTBEAT_TIMEOUT_MS (7000ms) + first reconnect backoff (1000ms)
      await vi.advanceTimersByTimeAsync(8000);

      expect(fetchEventSourceMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('browser network & visibility events', () => {
    it('should set isConnected to false, emit onDisconnect on window offline and reconnect on window online', async () => {
      let disconnectEvents = 0;
      const sub = service.onDisconnect().subscribe(() => {
        disconnectEvents += 1;
      });

      await service.connect();
      service.isConnected.set(true);

      window.dispatchEvent(new Event('offline'));
      expect(service.isConnected()).toBe(false);
      expect(service.connectionFailed()).toBe(true);
      expect(disconnectEvents).toBe(1);

      fetchEventSourceMock.mockClear();
      window.dispatchEvent(new Event('online'));
      await Promise.resolve();

      expect(fetchEventSourceMock).toHaveBeenCalledTimes(1);
      sub.unsubscribe();
    });

    it('should force reconnect when tab returns to visible after being hidden long enough', async () => {
      vi.useFakeTimers();
      await service.connect();
      service.isConnected.set(true);
      fetchEventSourceMock.mockClear();

      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));

      vi.advanceTimersByTime(11000);

      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();

      expect(fetchEventSourceMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('onEvent', () => {
    it('should emit data when domain and event match incoming message', async () => {
      await service.connect();
      const options = fetchEventSourceMock.mock.calls[0][1];

      let receivedData: { name: string; state: boolean } | undefined;
      const sub = service
        .onEvent<{ name: string; state: boolean }>('lights', 'light_updated')
        .subscribe((data) => {
          receivedData = data;
        });

      const messagePayload = {
        domain: 'lights',
        event: 'light_updated',
        data: { name: 'living_room', state: true },
        timestamp: '2026-11-14T19:00:00.000Z',
      };

      options.onmessage!({
        id: '1',
        event: 'lights:light_updated',
        data: JSON.stringify(messagePayload),
      });

      expect(receivedData).toEqual({ name: 'living_room', state: true });
      sub.unsubscribe();
    });

    it('should not emit data when incoming message has different domain', async () => {
      await service.connect();
      const options = fetchEventSourceMock.mock.calls[0][1];

      let receivedData: unknown = undefined;
      const sub = service.onEvent('lights', 'light_updated').subscribe((data) => {
        receivedData = data;
      });

      options.onmessage!({
        id: '2',
        event: 'air:air_updated',
        data: JSON.stringify({
          domain: 'air',
          event: 'air_updated',
          data: { temp: 22 },
          timestamp: '2026-11-14T19:00:00.000Z',
        }),
      });

      expect(receivedData).toBeUndefined();
      sub.unsubscribe();
    });

    it('should not emit data when incoming message has different event name', async () => {
      await service.connect();
      const options = fetchEventSourceMock.mock.calls[0][1];

      let receivedData: unknown = undefined;
      const sub = service.onEvent('lights', 'light_updated').subscribe((data) => {
        receivedData = data;
      });

      options.onmessage!({
        id: '3',
        event: 'lights:scene_activated',
        data: JSON.stringify({
          domain: 'lights',
          event: 'scene_activated',
          data: { sceneId: '123' },
          timestamp: '2026-11-14T19:00:00.000Z',
        }),
      });

      expect(receivedData).toBeUndefined();
      sub.unsubscribe();
    });

    it('should handle messages with empty data gracefully', async () => {
      await service.connect();
      const options = fetchEventSourceMock.mock.calls[0][1];

      expect(() => {
        options.onmessage!({ id: '4', event: '', data: '' });
      }).not.toThrow();
    });

    it('should log warning when incoming message has invalid JSON data', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await service.connect();
      const options = fetchEventSourceMock.mock.calls[0][1];

      options.onmessage!({ id: '5', event: 'test', data: 'INVALID_JSON' });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SseService] Failed to parse SSE message:',
        expect.any(Error),
      );
    });
  });

  describe('disconnect', () => {
    it('should abort active fetch controller, cancel scheduled reconnect and set isConnected to false', async () => {
      vi.useFakeTimers();
      fetchEventSourceMock.mockRejectedValueOnce(new Error('Drop'));

      await service.connect();
      service.disconnect();

      await vi.advanceTimersByTimeAsync(5000);
      expect(fetchEventSourceMock).toHaveBeenCalledTimes(1);
      expect(service.isConnected()).toBe(false);
    });

    it('should abort active controller when connected', async () => {
      await service.connect();
      service.isConnected.set(true);

      const options = fetchEventSourceMock.mock.calls[0][1];
      const abortSignal = options.signal as AbortSignal;
      expect(abortSignal.aborted).toBe(false);

      service.disconnect();

      expect(abortSignal.aborted).toBe(true);
      expect(service.isConnected()).toBe(false);
    });

    it('should handle disconnect when no active connection exists', () => {
      expect(() => service.disconnect()).not.toThrow();
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('ngOnDestroy', () => {
    it('should call disconnect when service is destroyed', () => {
      const disconnectSpy = vi.spyOn(service, 'disconnect');

      service.ngOnDestroy();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
    });
  });
});
