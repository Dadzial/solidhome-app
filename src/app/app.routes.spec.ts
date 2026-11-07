import { routes } from './app.routes';
import { loginGuard } from '@core/guards/login/login-guard';

describe('App Routes', () => {
  it('should define root route with lazy loading and loginGuard', () => {
    const rootRoute = routes.find((r) => r.path === '');

    expect(rootRoute).toBeDefined();
    expect(rootRoute?.loadComponent).toBeDefined();
    expect(rootRoute?.canActivate).toContain(loginGuard);
  });

  it('should define home route with lazy loading and loginGuard', () => {
    const homeRoute = routes.find((r) => r.path === 'home');

    expect(homeRoute).toBeDefined();
    expect(homeRoute?.loadComponent).toBeDefined();
    expect(homeRoute?.canActivate).toContain(loginGuard);
  });

  it('should have a wildcard route redirecting unknown paths to ""', () => {
    const wildcardRoute = routes.find((r) => r.path === '**');

    expect(wildcardRoute).toBeDefined();
    expect(wildcardRoute?.redirectTo).toBe('');
  });
});
