import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LightsPageComponent } from './lights-page.component';

describe('LightsPageComponent', () => {
  let component: LightsPageComponent;
  let fixture: ComponentFixture<LightsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LightsPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LightsPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
