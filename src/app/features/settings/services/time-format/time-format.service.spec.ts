import { TestBed } from '@angular/core/testing';
import { TimeFormatService } from './time-format.service';

describe('TimeFormatService', () => {
  let service: TimeFormatService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [TimeFormatService],
    });
    service = TestBed.inject(TimeFormatService);
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should be created with default 24h format', () => {
    expect(service).toBeTruthy();
    expect(service.timeFormat()).toBe('24h');
  });

  describe('initialization from localStorage', () => {
    it('should initialize with "12h" when saved in localStorage', () => {
      localStorage.setItem('solidhome-time-format', '12h');

      const customService = new TimeFormatService();
      expect(customService.timeFormat()).toBe('12h');
    });

    it('should fallback to "24h" when localStorage contains invalid format', () => {
      localStorage.setItem('solidhome-time-format', 'invalid_format');

      const customService = new TimeFormatService();
      expect(customService.timeFormat()).toBe('24h');
    });
  });

  describe('setTimeFormat', () => {
    it('should update timeFormat signal and persist to localStorage', () => {
      service.setTimeFormat('12h');

      expect(service.timeFormat()).toBe('12h');
      expect(localStorage.getItem('solidhome-time-format')).toBe('12h');

      service.setTimeFormat('24h');

      expect(service.timeFormat()).toBe('24h');
      expect(localStorage.getItem('solidhome-time-format')).toBe('24h');
    });
  });

  describe('formatTimeString', () => {
    describe('when format is 24h', () => {
      beforeEach(() => {
        service.setTimeFormat('24h');
      });

      it('should return original time string without modifications', () => {
        expect(service.formatTimeString('14:35')).toBe('14:35');
        expect(service.formatTimeString('08:00')).toBe('08:00');
        expect(service.formatTimeString('00:00')).toBe('00:00');
        expect(service.formatTimeString('23:59')).toBe('23:59');
      });
    });

    describe('when format is 12h', () => {
      beforeEach(() => {
        service.setTimeFormat('12h');
      });

      it('should convert afternoon/evening times to PM', () => {
        expect(service.formatTimeString('14:35')).toBe('2:35 PM');
        expect(service.formatTimeString('12:00')).toBe('12:00 PM');
        expect(service.formatTimeString('23:59')).toBe('11:59 PM');
      });

      it('should convert morning times to AM', () => {
        expect(service.formatTimeString('08:15')).toBe('8:15 AM');
        expect(service.formatTimeString('11:30')).toBe('11:30 AM');
      });

      it('should convert midnight (00:xx) to 12:xx AM', () => {
        expect(service.formatTimeString('00:00')).toBe('12:00 AM');
        expect(service.formatTimeString('00:45')).toBe('12:45 AM');
      });

      it('should return original string if input is empty or invalid format', () => {
        expect(service.formatTimeString('')).toBe('');
        expect(service.formatTimeString('invalid')).toBe('invalid');
        expect(service.formatTimeString('abc:def')).toBe('abc:def');
      });
    });
  });
});
