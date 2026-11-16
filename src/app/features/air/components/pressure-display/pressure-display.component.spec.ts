import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PressureDisplayComponent } from './pressure-display.component';

describe('PressureDisplayComponent', () => {
  let component: PressureDisplayComponent;
  let fixture: ComponentFixture<PressureDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PressureDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PressureDisplayComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
