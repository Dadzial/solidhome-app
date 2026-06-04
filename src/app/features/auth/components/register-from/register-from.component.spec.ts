import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterFromComponent } from './register-from.component';

describe('RegisterFromComponent', () => {
  let component: RegisterFromComponent;
  let fixture: ComponentFixture<RegisterFromComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterFromComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterFromComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
