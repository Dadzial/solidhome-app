import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ErrorOverlayComponent } from './error-overlay.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { of } from 'rxjs';

describe('ErrorOverlayComponent', () => {
  let component: ErrorOverlayComponent;
  let fixture: ComponentFixture<ErrorOverlayComponent>;
  let translate: TranslateService;

  beforeEach(async () => {
    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(document.createElementNS('http://www.w3.org/2000/svg', 'svg')),
    };

    await TestBed.configureTestingModule({
      imports: [ErrorOverlayComponent, TranslateModule.forRoot()],
      providers: [{ provide: SvgIconRegistryService, useValue: mockSvgRegistry }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setTranslation('pl', {
      apiErrors: {
        server: 'Wystąpił błąd serwera. Spróbuj ponownie później',
        retryNow: 'Spróbuj ponownie',
      },
    });
    translate.use('pl');

    fixture = TestBed.createComponent(ErrorOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('retry actions', () => {
    it('should emit retry output on onRetryClick', () => {
      const retryEmitSpy = vi.spyOn(component.retry, 'emit');

      component.onRetryClick();

      expect(retryEmitSpy).toHaveBeenCalledTimes(1);
    });

    it('should trigger onRetryClick and emit retry when retry button in DOM is clicked', () => {
      const retrySpy = vi.spyOn(component, 'onRetryClick');
      const retryEmitSpy = vi.spyOn(component.retry, 'emit');
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

      expect(button).toBeTruthy();
      button.click();

      expect(retrySpy).toHaveBeenCalledTimes(1);
      expect(retryEmitSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('template rendering', () => {
    it('should display default server title when title input not provided', () => {
      fixture.detectChanges();

      const h2 = fixture.nativeElement.querySelector('h2');
      expect(h2?.textContent?.trim()).toBe('Wystąpił błąd serwera. Spróbuj ponownie później');
    });

    it('should display custom title when provided via title input', () => {
      fixture.componentRef.setInput('title', 'Tytuł błędu');
      fixture.detectChanges();

      const h2 = fixture.nativeElement.querySelector('h2');
      expect(h2?.textContent?.trim()).toBe('Tytuł błędu');
    });

    it('should render retry button with translated text', () => {
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(button?.textContent?.trim()).toBe('Spróbuj ponownie');
    });

    it('should apply overlay mode classes by default', () => {
      const div = fixture.nativeElement.querySelector('div') as HTMLElement;
      expect(div.classList.contains('absolute')).toBe(true);
      expect(div.classList.contains('inset-0')).toBe(true);
      expect(div.classList.contains('rounded-3xl')).toBe(true);
      expect(div.classList.contains('backdrop-blur-md')).toBe(true);
    });

    it('should apply page mode classes when mode is set to page', () => {
      fixture.componentRef.setInput('mode', 'page');
      fixture.detectChanges();

      const div = fixture.nativeElement.querySelector('div') as HTMLElement;
      expect(div.classList.contains('absolute')).toBe(true);
      expect(div.classList.contains('inset-0')).toBe(true);
      expect(div.classList.contains('backdrop-blur-md')).toBe(true);
      expect(div.classList.contains('rounded-3xl')).toBe(false);
    });
  });
});
