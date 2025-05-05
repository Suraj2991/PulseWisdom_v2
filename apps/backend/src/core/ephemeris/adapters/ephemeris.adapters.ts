import { DateTime
  , CelestialBody
  ,  Houses
  , Aspect
  , HouseSystem
  , CelestialPosition
  , AspectResponse
  , HouseResponse } from '../../ephemeris';
import { ZODIAC_SIGNS } from '../../../shared/constants/astrology';

export class EphemerisAdapter {
  /**
   * Converts a JavaScript Date to our DateTime type
   */
  static toDateTime(date: Date): DateTime {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes()
    };
  }

  /**
   * Converts our DateTime type to JavaScript Date
   */
  static toDate(datetime: DateTime): DateTime {
    return {
      year: datetime.year,
      month: datetime.month,
      day: datetime.day,
      hour: datetime.hour,
      minute: datetime.minute
    };
  }

  /**
   * Gets zodiac sign from longitude
   */
  static getSignFromLongitude(longitude: number): string {
    const signIndex = Math.floor(longitude / 30) % 12;
    return ZODIAC_SIGNS[signIndex];
  }

  /**
   * Gets longitude within sign (0-29.999...)
   */
  static getSignLongitude(longitude: number): number {
    return longitude % 30;
  }

  /**
   * Converts a CelestialPosition to our domain CelestialBody type
   */
  static toDomainCelestialBody(position: CelestialPosition, name: string, house = 1): CelestialBody {
    return {
      id: 0, // This should be assigned by the service layer
      name,
      longitude: position.longitude,
      latitude: position.latitude,
      speed: position.speed,
      house,
      sign: this.getSignFromLongitude(position.longitude),
      signLongitude: this.getSignLongitude(position.longitude)
    };
  }

  /**
   * Converts ephemeris celestial body to domain celestial bodies array
   */
  static toDomainCelestialBodies(ephemerisBodies: Record<string, CelestialPosition>, houses: HouseResponse[]): CelestialBody[] {
    const bodies: CelestialBody[] = [];
    const celestialKeys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const;
    
    for (const key of celestialKeys) {
      const position = ephemerisBodies[key];
      if (this.isCelestialPosition(position)) {
        const house = this.findHouse(position.longitude, houses);
        bodies.push(this.toDomainCelestialBody(position, key, house));
      }
    }

    // Handle optional bodies
    if (ephemerisBodies.chiron && this.isCelestialPosition(ephemerisBodies.chiron)) {
      bodies.push(this.toDomainCelestialBody(ephemerisBodies.chiron, 'chiron', 
        this.findHouse(ephemerisBodies.chiron.longitude, houses)));
    }
    if (ephemerisBodies.northNode && this.isCelestialPosition(ephemerisBodies.northNode)) {
      bodies.push(this.toDomainCelestialBody(ephemerisBodies.northNode, 'northNode',
        this.findHouse(ephemerisBodies.northNode.longitude, houses)));
    }
    if (ephemerisBodies.southNode && this.isCelestialPosition(ephemerisBodies.southNode)) {
      bodies.push(this.toDomainCelestialBody(ephemerisBodies.southNode, 'southNode',
        this.findHouse(ephemerisBodies.southNode.longitude, houses)));
    }

    return bodies;
  }

  /**
   * Type guard for CelestialPosition
   */
  private static isCelestialPosition(value: any): value is CelestialPosition {
    return value && typeof value === 'object' && 
           'longitude' in value && typeof value.longitude === 'number' &&
           'latitude' in value && typeof value.latitude === 'number' &&
           'speed' in value && typeof value.speed === 'number';
  }

  /**
   * Converts ephemeris aspects to domain aspects
   */
  static toDomainAspects(aspectResponses: AspectResponse[]): Aspect[] {
    return aspectResponses.map(aspect => ({
      body1: aspect.body1,
      body2: aspect.body2,
      type: aspect.aspectType,
      orb: aspect.orb,
      isApplying: aspect.exact
    }));
  }

  /**
   * Converts house responses to domain houses
   */
  static toDomainHouses(houseResponses: HouseResponse[]): Houses {
    return {
      system: 'Placidus' as HouseSystem, // This should be passed in from the service layer
      cusps: houseResponses.map(house => house.cusp)
    };
  }

  /**
   * Finds the house number for a given longitude
   */
  private static findHouse(longitude: number, houses: HouseResponse[]): number {
    for (let i = 0; i < houses.length; i++) {
      const nextHouse = houses[(i + 1) % houses.length];
      if (longitude >= houses[i].cusp && longitude < nextHouse.cusp) {
        return houses[i].number;
      }
    }
    return 1; // Default to first house if not found
  }
} 