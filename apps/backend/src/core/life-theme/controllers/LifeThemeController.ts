import { Request, Response, NextFunction } from 'express';
import { LifeThemeService
  , LifeTheme
  , LifeThemeKey
  , ThemeCategory
  , LifeArea  } from '../../life-theme';
import { ValidationError, NotFoundError } from '../../../domain/errors';

export class LifeThemeController {
  constructor(private lifeThemeService: LifeThemeService) {}

  /**
   * Analyze life themes for a birth chart
   */
  public analyzeLifeThemes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { birthChartId } = req.params;

      if (!birthChartId) {
        throw new ValidationError('Birth chart ID is required');
      }

      const analysis = await this.lifeThemeService.analyzeLifeThemes({ birthChartId });
      res.status(200).json(analysis);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
        return;
      }
      next(error);
    }
  };

  /**
   * Get life themes by user ID
   */
  public getLifeThemesByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const analyses = await this.lifeThemeService.getLifeThemesByUserId(userId);
      res.status(200).json(analyses);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
        return;
      }
      next(error);
    }
  };

  /**
   * Update life themes for a birth chart
   */
  public updateLifeThemes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { birthChartId } = req.params;
      const themes = req.body;
      
      if (!birthChartId) {
        throw new ValidationError('Birth chart ID is required');
      }

      if (!themes || typeof themes !== 'object') {
        throw new ValidationError('Invalid themes data');
      }

      // Validate required fields
      this.validateThemes(themes);

      const analysis = await this.lifeThemeService.updateLifeThemes(birthChartId, themes);
      res.status(200).json(analysis);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
        return;
      }
      next(error);
    }
  };

  private validateThemes(themes: Partial<LifeTheme>) {
    if (!themes.key || !Object.values(LifeThemeKey).includes(themes.key)) {
      throw new ValidationError('Valid life theme key is required');
    }

    if (!themes.title || typeof themes.title !== 'string') {
      throw new ValidationError('Title is required and must be a string');
    }

    if (!themes.description || typeof themes.description !== 'string') {
      throw new ValidationError('Description is required and must be a string');
    }

    if (themes.metadata) {
      const { requiresUserAction, associatedPlanets, lifeAreas, category, intensity, duration } = themes.metadata;
      
      if (typeof requiresUserAction !== 'boolean') {
        throw new ValidationError('requiresUserAction must be a boolean');
      }

      if (!Array.isArray(associatedPlanets)) {
        throw new ValidationError('associatedPlanets must be an array');
      }

      if (!Array.isArray(lifeAreas) || !lifeAreas.every(area => Object.values(LifeArea).includes(area))) {
        throw new ValidationError('lifeAreas must be an array of valid LifeArea values');
      }

      if (!category || !Object.values(ThemeCategory).includes(category)) {
        throw new ValidationError('Valid theme category is required');
      }

      if (!intensity || !['low', 'medium', 'high'].includes(intensity)) {
        throw new ValidationError('Valid intensity level is required');
      }

      if (!duration || !['short', 'medium', 'long'].includes(duration)) {
        throw new ValidationError('Valid duration is required');
      }
    }

    if (themes.supportingAspects) {
      if (!Array.isArray(themes.supportingAspects)) {
        throw new ValidationError('supportingAspects must be an array');
      }

      themes.supportingAspects.forEach(aspect => {
        if (!aspect.body1 || !aspect.body2 || !aspect.type || typeof aspect.orb !== 'number') {
          throw new ValidationError('Each aspect must include body1, body2, type, and orb');
        }
      });
    }

    if (themes.insights) {
      if (!Array.isArray(themes.insights)) {
        throw new ValidationError('insights must be an array');
      }
    }
  }
} 