export const ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ] as const;
  
  export const ASPECT_ORBS = {
    conjunction: 8,
    opposition: 8,
    square: 8,
    trine: 8,
    sextile: 6,
    semiSquare: 4,
    sesquisquare: 4,
    quincunx: 3,
    semiSextile: 3
  } as const;
  
  export const ASPECT_ANGLES = {
    conjunction: 0,
    opposition: 180,
    square: 90,
    trine: 120,
    sextile: 60,
    semiSquare: 45,
    sesquisquare: 135,
    quincunx: 150,
    semiSextile: 30
  } as const;
  
  export const PLANET_STRENGTHS = {
    sun: 1,
    moon: 1,
    mercury: 1,
    venus: 1,
    mars: 1,
    jupiter: 2,
    saturn: 2,
    uranus: 3,
    neptune: 3,
    pluto: 3
  } as const;
  
  export const HOUSE_SYSTEMS = {
    PLACIDUS: 'PLACIDUS',
    EQUAL: 'EQUAL',
    WHOLE_SIGN: 'WHOLE_SIGN',
    KOCH: 'KOCH',
    CAMPANUS: 'CAMPANUS',
    REGIOMONTANUS: 'REGIOMONTANUS',
    TOPOCENTRIC: 'TOPOCENTRIC',
    MORINUS: 'MORINUS',
    PORPHYRIUS: 'PORPHYRIUS',
    ALCABITIUS: 'ALCABITIUS'
  } as const;
  
  export const TRANSIT_WINDOW_DAYS = 45;
  export const TRANSIT_WINDOW_DURATION = 7;
  
  export const CELESTIAL_BODIES = {
    ...PLANET_STRENGTHS,
    chiron: 0.8,
    northNode: 0.8,
    southNode: 0.8
  } as const;
  
  export type AspectType = keyof typeof ASPECT_ANGLES;
  export type HouseSystem = typeof HOUSE_SYSTEMS[keyof typeof HOUSE_SYSTEMS];
  export type ZodiacSign = typeof ZODIAC_SIGNS[number];
  export type PlanetStrength = typeof PLANET_STRENGTHS[keyof typeof PLANET_STRENGTHS];