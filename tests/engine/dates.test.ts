import { describe, expect, it } from 'vitest';
import { daysBetween, daysByYear, dueDate, isLeapYear, daysInYear } from '../../src/lib/engine/dates';

describe('dates', () => {
  it('knows leap years', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2020)).toBe(true);
    expect(isLeapYear(2100)).toBe(false);
    expect(daysInYear(2024)).toBe(366);
    expect(daysInYear(2025)).toBe(365);
  });

  it('splits a holding period by year and sums to the total', () => {
    const split = daysByYear('2021-03-11', '2025-08-20');
    const total = daysBetween('2021-03-11', '2025-08-20');
    expect(Object.values(split).reduce((a, b) => a + b, 0)).toBe(total);
    expect(split[2024]).toBe(366);
    expect(split[2022]).toBe(365);
    // Day after acquisition (Mar 12) through Dec 31, 2021 = 295 days
    expect(split[2021]).toBe(295);
    // Jan 1 through Aug 20, 2025 = 232 days
    expect(split[2025]).toBe(232);
  });

  it('computes due dates, moving weekends to Monday', () => {
    expect(dueDate(2025)).toBe('2026-04-15'); // Wednesday
    expect(dueDate(2024)).toBe('2025-04-15'); // Tuesday
    expect(dueDate(2020)).toBe('2021-04-15'); // Thursday
    expect(dueDate(2021)).toBe('2022-04-15'); // Friday
    expect(dueDate(2022)).toBe('2023-04-17'); // Apr 15 2023 is a Saturday
    expect(dueDate(2018)).toBe('2019-04-15'); // Monday
    expect(dueDate(2019)).toBe('2020-04-15');
  });
});
