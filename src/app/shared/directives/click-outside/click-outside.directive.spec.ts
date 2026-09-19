import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClickOutsideDirective } from './click-outside.directive';

@Component({
  standalone: true,
  imports: [ClickOutsideDirective],
  template: `
    <button id="mobile-menu-btn">Menu Button</button>
    <button class="settings-toggle-btn">Settings Button</button>
    <div id="target" (appClickOutside)="onClickedOutside()">
      <span id="inside">Inside Element</span>
    </div>
    <div id="outside">Outside Element</div>
  `,
})
class TestHostComponent {
  public outsideClicked = false;

  public onClickedOutside(): void {
    this.outsideClicked = true;
  }
}

describe('ClickOutsideDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should emit appClickOutside when clicking outside target element', () => {
    const outsideEl = fixture.nativeElement.querySelector('#outside') as HTMLElement;
    outsideEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(hostComponent.outsideClicked).toBe(true);
  });

  it('should not emit appClickOutside when clicking inside target element', () => {
    const insideEl = fixture.nativeElement.querySelector('#inside') as HTMLElement;
    insideEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(hostComponent.outsideClicked).toBe(false);
  });

  it('should not emit appClickOutside when clicking mobile-menu-btn toggle', () => {
    const menuBtn = fixture.nativeElement.querySelector('#mobile-menu-btn') as HTMLElement;
    menuBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(hostComponent.outsideClicked).toBe(false);
  });

  it('should not emit appClickOutside when clicking settings-toggle-btn toggle', () => {
    const settingsBtn = fixture.nativeElement.querySelector('.settings-toggle-btn') as HTMLElement;
    settingsBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(hostComponent.outsideClicked).toBe(false);
  });
});
