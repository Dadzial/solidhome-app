import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { loginGuard } from './login-guard';

describe('loginGuard', () => {
  let routerMock: { createUrlTree: ReturnType<typeof vi.fn> };

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => loginGuard(...guardParameters));

  const createMockRoute = (): ActivatedRouteSnapshot => ({}) as ActivatedRouteSnapshot;
  const createMockState = (url: string): RouterStateSnapshot => ({ url }) as RouterStateSnapshot;

  beforeEach(() => {
    routerMock = {
      createUrlTree: vi.fn(
        (commands: unknown[]): UrlTree =>
          ({ toString: () => commands.join('/') }) as unknown as UrlTree,
      ),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: routerMock }],
    });

    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(executeGuard).toBeDefined();
  });

  describe('when user is NOT authenticated', () => {
    it('should allow access to auth page ("/")', () => {
      const result = executeGuard(createMockRoute(), createMockState('/'));

      expect(result).toBe(true);
      expect(routerMock.createUrlTree).not.toHaveBeenCalled();
    });

    it('should redirect to "/" when accessing a protected route', () => {
      const result = executeGuard(
        createMockRoute(),
        createMockState('/dashboard'),
      );

      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/']);
      expect(result).toEqual(routerMock.createUrlTree.mock.results[0].value);
    });
  });

  describe('when user IS authenticated', () => {
    it('should redirect to "/home" when token is in localStorage and accessing "/"', () => {
      localStorage.setItem('token', 'fake-jwt-token');

      executeGuard(createMockRoute(), createMockState('/'));

      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/home']);
    });

    it('should redirect to "/home" when token is in sessionStorage and accessing "/"', () => {
      sessionStorage.setItem('token', 'session-jwt-token');

      executeGuard(createMockRoute(), createMockState('/'));

      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/home']);
    });

    it('should allow access to protected route when authenticated', () => {
      localStorage.setItem('token', 'fake-jwt-token');

      const result = executeGuard(
        createMockRoute(),
        createMockState('/dashboard'),
      );

      expect(result).toBe(true);
      expect(routerMock.createUrlTree).not.toHaveBeenCalled();
    });
  });
});
