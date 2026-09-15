import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoadingService],
    });
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial isLoading state set to false', () => {
    expect(service.isLoading()).toBe(false);
  });

  describe('showLoadingWindow', () => {
    it('should set isLoading to true', () => {
      service.showLoadingWindow();

      expect(service.isLoading()).toBe(true);
    });
  });

  describe('hideLoadingWindow', () => {
    it('should set isLoading to false after being shown', () => {
      service.showLoadingWindow();
      expect(service.isLoading()).toBe(true);

      service.hideLoadingWindow();
      expect(service.isLoading()).toBe(false);
    });
  });
});
