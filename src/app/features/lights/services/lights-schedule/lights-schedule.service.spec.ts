import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { LightsScheduleService } from './lights-schedule.service';
import { ApiConnectService } from '@core/services/api/api-connect.service';
import { HardwareStatusService } from '@core/services/hardware-status/hardware-status.service';
import { SseService } from '@core/services/sse/sse.service';
import {
  LightScheduleRuleItem,
  CreateScheduleRulePayload,
  DeleteScheduleRuleResponse,
} from '@features/lights/models/lights.models';
import { of, throwError, Subject } from 'rxjs';

const mockRuleItem: LightScheduleRuleItem = {
  _id: 'r1',
  name: 'Evening living room',
  days: [0, 1, 2],
  startTime: '18:00',
  endTime: '22:00',
  rooms: ['living_room'],
  active: true,
  createdAt: '2026-10-12T18:00:00Z',
};

describe('LightsScheduleService', () => {
  let service: LightsScheduleService;
  let isBoardOnlineMock: ReturnType<typeof signal<boolean>>;
  let reconnectSubject: Subject<void>;
  let disconnectSubject: Subject<void>;
  let sseServiceMock: {
    onReconnect: ReturnType<typeof vi.fn>;
    onDisconnect: ReturnType<typeof vi.fn>;
  };
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    isBoardOnlineMock = signal<boolean>(true);
    reconnectSubject = new Subject<void>();
    disconnectSubject = new Subject<void>();
    sseServiceMock = {
      onReconnect: vi.fn().mockReturnValue(reconnectSubject.asObservable()),
      onDisconnect: vi.fn().mockReturnValue(disconnectSubject.asObservable()),
    };
    apiServiceMock = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        LightsScheduleService,
        { provide: ApiConnectService, useValue: apiServiceMock },
        { provide: HardwareStatusService, useValue: { isBoardOnline: isBoardOnlineMock } },
        { provide: SseService, useValue: sseServiceMock },
      ],
    });

    service = TestBed.inject(LightsScheduleService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial signals state', () => {
    it('should initialize schedule with an empty array', () => {
      expect(service.schedule()).toEqual([]);
    });

    it('should initialize errorMessage with null', () => {
      expect(service.errorMessage()).toBeNull();
    });

    it('should compute empty as true when schedule is empty and false when schedule has items', () => {
      expect(service.empty()).toBe(true);

      service.schedule.set([
        {
          id: 'r1',
          name: 'Test',
          days: [1],
          startTime: '10:00',
          endTime: '12:00',
          rooms: ['entireHouse'],
          active: true,
        },
      ]);
      expect(service.empty()).toBe(false);
    });
  });

  describe('loadRules', () => {
    it('should fetch rules, map _id to id, and update schedule signal on success', () => {
      apiServiceMock.get.mockReturnValue(of([mockRuleItem]));

      service.loadRules();

      expect(apiServiceMock.get).toHaveBeenCalledWith('lights/rules');
      expect(service.errorMessage()).toBeNull();
      expect(service.schedule()).toEqual([
        {
          id: 'r1',
          name: 'Evening living room',
          days: [0, 1, 2],
          startTime: '18:00',
          endTime: '22:00',
          rooms: ['living_room'],
          active: true,
          createdAt: '2026-10-12T18:00:00Z',
        },
      ]);
    });

    it('should set errorMessage on failure', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Server error');
      apiServiceMock.get.mockReturnValue(throwError(() => mockError));

      service.loadRules();

      expect(apiServiceMock.get).toHaveBeenCalledWith('lights/rules');
      expect(service.errorMessage()).toBe('apiErrors.server');
      expect(service.schedule()).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('createRule', () => {
    it('should send POST request and reload rules on success', () => {
      const payload: CreateScheduleRulePayload = {
        name: 'Night lights',
        days: [5, 6],
        startTime: '23:00',
        endTime: '06:00',
        rooms: ['entireHouse'],
      };

      const loadRulesSpy = vi.spyOn(service, 'loadRules').mockImplementation(() => {});
      apiServiceMock.post.mockReturnValue(of({ ...payload, _id: 'r2', active: true }));

      service.createRule(payload).subscribe();

      expect(apiServiceMock.post).toHaveBeenCalledWith('lights/rules', payload);
      expect(loadRulesSpy).toHaveBeenCalled();
      expect(service.errorMessage()).toBeNull();
    });

    it('should deactivate the rule immediately via putRuleActive when hardware is offline', () => {
      isBoardOnlineMock.set(false);
      const payload: CreateScheduleRulePayload = {
        name: 'Night lights',
        days: [5, 6],
        startTime: '23:00',
        endTime: '06:00',
        rooms: ['entireHouse'],
      };

      const loadRulesSpy = vi.spyOn(service, 'loadRules').mockImplementation(() => {});
      apiServiceMock.post.mockReturnValue(of({ ...payload, _id: 'r2', active: true }));
      apiServiceMock.put.mockReturnValue(of({ ...payload, _id: 'r2', active: false }));

      let resultActive: boolean | undefined;
      service.createRule(payload).subscribe({
        next: (rule) => {
          resultActive = rule.active;
        },
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('lights/rules', payload);
      expect(apiServiceMock.put).toHaveBeenCalledWith('lights/rules/r2', { active: false });
      expect(resultActive).toBe(false);
      expect(loadRulesSpy).toHaveBeenCalled();
      expect(service.errorMessage()).toBeNull();
    });

    it('should set errorMessage on failure', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const payload: CreateScheduleRulePayload = {
        name: 'Night lights',
        days: [5],
        startTime: '23:00',
        endTime: '06:00',
        rooms: ['entireHouse'],
      };
      const mockError = new Error('Bad Request');
      apiServiceMock.post.mockReturnValue(throwError(() => mockError));

      service.createRule(payload).subscribe({
        next: () => {},
        error: () => {},
      });

      expect(apiServiceMock.post).toHaveBeenCalledWith('lights/rules', payload);
      expect(service.errorMessage()).toBe('apiErrors.server');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('toggleRuleActive', () => {
    beforeEach(() => {
      service.schedule.set([
        {
          id: 'r1',
          name: 'Evening living room',
          days: [0, 1, 2],
          startTime: '18:00',
          endTime: '22:00',
          rooms: ['living_room'],
          active: true,
        },
      ]);
    });

    it('should optimistically invert active status and send PUT request', () => {
      apiServiceMock.put.mockReturnValue(of({ ...mockRuleItem, active: false }));

      service.toggleRuleActive('r1');

      expect(apiServiceMock.put).toHaveBeenCalledWith('lights/rules/r1', { active: false });
      expect(service.schedule()[0].active).toBe(false);
      expect(service.errorMessage()).toBeNull();
    });

    it('should respect explicitly provided active status', () => {
      apiServiceMock.put.mockReturnValue(of({ ...mockRuleItem, active: true }));

      service.toggleRuleActive('r1', true);

      expect(service.schedule()[0].active).toBe(true);
      expect(apiServiceMock.put).toHaveBeenCalledWith('lights/rules/r1', { active: true });
    });

    it('should rollback to previous state and set errorMessage on failure', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Server error');
      apiServiceMock.put.mockReturnValue(throwError(() => mockError));

      service.toggleRuleActive('r1');

      expect(apiServiceMock.put).toHaveBeenCalledWith('lights/rules/r1', { active: false });
      expect(service.schedule()[0].active).toBe(true);
      expect(service.errorMessage()).toBe('apiErrors.server');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should do nothing if rule is not found in schedule', () => {
      service.toggleRuleActive('non-existent-id');

      expect(apiServiceMock.put).not.toHaveBeenCalled();
      expect(service.schedule().length).toBe(1);
    });

    it('should not toggle rule active state when hardware is offline', () => {
      isBoardOnlineMock.set(false);

      service.toggleRuleActive('r1');

      expect(apiServiceMock.put).not.toHaveBeenCalled();
      expect(service.schedule()[0].active).toBe(true);
    });
  });

  describe('deleteRule', () => {
    beforeEach(() => {
      service.schedule.set([
        {
          id: 'r1',
          name: 'Evening living room',
          days: [0, 1, 2],
          startTime: '18:00',
          endTime: '22:00',
          rooms: ['living_room'],
          active: true,
        },
      ]);
    });

    it('should optimistically remove rule and send DELETE request', () => {
      const mockResponse: DeleteScheduleRuleResponse = { message: 'Rule deleted successfully' };
      apiServiceMock.delete.mockReturnValue(of(mockResponse));

      service.deleteRule('r1');

      expect(apiServiceMock.delete).toHaveBeenCalledWith('lights/rules/r1');
      expect(service.schedule()).toEqual([]);
      expect(service.errorMessage()).toBeNull();
    });

    it('should rollback to previous state and set errorMessage on failure', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Server error');
      apiServiceMock.delete.mockReturnValue(throwError(() => mockError));

      service.deleteRule('r1');

      expect(apiServiceMock.delete).toHaveBeenCalledWith('lights/rules/r1');
      expect(service.schedule().length).toBe(1);
      expect(service.schedule()[0].id).toBe('r1');
      expect(service.errorMessage()).toBe('apiErrors.server');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('low-level HTTP methods', () => {
    it('getRules should return Observable of rules', () => {
      apiServiceMock.get.mockReturnValue(of([mockRuleItem]));

      let response: LightScheduleRuleItem[] | undefined;
      service.getRules().subscribe((res) => (response = res));

      expect(apiServiceMock.get).toHaveBeenCalledWith('lights/rules');
      expect(response).toEqual([mockRuleItem]);
    });

    it('postRule should send payload and return created rule', () => {
      const payload: CreateScheduleRulePayload = {
        name: 'Test',
        days: [1],
        startTime: '10:00',
        endTime: '12:00',
        rooms: ['kitchen'],
      };
      apiServiceMock.post.mockReturnValue(of({ ...payload, _id: 'r_test', active: true }));

      let response: LightScheduleRuleItem | undefined;
      service.postRule(payload).subscribe((res) => (response = res));

      expect(apiServiceMock.post).toHaveBeenCalledWith('lights/rules', payload);
      expect(response?._id).toBe('r_test');
    });

    it('putRuleActive without active param should send empty body', () => {
      apiServiceMock.put.mockReturnValue(of(mockRuleItem));

      service.putRuleActive('r1').subscribe();

      expect(apiServiceMock.put).toHaveBeenCalledWith('lights/rules/r1', {});
    });

    it('deleteRuleApi should send DELETE request and return DeleteScheduleRuleResponse', () => {
      const mockResponse: DeleteScheduleRuleResponse = { message: 'Deleted' };
      apiServiceMock.delete.mockReturnValue(of(mockResponse));

      let response: DeleteScheduleRuleResponse | undefined;
      service.deleteRuleApi('r1').subscribe((res) => (response = res));

      expect(apiServiceMock.delete).toHaveBeenCalledWith('lights/rules/r1');
      expect(response?.message).toBe('Deleted');
    });
  });

  describe('listenToSseUpdates', () => {
    it('should set server errorMessage when SSE disconnects while online', () => {
      const onLineSpy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
      disconnectSubject.next();
      expect(service.errorMessage()).toBe('apiErrors.server');
      onLineSpy.mockRestore();
    });

    it('should set network errorMessage when SSE disconnects while offline', () => {
      const onLineSpy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
      disconnectSubject.next();
      expect(service.errorMessage()).toBe('apiErrors.network');
      onLineSpy.mockRestore();
    });

    it('should reload rules when SSE reconnects', () => {
      apiServiceMock.get.mockReturnValue(of([mockRuleItem]));

      reconnectSubject.next();

      expect(apiServiceMock.get).toHaveBeenCalledWith('lights/rules');
      expect(service.schedule()).toHaveLength(1);
      expect(service.errorMessage()).toBeNull();
    });
  });
});
