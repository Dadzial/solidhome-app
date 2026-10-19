import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { of } from 'rxjs';
import { LightsScenesComponent } from './lights-scenes.component';

describe('LightsScenesComponent', () => {
  let component: LightsScenesComponent;
  let fixture: ComponentFixture<LightsScenesComponent>;

  beforeEach(async () => {
    localStorage.clear();
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

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('signal delegation to service', () => {
    it('should delegate scenes signal to service', () => {
      expect(component.scenes).toBe(component.lightsScenesService.scenes);
    });

    it('should delegate empty signal to service', () => {
      expect(component.empty).toBe(component.lightsScenesService.empty);
      expect(component.empty()).toBe(true);
    });
  });

  describe('scene icon selection', () => {
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
  });

  describe('room selection (toggleRoom)', () => {
    it('should default selectedRooms to living_room', () => {
      expect(component.selectedRooms()).toEqual(['living_room']);
      expect(component.isRoomSelected('living_room')).toBe(true);
      expect(component.isRoomSelected('kitchen')).toBe(false);
    });

    it('should toggle rooms in multiselect fashion', () => {
      component.toggleRoom('living_room');
      expect(component.selectedRooms()).toEqual([]);
      expect(component.isRoomSelected('living_room')).toBe(false);

      component.toggleRoom('kitchen');
      component.toggleRoom('bathroom');
      expect(component.selectedRooms()).toEqual(['kitchen', 'bathroom']);
      expect(component.isRoomSelected('kitchen')).toBe(true);
      expect(component.isRoomSelected('bathroom')).toBe(true);
    });

    it('should not contain entireHouse in roomOptions', () => {
      expect(component.roomOptions.some((opt) => opt.value === 'entireHouse')).toBe(false);
    });
  });

  describe('form visibility and reset', () => {
    it('should toggle enableAddScene signal', () => {
      expect(component.enableAddScene()).toBe(false);
      component.toggleAddScene();
      expect(component.enableAddScene()).toBe(true);
      component.toggleAddScene();
      expect(component.enableAddScene()).toBe(false);
    });

    it('should reset form fields on resetForm call', () => {
      component.sceneName.set('Test');
      component.selectedIcon.set('assets/icons/work.svg');
      component.selectedRooms.set(['kitchen']);

      component.resetForm();

      expect(component.sceneName()).toBe('');
      expect(component.selectedIcon()).toBe('assets/icons/heart.svg');
      expect(component.selectedRooms()).toEqual(['living_room']);
    });
  });

  describe('form validation (canSave)', () => {
    it('should not allow saving when sceneName is empty', () => {
      component.sceneName.set('   ');
      expect(component.canSave()).toBe(false);
    });

    it('should not allow saving when no rooms are selected', () => {
      component.sceneName.set('Scena Filmowa');
      component.selectedRooms.set([]);
      expect(component.canSave()).toBe(false);
    });

    it('should allow saving when sceneName and rooms are provided', () => {
      component.sceneName.set('Scena Filmowa');
      component.selectedRooms.set(['living_room']);
      expect(component.canSave()).toBe(true);
    });
  });

  describe('saveScene', () => {
    it('should save scene and close add form', () => {
      component.toggleAddScene();
      component.sceneName.set('Test Scena');
      component.selectedRooms.set(['living_room']);

      const addSpy = vi.spyOn(component.lightsScenesService, 'addScene');
      component.saveScene();

      expect(addSpy).toHaveBeenCalledWith({
        name: 'Test Scena',
        icon: component.selectedIcon(),
        rooms: ['living_room'],
      });
      expect(component.enableAddScene()).toBe(false);
      expect(component.sceneName()).toBe('');
    });

    it('should not save when canSave is false', () => {
      const addSpy = vi.spyOn(component.lightsScenesService, 'addScene');
      component.sceneName.set('');
      component.saveScene();
      expect(addSpy).not.toHaveBeenCalled();
    });
  });

  describe('activateScene and deleteScene', () => {
    it('should call activateScene on service', () => {
      const activateSpy = vi.spyOn(component.lightsScenesService, 'activateScene');
      component.activateScene('scene_123');
      expect(activateSpy).toHaveBeenCalledWith('scene_123');
    });

    it('should call deleteScene on service and stop event propagation', () => {
      const deleteSpy = vi.spyOn(component.lightsScenesService, 'deleteScene');
      const mockEvent = { stopPropagation: vi.fn() } as unknown as Event;

      component.deleteScene('scene_123', mockEvent);

      expect(deleteSpy).toHaveBeenCalledWith('scene_123');
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });
});
