import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { of } from 'rxjs';
import { AirWidgetComponent } from './air-widget.component';

describe('AirWidgetComponent', () => {
  let component: AirWidgetComponent;
  let fixture: ComponentFixture<AirWidgetComponent>;

  beforeEach(async () => {
    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [AirWidgetComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AirWidgetComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadCurrentAir on onRetry', () => {
    const spy = vi.spyOn(component.airDataService, 'loadCurrentAir');
    component.onRetry();
    expect(spy).toHaveBeenCalled();
  });

  it('should render error overlay when errorMessage is set and trigger onRetry on click', () => {
    component.airDataService.errorMessage.set('apiErrors.server');
    fixture.detectChanges();

    const errorOverlay = fixture.nativeElement.querySelector('app-error-overlay');
    expect(errorOverlay).toBeTruthy();

    const onRetrySpy = vi.spyOn(component, 'onRetry');
    const retryBtn = errorOverlay.querySelector('button') as HTMLButtonElement;
    retryBtn.click();

    expect(onRetrySpy).toHaveBeenCalled();
  });
});
