import { IBirthChart } from '../types/birthChart.types';
import { BirthChart, CelestialBody, Aspect, Houses, HouseSystem, Angles } from '../../ephemeris/types/ephemeris.types';

const VALID_HOUSE_SYSTEMS = ['Placidus', 'Koch', 'Porphyrius', 'Regiomontanus', 'Campanus', 'Equal', 'Whole Sign'] as const;

export function adaptCelestialBody(body: Partial<CelestialBody>): CelestialBody {
  return {
    id: body.id || 0,
    name: body.name || '',
    longitude: body.longitude || 0,
    latitude: body.latitude || 0,
    speed: body.speed || 0,
    house: body.house || 0,
    sign: body.sign || '',
    retrograde: body.speed ? body.speed < 0 : false
  };
}

export function adaptAspectData(aspect: Partial<Aspect>): Aspect {
  return {
    body1: aspect.body1 || '',
    body2: aspect.body2 || '',
    type: aspect.type || '',
    orb: aspect.orb || 0,
    isApplying: aspect.isApplying || false
  };
}

export function adaptHouseData(houses: { cusps: number[]; system: string }): Houses {
  const validSystem = VALID_HOUSE_SYSTEMS.includes(houses.system as HouseSystem) 
    ? houses.system as HouseSystem 
    : 'Placidus';

  return {
    system: validSystem,
    cusps: houses.cusps || []
  };
}

export function adaptAngles(angles: { ascendant: number; mc: number; ic: number; descendant: number }): Angles {
  return {
    ascendant: angles.ascendant,
    midheaven: angles.mc,
    descendant: angles.descendant,
    imumCoeli: angles.ic
  };
}

export function adaptBirthChartData(birthChart: IBirthChart): BirthChart {
  return {
    datetime: birthChart.datetime,
    location: birthChart.location,
    bodies: birthChart.bodies.map(adaptCelestialBody),
    houses: adaptHouseData(birthChart.houses),
    aspects: birthChart.aspects.map(adaptAspectData),
    angles: adaptAngles(birthChart.angles),
    sun: birthChart.sun,
    moon: birthChart.moon,
    ascendant: birthChart.angles.ascendant,
    planets: birthChart.planets,
    housePlacements: birthChart.housePlacements,
    chiron: birthChart.chiron,
    northNode: birthChart.northNode,
    southNode: birthChart.southNode
  };
} 