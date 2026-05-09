import { describe, it, expect } from 'vitest';
const { toNull, toInt, toFloat } = require('../utils/dataHelper');

describe('DataHelper Utility', () => {
    describe('toNull', () => {
        it('should convert empty string to null', () => {
            expect(toNull('')).toBe(null);
        });
        it('should convert undefined to null', () => {
            expect(toNull(undefined)).toBe(null);
        });
        it('should convert "null" string to null', () => {
            expect(toNull('null')).toBe(null);
        });
        it('should return value if it is a valid string', () => {
            expect(toNull('hello')).toBe('hello');
        });
    });

    describe('toInt', () => {
        it('should parse valid integer string', () => {
            expect(toInt('123')).toBe(123);
        });
        it('should return default value for invalid input', () => {
            expect(toInt('abc', 0)).toBe(0);
        });
        it('should return null if no default value provided for invalid input', () => {
            expect(toInt('abc')).toBe(null);
        });
    });

    describe('toFloat', () => {
        it('should parse valid float string', () => {
            expect(toFloat('123.45')).toBe(123.45);
        });
        it('should return default value for invalid input', () => {
            expect(toFloat('not-a-number', 0.0)).toBe(0.0);
        });
    });
});
