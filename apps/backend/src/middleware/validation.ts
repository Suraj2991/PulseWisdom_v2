import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// User input validation schema
const userSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  birthDate: z.string().datetime('Invalid date format'),
  birthTime: z.string().optional(),
  birthLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    placeName: z.string().min(1),
  }),
  preferences: z.object({
    timezone: z.string(),
    houseSystem: z.enum(['placidus', 'equal']),
    aspectOrbs: z.number().min(0).max(12),
  }),
});

// Birth chart validation schema
const birthChartSchema = z.object({
  date: z.string().datetime('Invalid date format'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    placeName: z.string().min(1),
  }),
  ascendant: z.number().min(0).max(360),
  mc: z.number().min(0).max(360),
  houses: z.array(z.object({
    number: z.number().min(1).max(12),
    cusp: z.number().min(0).max(360),
    nextCusp: z.number().min(0).max(360),
    size: z.number().min(0).max(360),
    rulerId: z.number().min(0).max(9),
  })),
  bodies: z.array(z.object({
    bodyId: z.number().min(0).max(9),
    longitude: z.number().min(0).max(360),
    latitude: z.number().min(-90).max(90),
    distance: z.number().positive(),
    speed: z.number(),
    house: z.number().min(1).max(12),
  })),
  aspects: z.array(z.object({
    body1Id: z.number().min(0).max(9),
    body2Id: z.number().min(0).max(9),
    type: z.string(),
    angle: z.number().min(0).max(360),
    orb: z.number().min(0).max(12),
    isApplying: z.boolean(),
  })),
  houseSystem: z.enum(['placidus', 'equal']),
});

// Validation middleware
export const validateUserInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    userSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const validateBirthChartInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    birthChartSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}; 