import { validateLatitude, validateLongitude } from '../../utils/validation';
import { formatDate, parseDate } from '../../utils/date';

describe('Validation Utils', () => {
  describe('validateLatitude', () => {
    it('should accept valid latitudes', () => {
      // Test boundary values
      expect(validateLatitude(0)).toBe(true);
      expect(validateLatitude(90)).toBe(true);
      expect(validateLatitude(-90)).toBe(true);
      
      // Test decimal values
      expect(validateLatitude(45.5)).toBe(true);
      expect(validateLatitude(-45.5)).toBe(true);
      
      // Test small values
      expect(validateLatitude(0.1)).toBe(true);
      expect(validateLatitude(-0.1)).toBe(true);
    });

    it('should reject invalid latitudes', () => {
      // Test out of range values
      expect(validateLatitude(91)).toBe(false);
      expect(validateLatitude(-91)).toBe(false);
      
      // Test invalid inputs
      expect(validateLatitude(NaN)).toBe(false);
      expect(validateLatitude(Infinity)).toBe(false);
      expect(validateLatitude(-Infinity)).toBe(false);
      
      // Test non-numeric values
      // @ts-ignore - Testing invalid type
      expect(validateLatitude('45')).toBe(false);
      // @ts-ignore - Testing invalid type
      expect(validateLatitude(null)).toBe(false);
      // @ts-ignore - Testing invalid type
      expect(validateLatitude(undefined)).toBe(false);
    });
  });

  describe('validateLongitude', () => {
    it('should accept valid longitudes', () => {
      // Test boundary values
      expect(validateLongitude(0)).toBe(true);
      expect(validateLongitude(180)).toBe(true);
      expect(validateLongitude(-180)).toBe(true);
      
      // Test decimal values
      expect(validateLongitude(45.5)).toBe(true);
      expect(validateLongitude(-45.5)).toBe(true);
      
      // Test small values
      expect(validateLongitude(0.1)).toBe(true);
      expect(validateLongitude(-0.1)).toBe(true);
    });

    it('should reject invalid longitudes', () => {
      // Test out of range values
      expect(validateLongitude(181)).toBe(false);
      expect(validateLongitude(-181)).toBe(false);
      
      // Test invalid inputs
      expect(validateLongitude(NaN)).toBe(false);
      expect(validateLongitude(Infinity)).toBe(false);
      expect(validateLongitude(-Infinity)).toBe(false);
      
      // Test non-numeric values
      // @ts-ignore - Testing invalid type
      expect(validateLongitude('45')).toBe(false);
      // @ts-ignore - Testing invalid type
      expect(validateLongitude(null)).toBe(false);
      // @ts-ignore - Testing invalid type
      expect(validateLongitude(undefined)).toBe(false);
    });
  });
});

describe('Date Utils', () => {
  describe('parseDate', () => {
    it('should parse valid date strings', () => {
      // Test various ISO formats
      const validDates = [
        '2024-03-15T12:00:00Z',
        '2024-03-15T12:00:00.000Z',
        '2024-03-15T12:00:00+00:00',
        '2024-03-15T12:00:00-00:00',
        '2024-03-15', // Date only
        '2024-03-15T12:00:00+01:00', // With timezone offset
      ];

      validDates.forEach(dateString => {
        const date = parseDate(dateString);
        expect(date).toBeInstanceOf(Date);
        expect(isNaN(date.getTime())).toBe(false);
      });
    });

    it('should throw error for invalid date strings', () => {
      const invalidDates = [
        'invalid-date',
        '2024-13-15', // Invalid month
        '2024-03-32', // Invalid day
        '2024-03-15T25:00:00Z', // Invalid hour
        '2024-03-15T12:60:00Z', // Invalid minute
        '2024-03-15T12:00:60Z', // Invalid second
        '', // Empty string
        ' ', // Whitespace
        '2024-03-15T12:00:00+25:00', // Invalid timezone offset
      ];

      invalidDates.forEach(dateString => {
        expect(() => parseDate(dateString)).toThrow('Invalid date string');
      });
    });

    it('should handle edge cases', () => {
      // Test leap year
      const leapYearDate = parseDate('2024-02-29');
      expect(leapYearDate.getFullYear()).toBe(2024);
      expect(leapYearDate.getMonth()).toBe(1); // February
      expect(leapYearDate.getDate()).toBe(29);

      // Test non-leap year
      expect(() => parseDate('2023-02-29')).toThrow('Invalid date string');
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      // Test various date formats
      const testCases = [
        {
          input: new Date('2024-03-15T12:00:00Z'),
          expected: '2024-03-15T12:00:00.000Z'
        },
        {
          input: new Date('2024-03-15T12:00:00.000Z'),
          expected: '2024-03-15T12:00:00.000Z'
        },
        {
          input: new Date('2024-03-15T12:00:00+00:00'),
          expected: '2024-03-15T12:00:00.000Z'
        },
        {
          input: new Date('2024-03-15'),
          expected: '2024-03-15T00:00:00.000Z'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(formatDate(input)).toBe(expected);
      });
    });

    it('should handle invalid dates', () => {
      const testInvalidDate = (invalidDate: any) => {
        expect(() => {
          formatDate(invalidDate);
        }).toThrow('Invalid date');
      };

      testInvalidDate(null);
      testInvalidDate(undefined);
      testInvalidDate('not a date');
      testInvalidDate(new Date('invalid'));
      testInvalidDate(new Date(NaN));
    });

    it('should handle edge cases', () => {
      // Test leap year
      const leapYearDate = new Date('2024-02-29');
      expect(formatDate(leapYearDate)).toBe('2024-02-29T00:00:00.000Z');

      // Test timezone edge cases
      const utcDate = new Date('2024-03-15T12:00:00Z');
      expect(formatDate(utcDate)).toBe('2024-03-15T12:00:00.000Z');
    });
  });
});
