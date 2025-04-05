import { DateTime, GeoPosition, HouseSystem } from '../../types/ephemeris.types';
import { Context } from '../../types/context';
import { BirthChart } from '../../types/ephemeris.types';

export const resolvers = {
  Query: {
    birthChart: async (_: any, { id }: { id: string }, context: Context) => {
      return context.birthChartService.getBirthChartById(id);
    },
    birthCharts: async (_: any, { userId }: { userId: string }, context: Context) => {
      return context.birthChartService.getBirthChartsByUserId(userId);
    },
    calculateBirthChart: async (
      _: any,
      { datetime, location, houseSystem }: { datetime: DateTime; location: GeoPosition; houseSystem?: HouseSystem },
      context: Context
    ) => {
      return context.birthChartService.calculateBirthChart(datetime, location, houseSystem);
    }
  },

  Mutation: {
    calculateBirthChart: async (
      _: any,
      { datetime, location, houseSystem }: { datetime: DateTime; location: GeoPosition; houseSystem?: HouseSystem },
      context: Context
    ) => {
      return context.birthChartService.calculateBirthChart(datetime, location, houseSystem);
    }
  }
}; 