import { ICache } from '../types/cache';
import { DateTime, GeoPosition, CelestialBody, HouseSystem, IHouse } from '@pulsewisdom/astro';
import { ValidationError } from '../types/errors';
import { IBirthChart, BirthChart } from '../models/BirthChart';
import { Types } from 'mongoose';


export class BirthChartService {
  private ephemerisCalculator: EphemerisCalculator;

  constructor(private cache: ICache) {
    this.ephemerisCalculator = new EphemerisCalculator();
  }

  async createBirthChart(userId: string, datetime: DateTime, location: GeoPosition): Promise<IBirthChart> {
    try {
      // Calculate birth chart data using ephemeris
      const chart = await this.calculateBirthChart(datetime, location);
      
      // Convert DateTime to Date
      const date = new Date(
        datetime.year,
        datetime.month - 1,
        datetime.day,
        datetime.hour,
        datetime.minute,
        datetime.second
      );
      
      // Create birth chart record using Mongoose model
      const birthChart = new BirthChart({
        userId: new Types.ObjectId(userId),
        datetime: date,
        location,
        bodies: chart.bodies,
        houses: chart.houses,
        aspects: chart.aspects,
        angles: chart.angles,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Save to database
      await birthChart.save();

      // Cache the birth chart
      await this.cache.set(`birthChart:${birthChart._id}`, birthChart);

      return birthChart;
    } catch (error) {
      console.error('Error creating birth chart:', error);
      throw new ValidationError('Failed to create birth chart');
    }
  }

  async getBirthChartById(id: string): Promise<IBirthChart | null> {
    try {
      return await this.cache.get<IBirthChart>(`birthChart:${id}`);
    } catch (error) {
      console.error('Error getting birth chart:', error);
      throw new ValidationError('Failed to get birth chart');
    }
  }

  async updateBirthChart(id: string, updates: Partial<IBirthChart>): Promise<IBirthChart | null> {
    try {
      const chart = await this.getBirthChartById(id);
      if (!chart) {
        return null;
      }

      const updatedChart = {
        ...chart,
        ...updates,
        updatedAt: new Date()
      } as IBirthChart;

      await this.cache.set(`birthChart:${id}`, updatedChart);
      return updatedChart;
    } catch (error) {
      console.error('Error updating birth chart:', error);
      throw new ValidationError('Failed to update birth chart');
    }
  }

  async deleteBirthChart(id: string): Promise<boolean> {
    try {
      await this.cache.delete(`birthChart:${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting birth chart:', error);
      throw new ValidationError('Failed to delete birth chart');
    }
  }

  async getBirthChartsByUserId(userId: string): Promise<IBirthChart[]> {
    try {
      // In a real implementation, you would query a database
      // For now, we'll return an empty array
      return [];
    } catch (error) {
      console.error('Error getting birth charts:', error);
      throw new ValidationError('Failed to get birth charts');
    }
  }

  async calculateBirthChart(datetime: DateTime, location: GeoPosition): Promise<{
    houses: HouseSystem;
    bodies: CelestialBody[];
    aspects: Array<{
      body1Id: number;
      body2Id: number;
      type: string;
      angle: number;
      orb: number;
      isApplying: boolean;
    }>;
    angles: {
      ascendant: number;
      midheaven: number;
      descendant: number;
      imumCoeli: number;
    };
  }> {
    try {
      // Convert DateTime to Date
      const date = new Date(
        datetime.year,
        datetime.month - 1,
        datetime.day,
        datetime.hour,
        datetime.minute,
        datetime.second
      );

      // Calculate all celestial bodies including nodes
      const bodies = await this.ephemerisCalculator.calculateBodies(date);

      // Calculate houses with rulers
      const houses = await this.ephemerisCalculator.calculateHouses(date, location, 'P');

      // Calculate aspects between all bodies
      const aspects = this.ephemerisCalculator.calculateAspects(bodies);

      // Calculate angles
      const angles = await this.ephemerisCalculator.calculateAngles(date, location);

      return {
        houses: {
          system: 'P',
          cusps: houses.map(h => h.cusp)
        },
        bodies,
        aspects,
        angles
      };
    } catch (error) {
      console.error('Error calculating birth chart:', error);
      throw new ValidationError('Failed to calculate birth chart');
    }
  }
} 