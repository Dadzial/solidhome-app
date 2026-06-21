import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityPageComponent } from './security-page.component';

describe('SecurityPageComponent', () => {
  let component: SecurityPageComponent;
  let fixture: ComponentFixture<SecurityPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SecurityPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
