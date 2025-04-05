import { BirthChart } from '../../types/ephemeris.types';

export class MockEphemerisCalculator {
  private static instance: MockEphemerisCalculator;

  constructor() {}

  static getInstance(): MockEphemerisCalculator {
    if (!MockEphemerisCalculator.instance) {
      MockEphemerisCalculator.instance = new MockEphemerisCalculator();
    }
    return MockEphemerisCalculator.instance;
  }

  initialize = jest.fn();
  calculateBirthChart = jest.fn().mockResolvedValue({
    datetime: {
      year: 1990,
      month: 1,
      day: 1,
      hour: 12,
      minute: 0,
      second: 0,
      timezone: 0
    },
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      placeName: 'New York'
    },
    houses: [
      { number: 1, degree: 0, sign: 'Aries', element: 'Fire', modality: 'Cardinal' },
      { number: 2, degree: 30, sign: 'Taurus', element: 'Earth', modality: 'Fixed' },
      { number: 3, degree: 60, sign: 'Gemini', element: 'Air', modality: 'Mutable' }
    ],
    bodies: [
      { bodyId: 0, longitude: 0, latitude: 0, distance: 1, speed: 1, retrograde: false, house: 1 },
      { bodyId: 1, longitude: 30, latitude: 0, distance: 1, speed: 1, retrograde: false, house: 2 }
    ],
    aspects: [
      { body1: 'Sun', body2: 'Moon', type: 'Conjunction', degree: 0 }
    ],
    angles: {
      ascendant: { degree: 0, sign: 'Aries' },
      mc: { degree: 90, sign: 'Cancer' },
      ic: { degree: 270, sign: 'Capricorn' },
      descendant: { degree: 180, sign: 'Libra' }
    }
  } as unknown as BirthChart);
  calculateBodyPosition = jest.fn();
  calculateTransits = jest.fn();
  cleanup = jest.fn();
  calculateNodes = jest.fn();
  calculateHouses = jest.fn();
  calculateAspects = jest.fn();
  calculateDignity = jest.fn();
} 