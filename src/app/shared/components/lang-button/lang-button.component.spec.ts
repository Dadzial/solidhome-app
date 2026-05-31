import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LangButtonComponent } from './lang-button.component';

describe('LangButtonComponent', () => {
  let component: LangButtonComponent;
  let fixture: ComponentFixture<LangButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LangButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LangButtonComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
