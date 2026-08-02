import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LightsEnergyComponent } from './lights-energy.component';

describe('LightsEnergyComponent', () => {
  let component: LightsEnergyComponent;
  let fixture: ComponentFixture<LightsEnergyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LightsEnergyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LightsEnergyComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
