import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutsideDataComponent } from './outside-data.component';

describe('OutsideDataComponent', () => {
  let component: OutsideDataComponent;
  let fixture: ComponentFixture<OutsideDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutsideDataComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OutsideDataComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
