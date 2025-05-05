import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../../domain/errors';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

interface RequestData {
  body?: unknown;
  params?: ParamsDictionary;
  query?: ParsedQs;
}

export const validateRequest = <T extends RequestData>(schema: z.ZodType<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = {
        body: req.body,
        params: req.params,
        query: req.query
      };

      const validatedData = await schema.parseAsync(dataToValidate);

      // Update the request objects with validated data
      if (validatedData.body) req.body = validatedData.body;
      if (validatedData.params) req.params = validatedData.params;
      if (validatedData.query) req.query = validatedData.query;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        // Create a detailed error message
        const errorMessage = errors.map(err => 
          `${err.field}: ${err.message}`
        ).join(', ');

        const validationError = new ValidationError(errorMessage);
        validationError.statusCode = 400;
        validationError.details = {
          errors: errors.map(err => ({ ...err }))
        };
        
        next(validationError);
        return;
      }
      next(error);
    }
  };
}; 