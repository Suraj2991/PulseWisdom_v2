import { z } from 'zod';
import { HOUSE_SYSTEMS } from '../../../shared/constants/astrology';
import { DateTime, GeoPosition } from '../../ephemeris/types/ephemeris.types';

// Base schemas
export const datetimeSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  second: z.number().int().min(0).max(59),
  timezone: z.string().min(1, 'Timezone is required')
});

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  placeName: z.string().min(1, 'Place name is required').optional()
});

export const houseSystemSchema = z.enum(Object.values(HOUSE_SYSTEMS) as [string, ...string[]]);

export const celestialBodySchema = z.object({
  name: z.string(),
  longitude: z.number(),
  latitude: z.number(),
  distance: z.number(),
  speed: z.number(),
  isRetrograde: z.boolean(),
  house: z.number().int().min(1).max(12),
  sign: z.string(),
  signLongitude: z.number()
});

export const aspectSchema = z.object({
  body1: z.string(),
  body2: z.string(),
  type: z.string(),
  orb: z.number(),
  isApplying: z.boolean().optional()
});

export const anglesSchema = z.object({
  ascendant: z.number(),
  mc: z.number(),
  ic: z.number(),
  descendant: z.number()
});

export const housesSchema = z.object({
  cusps: z.array(z.number()),
  system: houseSystemSchema
});

// Validation schemas
export const birthChartValidations = {
  createBirthChart: z.object({
    params: z.object({
      userId: z.string().min(1, 'User ID is required')
    }),
    body: z.object({
      datetime: datetimeSchema,
      location: locationSchema,
      houseSystem: houseSystemSchema.optional()
    })
  }),

  getBirthChartById: z.object({
    params: z.object({
      birthChartId: z.string().min(1, 'Birth chart ID is required')
    })
  }),

  updateBirthChart: z.object({
    params: z.object({
      birthChartId: z.string().min(1, 'Birth chart ID is required')
    }),
    body: z.object({
      datetime: datetimeSchema.optional(),
      location: locationSchema.optional(),
      houseSystem: houseSystemSchema.optional(),
      bodies: z.array(celestialBodySchema).optional(),
      aspects: z.array(aspectSchema).optional(),
      angles: anglesSchema.optional(),
      houses: housesSchema.optional()
    })
  }),

  deleteBirthChart: z.object({
    params: z.object({
      birthChartId: z.string().min(1, 'Birth chart ID is required')
    })
  }),

  getBirthChartsByUserId: z.object({
    params: z.object({
      userId: z.string().min(1, 'User ID is required')
    }),
    query: z.object({
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional()
    })
  }),

  calculateBirthChart: z.object({
    body: z.object({
      datetime: datetimeSchema,
      location: locationSchema,
      houseSystem: houseSystemSchema.optional()
    })
  })
}; 