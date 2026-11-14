import { TestBed } from '@angular/core/testing';
import { SseService } from './sse.service';
import { LoginService } from '@features/auth/services/login/login.service';
import { environment } from '@environments/environment';
import * as fetchModule from '@microsoft/fetch-event-source';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: vi.fn(),
}));

describe('SseService', () => {
  let service: SseService;
  let loginServiceMock: {
    getAccessToken: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.spyOn(fetchModule, 'fetchEventSource').mockImplementation(vi.fn());

    loginServiceMock = {
      getAccessToken: vi.fn().mockReturnValue('mock-jwt-token'),
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
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.disconnect();
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

      expect(fetchEventSource).not.toHaveBeenCalled();
      expect(service.isConnected()).toBe(false);
    });

    it('should not initiate connection when already connected', async () => {
      service.isConnected.set(true);

      await service.connect();

      expect(fetchEventSource).not.toHaveBeenCalled();
    });

    it('should call fetchEventSource with correct endpoint, headers and signal', async () => {
      await service.connect();

      expect(fetchEventSource).toHaveBeenCalledTimes(1);
      const [url, options] = vi.mocked(fetchEventSource).mock.calls[0];

      expect(url).toBe(`${environment.apiUrl}/events`);
      expect(options.method).toBe('GET');
      expect(options.headers).toEqual({
        Authorization: 'Bearer mock-jwt-token',
        Accept: 'text/event-stream',
      });
      expect(options.openWhenHidden).toBe(true);
      expect(options.signal).toBeInstanceOf(AbortSignal);
    });

    it('should set isConnected to true on successful onopen response', async () => {
      await service.connect();

      const options = vi.mocked(fetchEventSource).mock.calls[0][1];
      const mockResponse = {
        ok: true,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'text/event-stream' : null),
        },
      } as unknown as Response;

      await options.onopen!(mockResponse);

      expect(service.isConnected()).toBe(true);
    });

    it('should call disconnect when onopen response is not ok', async () => {
      await service.connect();

      const options = vi.mocked(fetchEventSource).mock.calls[0][1];
      const disconnectSpy = vi.spyOn(service, 'disconnect');

      const unauthorizedResponse = {
        ok: false,
        status: 401,
        headers: {
          get: () => 'text/html',
        },
      } as unknown as Response;

      await options.onopen!(unauthorizedResponse);

      expect(disconnectSpy).toHaveBeenCalled();
      expect(service.isConnected()).toBe(false);
    });

    it('should set isConnected to false on onclose', async () => {
      await service.connect();
      service.isConnected.set(true);

      const options = vi.mocked(fetchEventSource).mock.calls[0][1];
      options.onclose!();

      expect(service.isConnected()).toBe(false);
    });

    it('should set isConnected to false and log error on onerror', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await service.connect();
      service.isConnected.set(true);

      const options = vi.mocked(fetchEventSource).mock.calls[0][1];
      options.onerror!(new Error('Network error'));

      expect(service.isConnected()).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('SSE connection error:', expect.any(Error));
    });

    it('should set isConnected to false when fetchEventSource throws', async () => {
      vi.mocked(fetchEventSource).mockRejectedValueOnce(new Error('Fetch fatal error'));

      await service.connect();

      expect(service.isConnected()).toBe(false);
    });
  });

  describe('onEvent', () => {
    it('should emit data when domain and event match incoming message', async () => {
      await service.connect();
      const options = vi.mocked(fetchEventSource).mock.calls[0][1];

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
      const options = vi.mocked(fetchEventSource).mock.calls[0][1];

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
      const options = vi.mocked(fetchEventSource).mock.calls[0][1];

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
      const options = vi.mocked(fetchEventSource).mock.calls[0][1];

      expect(() => {
        options.onmessage!({ id: '4', event: '', data: '' });
      }).not.toThrow();
    });

    it('should log warning when incoming message has invalid JSON data', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await service.connect();
      const options = vi.mocked(fetchEventSource).mock.calls[0][1];

      options.onmessage!({ id: '5', event: 'test', data: 'INVALID_JSON' });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SseService] Failed to parse SSE message:',
        expect.any(Error),
      );
    });
  });

  describe('disconnect', () => {
    it('should abort active fetch controller and set isConnected to false', async () => {
      await service.connect();
      service.isConnected.set(true);

      const options = vi.mocked(fetchEventSource).mock.calls[0][1];
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
