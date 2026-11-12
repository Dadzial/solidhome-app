import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LightsScenesService } from './lights-scenes.service';
import { LightsControlService } from '../lights-control/lights-control.service';
import { signal } from '@angular/core';
import { Light, LightSceneItem } from '@features/lights/models/lights.models';
import { environment } from '@environments/environment';

describe('LightsScenesService', () => {
  let service: LightsScenesService;
  let httpMock: HttpTestingController;
  let mockLightsControlService: {
    lights: ReturnType<typeof signal<Light[]>>;
    toggleLight: ReturnType<typeof vi.fn>;
  };

  const initialTestLights: Light[] = [
    { id: 'living_room', x: 0, y: 0, on: false },
    { id: 'kitchen', x: 0, y: 0, on: true },
    { id: 'bathroom', x: 0, y: 0, on: false },
  ];

  const mockApiScenes: LightSceneItem[] = [
    {
      _id: 'scene_1',
      name: 'Wieczór filmowy',
      icon: 'assets/icons/film.svg',
      rooms: ['living_room', 'kitchen'],
      active: false,
    },
    {
      _id: 'scene_2',
      name: 'Relaks',
      icon: 'assets/icons/heart.svg',
      rooms: ['bathroom'],
      active: true,
    },
  ];

  beforeEach(() => {
    mockLightsControlService = {
      lights: signal<Light[]>(initialTestLights),
      toggleLight: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        LightsScenesService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LightsControlService, useValue: mockLightsControlService },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(LightsScenesService);

    const initReq = httpMock.expectOne(`${environment.apiUrl}/lights/scenes`);
    initReq.flush(mockApiScenes);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  it('should be created and load initial scenes from API', () => {
    expect(service).toBeTruthy();
    expect(service.scenes().length).toBe(2);
    expect(service.empty()).toBe(false);
    expect(service.isLoading()).toBe(false);
    expect(service.hasError()).toBe(false);
  });

  describe('loadScenes', () => {
    it('should set hasError to true when API fails', () => {
      service.loadScenes();
      expect(service.isLoading()).toBe(true);

      const req = httpMock.expectOne(`${environment.apiUrl}/lights/scenes`);
      req.error(new ProgressEvent('error'));

      expect(service.isLoading()).toBe(false);
      expect(service.hasError()).toBe(true);
    });
  });

  describe('addScene', () => {
    it('should POST new scene to API and reload scenes', () => {
      const payload = {
        name: 'Praca',
        icon: 'assets/icons/work.svg',
        rooms: ['living_room'],
      };

      service.addScene(payload);

      const postReq = httpMock.expectOne(`${environment.apiUrl}/lights/scenes`);
      expect(postReq.request.method).toBe('POST');
      expect(postReq.request.body).toEqual(payload);

      postReq.flush({
        _id: 'scene_3',
        ...payload,
        active: false,
      });

      const reloadReq = httpMock.expectOne(`${environment.apiUrl}/lights/scenes`);
      reloadReq.flush([
        ...mockApiScenes,
        {
          _id: 'scene_3',
          ...payload,
          active: false,
        },
      ]);

      expect(service.scenes().length).toBe(3);
      expect(service.hasError()).toBe(false);
    });

    it('should set hasError to true when POST fails', () => {
      service.addScene({
        name: 'Błędna scena',
        icon: 'assets/icons/heart.svg',
        rooms: ['kitchen'],
      });

      const postReq = httpMock.expectOne(`${environment.apiUrl}/lights/scenes`);
      postReq.error(new ProgressEvent('error'));

      expect(service.hasError()).toBe(true);
    });
  });

  describe('deleteScene', () => {
    it('should delete scene optimistically and send DELETE to API', () => {
      service.deleteScene('scene_1');

      expect(service.scenes().some((s) => s.id === 'scene_1')).toBe(false);

      const delReq = httpMock.expectOne(`${environment.apiUrl}/lights/scenes/scene_1`);
      expect(delReq.request.method).toBe('DELETE');
      delReq.flush({ message: 'Scene deleted', deletedCount: 1 });

      expect(service.hasError()).toBe(false);
    });

    it('should rollback scenes and set hasError to true if DELETE fails', () => {
      const initialCount = service.scenes().length;

      service.deleteScene('scene_1');
      expect(service.scenes().length).toBe(initialCount - 1);

      const delReq = httpMock.expectOne(`${environment.apiUrl}/lights/scenes/scene_1`);
      delReq.error(new ProgressEvent('error'));

      expect(service.scenes().length).toBe(initialCount);
      expect(service.hasError()).toBe(true);
    });

    it('should turn off active lights in scene rooms when deleting an active scene', () => {
      mockLightsControlService.lights.set([{ id: 'bathroom', x: 0, y: 0, on: true }]);
      mockLightsControlService.toggleLight.mockClear();

      service.deleteScene('scene_2');

      expect(mockLightsControlService.toggleLight).toHaveBeenCalledWith('bathroom');

      const delReq = httpMock.expectOne(`${environment.apiUrl}/lights/scenes/scene_2`);
      delReq.flush({ message: 'Scene deleted', deletedCount: 1 });
    });
  });

  describe('activateScene', () => {
    it('should activate scene and turn on lights that are off in target rooms', () => {
      service.activateScene('scene_1');

      expect(mockLightsControlService.toggleLight).toHaveBeenCalledWith('living_room');
      expect(mockLightsControlService.toggleLight).not.toHaveBeenCalledWith('kitchen');

      const scene = service.scenes().find((s) => s.id === 'scene_1');
      expect(scene?.active).toBe(true);
    });

    it('should turn off lights in target rooms and deactivate scene on second activation', () => {
      service.activateScene('scene_1');

      mockLightsControlService.lights.set([
        { id: 'living_room', x: 0, y: 0, on: true },
        { id: 'kitchen', x: 0, y: 0, on: true },
      ]);
      mockLightsControlService.toggleLight.mockClear();

      service.activateScene('scene_1');

      expect(mockLightsControlService.toggleLight).toHaveBeenCalledWith('living_room');
      expect(mockLightsControlService.toggleLight).toHaveBeenCalledWith('kitchen');

      const scene = service.scenes().find((s) => s.id === 'scene_1');
      expect(scene?.active).toBe(false);
    });
  });

  describe('putSceneActive', () => {
    it('should send PUT request to toggle scene active in API', () => {
      service.putSceneActive('scene_1', true).subscribe();

      const putReq = httpMock.expectOne(`${environment.apiUrl}/lights/scenes/scene_1`);
      expect(putReq.request.method).toBe('PUT');
      expect(putReq.request.body).toEqual({ active: true });
      putReq.flush(mockApiScenes[0]);
    });
  });
});
