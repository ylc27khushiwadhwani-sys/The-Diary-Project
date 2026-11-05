import { describe, it, expect } from 'vitest';
import { hallHourFor } from './timeOfDay';

describe('hallHourFor', () => {
  it('maps local hours to lighting', () => {
    expect(hallHourFor(6)).toBe('dawn');
    expect(hallHourFor(12)).toBe('day');
    expect(hallHourFor(18)).toBe('dusk');
    expect(hallHourFor(22)).toBe('night');
    expect(hallHourFor(0)).toBe('deep');
    expect(hallHourFor(4)).toBe('deep');
  });
});
