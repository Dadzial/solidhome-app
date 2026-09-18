import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { LightsWidgetComponent } from './lights-widget.component';
import { LightsControlService } from '@features/lights/services/lights-control/lights-control.service';
import { LightsHistoryService } from '@features/lights/services/lights-history/lights-history.service';
import { of, throwError } from 'rxjs';
import { LightHistoryItem, LightItem } from '@features/lights/models/lights.models';

const mockHistoryItems: LightHistoryItem[] = [
  {
    _id: 'h1',
    name: 'living_room',
    state: 1,
    createdAt: '2024-01-01T14:35:00Z',
    userId: { _id: 'u1', userName: 'admin', email: 'a@a.com' },
  },
  {
    _id: 'h2',
    name: 'kitchen',
    state: 0,
    createdAt: '2024-01-01T13:00:00Z',
    userId: null,
  },
];

describe('LightsWidgetComponent', () => {
  let component: LightsWidgetComponent;
  let fixture: ComponentFixture<LightsWidgetComponent>;
  let lightsControlService: LightsControlService;
  let lightsHistoryService: LightsHistoryService;

  beforeEach(async () => {
    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [LightsWidgetComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    lightsControlService = TestBed.inject(LightsControlService);
    lightsHistoryService = TestBed.inject(LightsHistoryService);

    vi.spyOn(lightsControlService, 'getStatus').mockReturnValue(of([]));
    vi.spyOn(lightsHistoryService, 'getHistory').mockReturnValue(of([]));

    fixture = TestBed.createComponent(LightsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have 6 lights with on=false by default', () => {
      expect(component.lights().length).toBe(6);
      expect(component.lights().every((l) => l.on === false)).toBe(true);
    });

    it('should have empty history by default', () => {
      expect(component.history()).toEqual([]);
    });

    it('should have hasError=false by default', () => {
      expect(component.hasError()).toBe(false);
    });

    it('allLightsOn should be false when all lights are off', () => {
      expect(component.allLightsOn()).toBe(false);
    });

    it('allLightsOn should be true when all lights are on', () => {
      component.lights.update((lights) => lights.map((l) => ({ ...l, on: true })));
      expect(component.allLightsOn()).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    it('should call getStatus and update lights state from API response', async () => {
      const mockItems: LightItem[] = [
        { _id: '1', name: 'living_room', state: 1 },
        { _id: '2', name: 'kitchen', state: 0 },
      ];
      vi.spyOn(lightsControlService, 'getStatus').mockReturnValue(of(mockItems));
      vi.spyOn(lightsHistoryService, 'getHistory').mockReturnValue(of([]));

      component.ngOnInit();

      const livingRoom = component.lights().find((l) => l.id === 'living_room');
      const kitchen = component.lights().find((l) => l.id === 'kitchen');
      expect(livingRoom?.on).toBe(true);
      expect(kitchen?.on).toBe(false);
    });

    it('should set hasError=true when getStatus fails', () => {
      vi.spyOn(lightsControlService, 'getStatus').mockReturnValue(throwError(() => new Error('fail')));
      vi.spyOn(lightsHistoryService, 'getHistory').mockReturnValue(of([]));

      component.ngOnInit();

      expect(component.hasError()).toBe(true);
    });
  });

  describe('loadHistory', () => {
    it('should map LightHistoryItem[] to LightHistory[] and set history signal', () => {
      vi.spyOn(lightsHistoryService, 'getHistory').mockReturnValue(of(mockHistoryItems));

      component.loadHistory();

      const history = component.history();
      expect(history.length).toBe(2);
      expect(history[0].action).toBe('ON');
      expect(history[0].user).toBe('admin');
      expect(history[0].name).toBe('home.lightsWidget.rooms.livingRoom');
    });

    it('should use "System" as user when userId is null', () => {
      vi.spyOn(lightsHistoryService, 'getHistory').mockReturnValue(of(mockHistoryItems));

      component.loadHistory();

      const kitchenEntry = component.history().find((h) => h.action === 'OFF');
      expect(kitchenEntry?.user).toBe('System');
    });

    it('should keep original name when not found in ROOMS_NAMES_TRANSLATIONS', () => {
      const unknownItem: LightHistoryItem[] = [
        { _id: 'h3', name: 'unknown_room', state: 1, createdAt: '2024-01-01T10:00:00Z', userId: null },
      ];
      vi.spyOn(lightsHistoryService, 'getHistory').mockReturnValue(of(unknownItem));

      component.loadHistory();

      expect(component.history()[0].name).toBe('unknown_room');
    });
  });

  describe('toggleLight', () => {
    it('should optimistically toggle light on and send updateStatus request', () => {
      const updateSpy = vi.spyOn(lightsControlService, 'updateStatus').mockReturnValue(
        of({ _id: '1', name: 'living_room', state: 1 }),
      );
      vi.spyOn(lightsHistoryService, 'getHistory').mockReturnValue(of([]));

      const before = component.lights().find((l) => l.id === 'living_room')?.on;
      expect(before).toBe(false);

      component.toggleLight('living_room');

      const after = component.lights().find((l) => l.id === 'living_room')?.on;
      expect(after).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith('living_room', true);
    });

    it('should revert light state and set hasError=true when updateStatus fails', () => {
      vi.spyOn(lightsControlService, 'updateStatus').mockReturnValue(throwError(() => new Error('fail')));

      component.toggleLight('kitchen');

      const kitchenState = component.lights().find((l) => l.id === 'kitchen')?.on;
      expect(kitchenState).toBe(false);
      expect(component.hasError()).toBe(true);
    });
  });

  describe('toggleAllLights', () => {
    it('should turn all lights on when they are all off', () => {
      vi.spyOn(lightsControlService, 'updateStatus').mockReturnValue(
        of({ _id: '1', name: 'living_room', state: 1 }),
      );
      vi.spyOn(lightsHistoryService, 'getHistory').mockReturnValue(of([]));

      component.toggleAllLights();

      expect(component.lights().every((l) => l.on)).toBe(true);
    });

    it('should turn all lights off when they are all on', () => {
      component.lights.update((lights) => lights.map((l) => ({ ...l, on: true })));
      vi.spyOn(lightsControlService, 'updateStatus').mockReturnValue(
        of({ _id: '1', name: 'living_room', state: 0 }),
      );
      vi.spyOn(lightsHistoryService, 'getHistory').mockReturnValue(of([]));

      component.toggleAllLights();

      expect(component.lights().every((l) => l.on)).toBe(false);
    });

    it('should revert all lights and set hasError=true when forkJoin fails', () => {
      const originalLights = component.lights();
      vi.spyOn(lightsControlService, 'updateStatus').mockReturnValue(throwError(() => new Error('fail')));

      component.toggleAllLights();

      expect(component.lights()).toEqual(originalLights);
      expect(component.hasError()).toBe(true);
    });
  });

  describe('clearHistory', () => {
    it('should clear history signal after successful resetHistory', () => {
      vi.spyOn(lightsHistoryService, 'getHistory').mockReturnValue(of(mockHistoryItems));
      component.loadHistory();
      expect(component.history().length).toBe(2);

      vi.spyOn(lightsHistoryService, 'resetHistory').mockReturnValue(
        of({ message: 'History cleared', deletedCount: 2 }),
      );

      component.clearHistory();

      expect(component.history()).toEqual([]);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject on destroy', () => {
      const nextSpy = vi.spyOn((component as any).destroy$, 'next');
      const completeSpy = vi.spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
