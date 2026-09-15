import { describe, it, expect } from 'vitest';
import { formatThaiDate } from '../utils/dateUtils';

describe('Frontend dateUtils', () => {
  it('should return "-" when dateString is empty or null', () => {
    expect(formatThaiDate(null)).toBe('-');
    expect(formatThaiDate('')).toBe('-');
  });

  it('should format date to Thai string', () => {
    const result = formatThaiDate('2026-09-15T00:00:00Z', { showTime: false });
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).not.toBe('-');
  });
});
