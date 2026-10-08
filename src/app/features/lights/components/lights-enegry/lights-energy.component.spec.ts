import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { of } from 'rxjs';
import { LightsEnergyComponent } from './lights-energy.component';
import { LightsEnergyService } from '@features/lights/services/lights-energy/lights-energy.service';
import { LightEnergyData } from '@features/lights/models/lights.models';

import { TranslationsService } from '@core/services/translations/translations.service';

const mockEnergyData: LightEnergyData = {
  name: 'entireHouse',
  timeframe: 'today',
  totalKwh: 0.45,
  chartData: [0, 0.05, 0.06],
  categories: ['18:00', '18:01', '18:02'],
  topRooms: [
    { name: 'living_room', kwh: 0.25, percentage: 56 },
    { name: 'kitchen', kwh: 0.15, percentage: 33 },
    { name: 'garage', kwh: 0.05, percentage: 11 },
  ],
  lightsKwh: {
    living_room: 0.25,
    kitchen: 0.15,
    garage: 0.05,
  },
  totalHouseKwh: 0.45,
};

describe('LightsEnergyComponent', () => {
  let component: LightsEnergyComponent;
  let fixture: ComponentFixture<LightsEnergyComponent>;
  let lightsEnergyService: LightsEnergyService;
  let translationsService: TranslationsService;

  beforeEach(async () => {
    vi.useFakeTimers();

    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [LightsEnergyComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    lightsEnergyService = TestBed.inject(LightsEnergyService);
    translationsService = TestBed.inject(TranslationsService);

    vi.spyOn(translationsService, 'instant').mockImplementation((key: string) => {
      if (key === 'lightsPage.energyConsumptionKwh') {
        return 'Zużycie energii (kWh)';
      }
      return key;
    });

    vi.spyOn(lightsEnergyService, 'loadEnergyStats').mockImplementation(() => {});

    fixture = TestBed.createComponent(LightsEnergyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('lifecycle hooks', () => {
    it('should call loadEnergyStats on ngOnInit with current timeframe and room', () => {
      expect(lightsEnergyService.loadEnergyStats).toHaveBeenCalledWith('today', 'entireHouse');
    });

    it('should periodically refresh energy stats via setInterval', () => {
      vi.mocked(lightsEnergyService.loadEnergyStats).mockClear();

      vi.advanceTimersByTime(3000);
      expect(lightsEnergyService.loadEnergyStats).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(3000);
      expect(lightsEnergyService.loadEnergyStats).toHaveBeenCalledTimes(2);
    });

    it('should clear interval on ngOnDestroy', () => {
      vi.mocked(lightsEnergyService.loadEnergyStats).mockClear();

      component.ngOnDestroy();
      vi.advanceTimersByTime(6000);

      expect(lightsEnergyService.loadEnergyStats).not.toHaveBeenCalled();
    });
  });

  describe('computed signals and data mapping', () => {
    it('should compute totalKwh correctly when energyData is present and when null', () => {
      lightsEnergyService.energyData.set(null);
      expect(component.totalKwh()).toBe(0);

      lightsEnergyService.energyData.set(mockEnergyData);
      expect(component.totalKwh()).toBe(0.45);
    });

    it('should map topRooms correctly with translations', () => {
      lightsEnergyService.energyData.set(null);
      expect(component.topRooms()).toEqual([]);

      lightsEnergyService.energyData.set(mockEnergyData);
      const topRooms = component.topRooms();
      expect(topRooms).toHaveLength(3);
      expect(topRooms[0].name).toBe('living_room');
      expect(topRooms[0].translationKey).toBe('home.lightsWidget.rooms.livingRoom');
      expect(topRooms[0].percentage).toBe(56);
      expect(topRooms[0].kwh).toBe(0.25);
    });

    it('should compute chartSeries from chartData and categories', () => {
      lightsEnergyService.energyData.set(mockEnergyData);

      const series = component.chartSeries();
      expect(series).toHaveLength(1);
      expect(series[0].name).toBe('Zużycie energii (kWh)');
      expect(series[0].data).toEqual([
        { x: '18:00', y: 0 },
        { x: '18:01', y: 0.05 },
        { x: '18:02', y: 0.06 },
      ]);
    });

    it('should translate categories correctly for today, week and month', () => {
      // today: uses API categories
      lightsEnergyService.currentTimeframe.set('today');
      lightsEnergyService.energyData.set(mockEnergyData);
      expect(component.translatedCategories()).toEqual(['18:00', '18:01', '18:02']);

      // week: uses localized weekdays based on chartData length
      lightsEnergyService.currentTimeframe.set('week');
      lightsEnergyService.energyData.set({
        ...mockEnergyData,
        chartData: [0.1, 0.2, 0.3],
      });
      translationsService.currentLang.set('pl');
      expect(component.translatedCategories()).toEqual(['Pn', 'Wt', 'Śr']);

      translationsService.currentLang.set('en');
      expect(component.translatedCategories()).toEqual(['Mon', 'Tue', 'Wed']);

      // month: uses localized week labels
      lightsEnergyService.currentTimeframe.set('month');
      lightsEnergyService.energyData.set({
        ...mockEnergyData,
        chartData: [1.2, 1.5],
      });
      translationsService.currentLang.set('pl');
      expect(component.translatedCategories()).toEqual(['Tydz 1', 'Tydz 2']);

      translationsService.currentLang.set('en');
      expect(component.translatedCategories()).toEqual(['Wk 1', 'Wk 2']);
    });

    it('should return correct label keys for selectedTimeframeLabel', () => {
      lightsEnergyService.currentTimeframe.set('today');
      expect(component.selectedTimeframeLabel()).toBe('lightsPage.today');

      lightsEnergyService.currentTimeframe.set('week');
      expect(component.selectedTimeframeLabel()).toBe('lightsPage.week');

      lightsEnergyService.currentTimeframe.set('month');
      expect(component.selectedTimeframeLabel()).toBe('lightsPage.month');
    });

    it('should return correct label keys for selectedRoomLabel', () => {
      lightsEnergyService.currentRoom.set('entireHouse');
      expect(component.selectedRoomLabel()).toBe('lightsPage.entireHouse');

      lightsEnergyService.currentRoom.set('kitchen');
      expect(component.selectedRoomLabel()).toBe('home.lightsWidget.rooms.kitchen');
    });
  });

  describe('yaxisConfig dynamic scaling', () => {
    it('should use 0.25 max for today when entireHouse is selected', () => {
      lightsEnergyService.currentTimeframe.set('today');
      lightsEnergyService.currentRoom.set('entireHouse');

      const yaxis = component.yaxisConfig();
      expect(yaxis.max).toBe(0.25);
    });

    it('should use 0.08 max for today when a single room is selected', () => {
      lightsEnergyService.currentTimeframe.set('today');
      lightsEnergyService.currentRoom.set('living_room');

      const yaxis = component.yaxisConfig();
      expect(yaxis.max).toBe(0.08);
    });

    it('should scale max for week and month timeframes correctly', () => {
      lightsEnergyService.currentTimeframe.set('week');
      lightsEnergyService.currentRoom.set('entireHouse');
      expect(component.yaxisConfig().max).toBe(3.0);

      lightsEnergyService.currentRoom.set('garage');
      expect(component.yaxisConfig().max).toBe(1.0);

      lightsEnergyService.currentTimeframe.set('month');
      lightsEnergyService.currentRoom.set('entireHouse');
      expect(component.yaxisConfig().max).toBe(10.0);

      lightsEnergyService.currentRoom.set('kitchen');
      expect(component.yaxisConfig().max).toBe(3.0);
    });
  });

  describe('dropdown actions', () => {
    it('should toggle activeDropdown on toggleDropdown call', () => {
      expect(component.activeDropdown()).toBeNull();

      component.toggleDropdown('timeframe');
      expect(component.activeDropdown()).toBe('timeframe');

      component.toggleDropdown('timeframe');
      expect(component.activeDropdown()).toBeNull();

      component.toggleDropdown('room');
      expect(component.activeDropdown()).toBe('room');
    });

    it('should close dropdown and call loadEnergyStats on selectTimeframe', () => {
      component.activeDropdown.set('timeframe');

      component.selectTimeframe('month');

      expect(component.activeDropdown()).toBeNull();
      expect(lightsEnergyService.loadEnergyStats).toHaveBeenCalledWith('month', 'entireHouse');
    });

    it('should close dropdown and call loadEnergyStats on selectRoom', () => {
      component.activeDropdown.set('room');

      component.selectRoom('bathroom');

      expect(component.activeDropdown()).toBeNull();
      expect(lightsEnergyService.loadEnergyStats).toHaveBeenCalledWith('today', 'bathroom');
    });
  });
});
