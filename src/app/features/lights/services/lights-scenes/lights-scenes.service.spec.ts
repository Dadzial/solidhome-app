import { TestBed } from '@angular/core/testing';
import { LightsScenesService } from './lights-scenes.service';
import { LightsControlService } from '../lights-control/lights-control.service';
import { signal } from '@angular/core';
import { Light } from '@features/lights/models/lights.models';

describe('LightsScenesService', () => {
  let service: LightsScenesService;
  let mockLightsControlService: {
    lights: ReturnType<typeof signal<Light[]>>;
    toggleLight: ReturnType<typeof vi.fn>;
  };

  const initialTestLights: Light[] = [
    { id: 'living_room', x: 0, y: 0, on: false },
    { id: 'kitchen', x: 0, y: 0, on: true },
    { id: 'bathroom', x: 0, y: 0, on: false },
  ];

  beforeEach(() => {
    localStorage.clear();

    mockLightsControlService = {
      lights: signal<Light[]>(initialTestLights),
      toggleLight: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        LightsScenesService,
        { provide: LightsControlService, useValue: mockLightsControlService },
      ],
    });

    service = TestBed.inject(LightsScenesService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial signals state', () => {
    it('should initialize with empty scenes when storage is empty', () => {
      expect(service.scenes().length).toBe(0);
      expect(service.empty()).toBe(true);
    });

    it('should load existing scenes from localStorage on creation', () => {
      const storedScenes = [
        {
          id: 's1',
          name: 'Zapisana scena',
          icon: 'assets/icons/film.svg',
          rooms: ['living_room'],
          active: false,
        },
      ];
      localStorage.setItem('solid_home_light_scenes', JSON.stringify(storedScenes));

      const newService = TestBed.runInInjectionContext(() => new LightsScenesService());
      expect(newService.scenes()).toEqual(storedScenes);
      expect(newService.empty()).toBe(false);
    });
  });

  describe('addScene', () => {
    it('should add a new scene and persist it to localStorage', () => {
      service.addScene({
        name: 'Nowa Scena Testowa',
        icon: 'assets/icons/heart.svg',
        rooms: ['kitchen', 'bathroom'],
      });

      expect(service.scenes().length).toBe(1);
      expect(service.empty()).toBe(false);
      const added = service.scenes()[0];
      expect(added.name).toBe('Nowa Scena Testowa');
      expect(added.rooms).toEqual(['kitchen', 'bathroom']);

      const inStorage = JSON.parse(localStorage.getItem('solid_home_light_scenes') || '[]');
      expect(inStorage.some((s: { name: string }) => s.name === 'Nowa Scena Testowa')).toBe(true);
    });
  });

  describe('deleteScene', () => {
    it('should delete a scene by id and update localStorage', () => {
      service.addScene({
        name: 'Do usuniecia',
        icon: 'assets/icons/film.svg',
        rooms: ['living_room'],
      });
      const sceneToDelete = service.scenes()[0];
      service.deleteScene(sceneToDelete.id);

      expect(service.scenes().some((s) => s.id === sceneToDelete.id)).toBe(false);

      const inStorage = JSON.parse(localStorage.getItem('solid_home_light_scenes') || '[]');
      expect(inStorage.some((s: { id: string }) => s.id === sceneToDelete.id)).toBe(false);
    });
  });

  describe('activateScene (toggle)', () => {
    it('should activate scene and turn on lights that are off in target rooms', () => {
      service.addScene({
        name: 'Wieczor test',
        icon: 'assets/icons/film.svg',
        rooms: ['living_room', 'kitchen'],
      });
      const testScene = service.scenes()[0];

      service.activateScene(testScene.id);

      expect(mockLightsControlService.toggleLight).toHaveBeenCalledWith('living_room');
      expect(mockLightsControlService.toggleLight).not.toHaveBeenCalledWith('kitchen');
      expect(service.scenes().find((s) => s.id === testScene.id)?.active).toBe(true);
    });

    it('should turn off lights in target rooms and deactivate scene on second click', () => {
      service.addScene({
        name: 'Wieczor test',
        icon: 'assets/icons/film.svg',
        rooms: ['living_room', 'kitchen'],
      });
      const testScene = service.scenes()[0];

      service.activateScene(testScene.id);

      mockLightsControlService.lights.set([
        { id: 'living_room', x: 0, y: 0, on: true },
        { id: 'kitchen', x: 0, y: 0, on: true },
      ]);
      mockLightsControlService.toggleLight.mockClear();

      service.activateScene(testScene.id);

      expect(mockLightsControlService.toggleLight).toHaveBeenCalledWith('living_room');
      expect(mockLightsControlService.toggleLight).toHaveBeenCalledWith('kitchen');
      expect(service.scenes().find((s) => s.id === testScene.id)?.active).toBe(false);
    });
  });
});
