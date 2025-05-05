import { IBirthChart } from '../types/birthChart.types';
import { Planet, Aspect, Houses, CelestialBody, HouseSystem } from '../../ephemeris/types/ephemeris.types';

const VALID_HOUSE_SYSTEMS = ['Placidus', 'Koch', 'Porphyrius', 'Regiomontanus', 'Campanus', 'Equal', 'Whole Sign'] as const;

export const adaptBirthChartData = (data: IBirthChart) => {
  return {
    ...data,
    bodies: data.bodies.map(adaptCelestialBody),
    aspects: data.aspects.map(adaptAspectData),
    houses: adaptHouseData(data.houses),
    angles: {
      ascendant: data.angles.ascendant,
      midheaven: data.angles.mc,
      descendant: data.angles.descendant,
      imumCoeli: data.angles.ic
    },
    sun: data.sun,
    moon: data.moon,
    ascendant: data.angles.ascendant,
    planets: data.planets,
    housePlacements: data.housePlacements,
    chiron: data.chiron,
    northNode: data.northNode,
    southNode: data.southNode
  };
};

const adaptCelestialBody = (body: CelestialBody) => ({
  id: body.id,
  name: body.name,
  longitude: body.longitude,
  latitude: body.latitude,
  speed: body.speed,
  house: body.house,
  sign: body.sign,
  signLongitude: body.signLongitude
});

const adaptAspectData = (aspect: { body1: string; body2: string; type: string; orb: number; isApplying?: boolean }) => ({
  body1: aspect.body1,
  body2: aspect.body2,
  type: aspect.type,
  orb: aspect.orb,
  isApplying: aspect.isApplying ?? false
});

const adaptHouseData = (houses: { cusps: number[]; system: string }) => {
  if (!VALID_HOUSE_SYSTEMS.includes(houses.system as any)) {
    throw new Error(`Invalid house system: ${houses.system}`);
  }
  return {
    cusps: houses.cusps,
    system: houses.system as HouseSystem
  };
}; 