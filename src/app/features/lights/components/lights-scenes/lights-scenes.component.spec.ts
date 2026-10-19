import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { of } from 'rxjs';
import { LightsScenesComponent } from './lights-scenes.component';

describe('LightsScenesComponent', () => {
  let component: LightsScenesComponent;
  let fixture: ComponentFixture<LightsScenesComponent>;

  beforeEach(async () => {
    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [LightsScenesComponent],
      providers: [
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LightsScenesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 3 predefined sceneIcons', () => {
    expect(component.sceneIcons).toEqual([
      'assets/icons/heart.svg',
      'assets/icons/film.svg',
      'assets/icons/work.svg',
    ]);
  });

  it('should default selectedIcon to the first scene icon', () => {
    expect(component.selectedIcon()).toBe('assets/icons/heart.svg');
  });

  it('should update selectedIcon on selectIcon call', () => {
    component.selectIcon('assets/icons/film.svg');
    expect(component.selectedIcon()).toBe('assets/icons/film.svg');
  });

  it('should toggle enableAddScene signal', () => {
    expect(component.enableAddScene()).toBe(false);
    component.toggleAddScene();
    expect(component.enableAddScene()).toBe(true);
    component.toggleAddScene();
    expect(component.enableAddScene()).toBe(false);
  });
});
