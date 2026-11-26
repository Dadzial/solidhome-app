import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { of } from 'rxjs';
import { AirChartsComponent } from './air-charts.component';

describe('AirChartsComponent', () => {
  let component: AirChartsComponent;
  let fixture: ComponentFixture<AirChartsComponent>;

  beforeEach(async () => {
    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [AirChartsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AirChartsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default dropdown state and labels', () => {
    expect(component.activeDropdown()).toBeNull();
    expect(component.selectedTimeframe()).toBe('today');
    expect(component.selectedMetric()).toBe('temperature');
    expect(component.selectedTimeframeLabel()).toBe('lightsPage.today');
    expect(component.selectedMetricLabel()).toBe('temperatureDisplay.title');
  });

  describe('dropdown interactions', () => {
    it('should toggle timeframe and metric dropdowns', () => {
      component.toggleDropdown('timeframe');
      expect(component.activeDropdown()).toBe('timeframe');

      component.toggleDropdown('metric');
      expect(component.activeDropdown()).toBe('metric');

      component.toggleDropdown('metric');
      expect(component.activeDropdown()).toBeNull();
    });

    it('should select timeframe, update computed label and close dropdown', () => {
      component.toggleDropdown('timeframe');
      component.selectTimeframe('week');

      expect(component.selectedTimeframe()).toBe('week');
      expect(component.selectedTimeframeLabel()).toBe('lightsPage.week');
      expect(component.activeDropdown()).toBeNull();

      component.selectTimeframe('month');
      expect(component.selectedTimeframe()).toBe('month');
      expect(component.selectedTimeframeLabel()).toBe('lightsPage.month');
    });

    it('should select metric, update computed label and close dropdown', () => {
      component.toggleDropdown('metric');
      component.selectMetric('humidity');

      expect(component.selectedMetric()).toBe('humidity');
      expect(component.selectedMetricLabel()).toBe('humidityDisplay.title');
      expect(component.activeDropdown()).toBeNull();

      component.selectMetric('pressure');
      expect(component.selectedMetric()).toBe('pressure');
      expect(component.selectedMetricLabel()).toBe('pressureDisplay.title');
    });

    it('should render dropdown menu options in DOM when opened and close on option click', () => {
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button',
      ) as NodeListOf<HTMLButtonElement>;

      buttons[0].click();
      fixture.detectChanges();
      expect(component.activeDropdown()).toBe('timeframe');

      const dropdownOptions = fixture.nativeElement.querySelectorAll(
        '.z-50 button',
      ) as NodeListOf<HTMLButtonElement>;
      expect(dropdownOptions.length).toBe(3);

      dropdownOptions[1].click();
      fixture.detectChanges();
      expect(component.selectedTimeframe()).toBe('week');
      expect(component.activeDropdown()).toBeNull();
    });
  });

  describe('chart configuration', () => {
    it('should initialize with empty chartSeries and area chart config', () => {
      expect(component.chartSeries).toEqual([{ name: '', data: [] }]);
      expect(component.chartConfig.type).toBe('area');
      expect(component.chartConfig.toolbar?.show).toBe(false);
    });

    it('should update yaxisConfig range and formatter when metric changes', () => {
      expect(component.yaxisConfig().min).toBe(0);
      expect(component.yaxisConfig().max).toBe(40);
      expect(component.yaxisConfig().tickAmount).toBe(4);
      const tempFormatter = component.yaxisConfig().labels?.formatter;
      expect(tempFormatter?.(22.5)).toBe('22.5');

      component.selectMetric('humidity');
      expect(component.yaxisConfig().min).toBe(0);
      expect(component.yaxisConfig().max).toBe(100);
      expect(component.yaxisConfig().tickAmount).toBe(4);
      const humFormatter = component.yaxisConfig().labels?.formatter;
      expect(humFormatter?.(55)).toBe('55.0');

      component.selectMetric('pressure');
      expect(component.yaxisConfig().min).toBe(960);
      expect(component.yaxisConfig().max).toBe(1050);
      expect(component.yaxisConfig().tickAmount).toBe(5);
      const pressFormatter = component.yaxisConfig().labels?.formatter;
      expect(pressFormatter?.(1013.4)).toBe('1013');
    });

    it('should render apx-chart element in template', () => {
      fixture.detectChanges();
      const chartEl = fixture.nativeElement.querySelector('apx-chart');
      expect(chartEl).toBeTruthy();
    });
  });
});
