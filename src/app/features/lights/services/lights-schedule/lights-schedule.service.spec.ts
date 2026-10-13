import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LightsScheduleService } from './lights-schedule.service';
import {
  LightScheduleRuleItem,
  CreateScheduleRulePayload,
  DeleteScheduleRuleResponse,
} from '@features/lights/models/lights.models';
import { environment } from '@environments/environment';

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
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/lights`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        LightsScheduleService,
      ],
    });

    service = TestBed.inject(LightsScheduleService);
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
    it('should initialize schedule with an empty array', () => {
      expect(service.schedule()).toEqual([]);
    });

    it('should initialize isLoading with false', () => {
      expect(service.isLoading()).toBe(false);
    });

    it('should initialize hasError with false', () => {
      expect(service.hasError()).toBe(false);
    });
  });

  describe('loadRules', () => {
    it('should fetch rules, map _id to id, and update schedule signal on success', () => {
      service.loadRules();

      expect(service.isLoading()).toBe(true);

      const req = httpMock.expectOne(`${apiUrl}/rules`);
      expect(req.request.method).toBe('GET');
      req.flush([mockRuleItem]);

      expect(service.isLoading()).toBe(false);
      expect(service.hasError()).toBe(false);
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

    it('should set hasError to true and isLoading to false on failure', () => {
      service.loadRules();

      const req = httpMock.expectOne(`${apiUrl}/rules`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });

      expect(service.isLoading()).toBe(false);
      expect(service.hasError()).toBe(true);
      expect(service.schedule()).toEqual([]);
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

      service.createRule(payload).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/rules`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);

      req.flush({ ...payload, _id: 'r2', active: true });

      expect(loadRulesSpy).toHaveBeenCalled();
      expect(service.hasError()).toBe(false);
    });

    it('should set hasError to true on failure', () => {
      const payload: CreateScheduleRulePayload = {
        name: 'Night lights',
        days: [5],
        startTime: '23:00',
        endTime: '06:00',
        rooms: ['entireHouse'],
      };

      service.createRule(payload).subscribe({
        next: () => {},
        error: () => {},
      });

      const req = httpMock.expectOne(`${apiUrl}/rules`);
      req.flush('Failed', { status: 400, statusText: 'Bad Request' });

      expect(service.hasError()).toBe(true);
    });
  });

  describe('toggleRuleActive', () => {
    beforeEach(() => {
      // Seed schedule signal with an initial rule
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
      service.toggleRuleActive('r1');

      // Optimistic update
      expect(service.schedule()[0].active).toBe(false);

      const req = httpMock.expectOne(`${apiUrl}/rules/r1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ active: false });

      req.flush({ ...mockRuleItem, active: false });

      expect(service.schedule()[0].active).toBe(false);
      expect(service.hasError()).toBe(false);
    });

    it('should respect explicitly provided active status', () => {
      service.toggleRuleActive('r1', true);

      expect(service.schedule()[0].active).toBe(true);

      const req = httpMock.expectOne(`${apiUrl}/rules/r1`);
      expect(req.request.body).toEqual({ active: true });
      req.flush({ ...mockRuleItem, active: true });
    });

    it('should rollback to previous state and set hasError to true on failure', () => {
      service.toggleRuleActive('r1');

      expect(service.schedule()[0].active).toBe(false);

      const req = httpMock.expectOne(`${apiUrl}/rules/r1`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });

      expect(service.schedule()[0].active).toBe(true);
      expect(service.hasError()).toBe(true);
    });

    it('should do nothing if rule is not found in schedule', () => {
      service.toggleRuleActive('non-existent-id');

      httpMock.expectNone(`${apiUrl}/rules/non-existent-id`);
      expect(service.schedule().length).toBe(1);
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
      service.deleteRule('r1');

      // Optimistic delete
      expect(service.schedule()).toEqual([]);

      const req = httpMock.expectOne(`${apiUrl}/rules/r1`);
      expect(req.request.method).toBe('DELETE');

      const mockResponse: DeleteScheduleRuleResponse = { message: 'Rule deleted successfully' };
      req.flush(mockResponse);

      expect(service.schedule()).toEqual([]);
      expect(service.hasError()).toBe(false);
    });

    it('should rollback to previous state and set hasError to true on failure', () => {
      service.deleteRule('r1');

      expect(service.schedule()).toEqual([]);

      const req = httpMock.expectOne(`${apiUrl}/rules/r1`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });

      expect(service.schedule().length).toBe(1);
      expect(service.schedule()[0].id).toBe('r1');
      expect(service.hasError()).toBe(true);
    });
  });

  describe('low-level HTTP methods', () => {
    it('getRules should return Observable of rules', () => {
      let response: LightScheduleRuleItem[] | undefined;
      service.getRules().subscribe((res) => (response = res));

      const req = httpMock.expectOne(`${apiUrl}/rules`);
      expect(req.request.method).toBe('GET');
      req.flush([mockRuleItem]);

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

      let response: LightScheduleRuleItem | undefined;
      service.postRule(payload).subscribe((res) => (response = res));

      const req = httpMock.expectOne(`${apiUrl}/rules`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ ...payload, _id: 'r_test', active: true });

      expect(response?._id).toBe('r_test');
    });

    it('putRuleActive without active param should send empty body', () => {
      service.putRuleActive('r1').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/rules/r1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush(mockRuleItem);
    });

    it('deleteRuleApi should send DELETE request and return DeleteScheduleRuleResponse', () => {
      let response: DeleteScheduleRuleResponse | undefined;
      service.deleteRuleApi('r1').subscribe((res) => (response = res));

      const req = httpMock.expectOne(`${apiUrl}/rules/r1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Deleted' });

      expect(response?.message).toBe('Deleted');
    });
  });
});

