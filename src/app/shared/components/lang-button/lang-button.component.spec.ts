import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { LangButtonComponent } from './lang-button.component';
import { TranslationsService } from '@core/services/translations/translations.service';

describe('LangButtonComponent', () => {
  let component: LangButtonComponent;
  let fixture: ComponentFixture<LangButtonComponent>;
  let translationsService: TranslationsService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [LangButtonComponent],
      providers: [
        provideTranslateService(),
        TranslationsService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LangButtonComponent);
    component = fixture.componentInstance;
    translationsService = TestBed.inject(TranslationsService);
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set isLoaded to true after 50ms', () => {
    vi.useFakeTimers();
    expect(component.isLoaded()).toBe(false);

    component.ngOnInit();
    expect(component.isLoaded()).toBe(false);

    vi.advanceTimersByTime(50);
    expect(component.isLoaded()).toBe(true);
  });

  it('should have default language set to "en" or "pl"', () => {
    expect(['en', 'pl']).toContain(translationsService.currentLang());
  });

  it('should change language to "en" and "pl" via translationsService', () => {
    translationsService.setLanguage('en');
    expect(translationsService.currentLang()).toBe('en');

    translationsService.setLanguage('pl');
    expect(translationsService.currentLang()).toBe('pl');
  });
});
