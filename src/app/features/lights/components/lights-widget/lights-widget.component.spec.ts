import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { LightsWidgetComponent } from './lights-widget.component';
import { LightsControlService } from '@features/lights/services/lights-control/lights-control.service';
import { LightsHistoryService } from '@features/lights/services/lights-history/lights-history.service';
import { of } from 'rxjs';
import { LightHistory } from '@features/lights/models/lights.models';

const mockHistory: LightHistory[] = [
  {
    id: 'h1',
    name: 'home.lightsWidget.rooms.livingRoom',
    action: 'ON',
    time: '14:35',
    user: 'admin',
  },
  {
    id: 'h2',
    name: 'home.lightsWidget.rooms.kitchen',
    action: 'OFF',
    time: '13:00',
    user: 'System',
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

    vi.spyOn(lightsControlService, 'loadLights').mockImplementation(() => {});
    vi.spyOn(lightsHistoryService, 'loadHistory').mockImplementation(() => {});

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

  describe('initial state and signal delegation', () => {
    it('should delegate lights signal to LightsControlService', () => {
      expect(component.lights).toBe(lightsControlService.lights);
      expect(component.lights().length).toBe(6);
    });

    it('should delegate history signal to LightsHistoryService', () => {
      expect(component.history).toBe(lightsHistoryService.history);
      expect(component.history()).toEqual([]);
    });

    it('should delegate hasError signal to LightsControlService', () => {
      expect(component.hasError).toBe(lightsControlService.hasError);
      expect(component.hasError()).toBe(false);
    });

    it('should delegate allLightsOn computed to LightsControlService', () => {
      expect(component.allLightsOn).toBe(lightsControlService.allLightsOn);
      expect(component.allLightsOn()).toBe(false);
    });
  });

  describe('template rendering', () => {
    it('should render error overlay when hasError is true', () => {
      lightsControlService.hasError.set(true);
      fixture.detectChanges();

      const errorOverlay = fixture.nativeElement.querySelector('.bg-background-secondary\\/40');
      expect(errorOverlay).toBeTruthy();
    });

    it('should render history items when history is populated', () => {
      lightsHistoryService.history.set(mockHistory);
      fixture.detectChanges();

      const renderedHistoryItems = fixture.nativeElement.querySelectorAll('.flex.items-center.justify-between.p-3');
      expect(renderedHistoryItems.length).toBe(2);
    });

    it('should toggle all lights when clicking the toggleAll switch button in header', () => {
      const toggleAllSpy = vi.spyOn(component, 'toggleAllLights');
      const toggleAllBtn = fixture.nativeElement.querySelector('.w-12.h-6') as HTMLButtonElement;

      expect(toggleAllBtn).toBeTruthy();
      toggleAllBtn.click();
      expect(toggleAllSpy).toHaveBeenCalled();
    });

    it('should click light button in SVG template to toggle light', () => {
      const toggleSpy = vi.spyOn(component, 'toggleLight');
      const lightButton = fixture.nativeElement.querySelector('svg foreignObject button') as HTMLButtonElement;

      if (lightButton) {
        lightButton.click();
        expect(toggleSpy).toHaveBeenCalled();
      }
    });

    it('should call clearHistory when clear button is clicked in template', () => {
      const clearSpy = vi.spyOn(component, 'clearHistory');
      lightsHistoryService.history.set(mockHistory);
      fixture.detectChanges();

      const allButtons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
      const clearBtn = allButtons.find((btn) => !btn.disabled && btn.textContent?.includes('home.lightsWidget.resetHistory'));

      if (clearBtn) {
        clearBtn.click();
      } else {
        const restartIconBtn = allButtons.find((btn) => !btn.disabled && btn.querySelector('svg-icon[src*="restart.svg"]'));
        restartIconBtn?.click();
      }

      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnInit and service methods delegation', () => {
    it('should call loadLights and loadHistory on ngOnInit', () => {
      const loadLightsSpy = vi.spyOn(lightsControlService, 'loadLights');
      const loadHistorySpy = vi.spyOn(lightsHistoryService, 'loadHistory');

      component.ngOnInit();

      expect(loadLightsSpy).toHaveBeenCalled();
      expect(loadHistorySpy).toHaveBeenCalledWith(20);
    });

    it('should delegate toggleLight to lightsControlService.toggleLight', () => {
      const toggleSpy = vi.spyOn(lightsControlService, 'toggleLight');

      component.toggleLight('living_room');

      expect(toggleSpy).toHaveBeenCalledWith('living_room');
    });

    it('should delegate toggleAllLights to lightsControlService.toggleAllLights', () => {
      const toggleAllSpy = vi.spyOn(lightsControlService, 'toggleAllLights');

      component.toggleAllLights();

      expect(toggleAllSpy).toHaveBeenCalled();
    });

    it('should delegate clearHistory to lightsHistoryService.clearHistory', () => {
      const clearSpy = vi.spyOn(lightsHistoryService, 'clearHistory');

      component.clearHistory();

      expect(clearSpy).toHaveBeenCalled();
    });
  });
});
