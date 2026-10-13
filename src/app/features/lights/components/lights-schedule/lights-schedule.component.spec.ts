import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { of, throwError } from 'rxjs';
import { LightsScheduleComponent } from './lights-schedule.component';
import { LightsScheduleService } from '@features/lights/services/lights-schedule/lights-schedule.service';

describe('LightsScheduleComponent', () => {
  let component: LightsScheduleComponent;
  let fixture: ComponentFixture<LightsScheduleComponent>;
  let lightsScheduleService: LightsScheduleService;

  beforeEach(async () => {
    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [LightsScheduleComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    lightsScheduleService = TestBed.inject(LightsScheduleService);
    vi.spyOn(lightsScheduleService, 'loadRules').mockImplementation(() => {});

    fixture = TestBed.createComponent(LightsScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadRules on ngOnInit', () => {
    expect(lightsScheduleService.loadRules).toHaveBeenCalled();
  });

  describe('signal delegation to service', () => {
    it('should delegate schedule signal', () => {
      expect(component.schedule).toBe(lightsScheduleService.schedule);
    });

    it('should delegate isLoading signal', () => {
      expect(component.isLoading).toBe(lightsScheduleService.isLoading);
    });

    it('should delegate hasError signal', () => {
      expect(component.hasError).toBe(lightsScheduleService.hasError);
    });

    it('should delegate empty signal and evaluate emptiness correctly', () => {
      expect(component.empty).toBe(lightsScheduleService.empty);
      expect(component.empty()).toBe(true);

      lightsScheduleService.schedule.set([
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
      expect(component.empty()).toBe(false);
    });
  });

  describe('format and duration', () => {
    it('should format decimal hours to HH:MM format', () => {
      expect(component.format(18.5)).toBe('18:30');
      expect(component.format(9.25)).toBe('09:15');
      expect(component.format(0)).toBe('00:00');
    });

    it('should compute duration correctly for same-day window', () => {
      component.start.set(18);
      component.end.set(23);
      expect(component.duration()).toBe('5h');

      component.start.set(18.5);
      component.end.set(20);
      expect(component.duration()).toBe('1h 30m');
    });

    it('should compute duration correctly when window crosses midnight', () => {
      component.start.set(22);
      component.end.set(2);
      expect(component.duration()).toBe('4h');
    });
  });

  describe('toggleAddSchedule and resetForm', () => {
    it('should toggle enableAddSchedule flag', () => {
      expect(component.enableAddSchedule()).toBe(false);

      component.toggleAddSchedule();
      expect(component.enableAddSchedule()).toBe(true);

      component.toggleAddSchedule();
      expect(component.enableAddSchedule()).toBe(false);
    });

    it('should reset form fields when toggleAddSchedule closes the form', () => {
      component.enableAddSchedule.set(true);
      component.ruleName.set('Test Rule');
      component.selectedDays.set([1, 2]);

      component.toggleAddSchedule();

      expect(component.enableAddSchedule()).toBe(false);
      expect(component.ruleName()).toBe('');
      expect(component.selectedDays()).toEqual([]);
      expect(component.selectedRooms()).toEqual(['entireHouse']);
    });
  });

  describe('day selection', () => {
    it('should toggle days in selectedDays signal', () => {
      expect(component.selectedDays()).toEqual([]);

      component.toggleDay(0);
      expect(component.isDaySelected(0)).toBe(true);
      expect(component.selectedDays()).toEqual([0]);

      component.toggleDay(0);
      expect(component.isDaySelected(0)).toBe(false);
      expect(component.selectedDays()).toEqual([]);
    });
  });

  describe('room selection', () => {
    it('should select room and remove entireHouse', () => {
      component.toggleRoom('living_room');
      expect(component.selectedRooms()).toEqual(['living_room']);
      expect(component.isRoomSelected('living_room')).toBe(true);
      expect(component.isRoomSelected('entireHouse')).toBe(false);
    });

    it('should switch back to entireHouse when entireHouse is selected', () => {
      component.toggleRoom('living_room');
      component.toggleRoom('entireHouse');

      expect(component.selectedRooms()).toEqual(['entireHouse']);
      expect(component.isRoomSelected('entireHouse')).toBe(true);
    });

    it('should default to entireHouse when all individual rooms are deselected', () => {
      component.toggleRoom('living_room');
      component.toggleRoom('living_room'); // toggle off

      expect(component.selectedRooms()).toEqual(['entireHouse']);
    });
  });

  describe('canSave computed signal', () => {
    it('should return false when name is empty', () => {
      component.ruleName.set('');
      component.selectedDays.set([0]);
      expect(component.canSave()).toBe(false);
    });

    it('should return false when no days are selected', () => {
      component.ruleName.set('Rule');
      component.selectedDays.set([]);
      expect(component.canSave()).toBe(false);
    });

    it('should return true when name is non-empty and at least one day is selected', () => {
      component.ruleName.set('Night');
      component.selectedDays.set([1]);
      expect(component.canSave()).toBe(true);
    });
  });

  describe('saveRule', () => {
    it('should not call createRule if canSave is false', () => {
      const createRuleSpy = vi.spyOn(lightsScheduleService, 'createRule');
      component.ruleName.set('');

      component.saveRule();

      expect(createRuleSpy).not.toHaveBeenCalled();
    });

    it('should call createRule with form values, reset form, and close view on success', () => {
      const mockCreatedRule = {
        _id: 'r_new',
        name: 'Evening',
        days: [1, 2],
        startTime: '18:00',
        endTime: '23:00',
        rooms: ['entireHouse'],
        active: true,
      };

      vi.spyOn(lightsScheduleService, 'createRule').mockReturnValue(of(mockCreatedRule));

      component.enableAddSchedule.set(true);
      component.ruleName.set('Evening');
      component.selectedDays.set([1, 2]);
      component.start.set(18);
      component.end.set(23);

      component.saveRule();

      expect(lightsScheduleService.createRule).toHaveBeenCalledWith({
        name: 'Evening',
        days: [1, 2],
        startTime: '18:00',
        endTime: '23:00',
        rooms: ['entireHouse'],
      });

      expect(component.enableAddSchedule()).toBe(false);
      expect(component.ruleName()).toBe('');
    });

    it('should handle error when createRule fails', () => {
      vi.spyOn(lightsScheduleService, 'createRule').mockReturnValue(
        throwError(() => new Error('Server error')),
      );

      component.enableAddSchedule.set(true);
      component.ruleName.set('Evening');
      component.selectedDays.set([1]);

      component.saveRule();

      expect(component.enableAddSchedule()).toBe(true);
    });
  });

  describe('toggleRuleActive and deleteRule delegations', () => {
    it('should delegate toggleRuleActive to service', () => {
      const spy = vi.spyOn(lightsScheduleService, 'toggleRuleActive').mockImplementation(() => {});
      component.toggleRuleActive('r1', true);
      expect(spy).toHaveBeenCalledWith('r1', true);
    });

    it('should delegate deleteRule to service', () => {
      const spy = vi.spyOn(lightsScheduleService, 'deleteRule').mockImplementation(() => {});
      component.deleteRule('r1');
      expect(spy).toHaveBeenCalledWith('r1');
    });
  });

  describe('template rendering', () => {
    it('should render error overlay when hasError is true', () => {
      lightsScheduleService.hasError.set(true);
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector('.bg-background-secondary\\/40');
      expect(overlay).toBeTruthy();
    });

    it('should render form container when enableAddSchedule is true', () => {
      component.enableAddSchedule.set(true);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input[type="text"]');
      expect(input).toBeTruthy();
    });

    it('should expose roomTranslations matching ROOMS_NAMES_TRANSLATIONS', () => {
      expect(component.roomTranslations['living_room']).toBe('home.lightsWidget.rooms.livingRoom');
      expect(component.roomTranslations['boiler_room']).toBe('home.lightsWidget.rooms.boilerRoom');
    });
  });
});

