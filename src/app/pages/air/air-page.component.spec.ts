import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirPageComponent } from './air-page.component';

describe('AirPageComponent', () => {
  let component: AirPageComponent;
  let fixture: ComponentFixture<AirPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AirPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AirPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
