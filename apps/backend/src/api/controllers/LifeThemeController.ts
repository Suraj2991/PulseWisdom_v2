import { Request, Response, NextFunction } from 'express';
import { LifeThemeService } from '../services/LifeThemeService';
import { ValidationError, NotFoundError } from '../types/errors';
import { LifeTheme } from '../types/lifeTheme.types';

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

      const analysis = await this.lifeThemeService.analyzeLifeThemes(birthChartId);
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
    if (themes.coreIdentity) {
      const { ascendant, sunSign, moonSign, description } = themes.coreIdentity;
      if (!ascendant || !sunSign || !moonSign || !description) {
        throw new ValidationError('Core identity must include ascendant, sunSign, moonSign, and description');
      }
    }

    if (themes.strengths) {
      themes.strengths.forEach(strength => {
        if (!strength.area || !strength.description || !Array.isArray(strength.supportingAspects)) {
          throw new ValidationError('Each strength must include area, description, and supportingAspects array');
        }
      });
    }

    if (themes.challenges) {
      themes.challenges.forEach(challenge => {
        if (!challenge.area || !challenge.description || !Array.isArray(challenge.growthOpportunities)) {
          throw new ValidationError('Each challenge must include area, description, and growthOpportunities array');
        }
      });
    }

    if (themes.patterns) {
      themes.patterns.forEach(pattern => {
        if (!pattern.type || !pattern.description || !Array.isArray(pattern.planets) || !Array.isArray(pattern.houses)) {
          throw new ValidationError('Each pattern must include type, description, planets array, and houses array');
        }
      });
    }

    if (themes.lifeThemes) {
      themes.lifeThemes.forEach(theme => {
        if (!theme.theme || !theme.description || !Array.isArray(theme.supportingFactors) || !theme.manifestation) {
          throw new ValidationError('Each life theme must include theme, description, supportingFactors array, and manifestation');
        }
      });
    }

    if (themes.houseLords) {
      themes.houseLords.forEach(lord => {
        if (!lord.house || !lord.lord || !lord.dignity || !lord.influence || !Array.isArray(lord.aspects)) {
          throw new ValidationError('Each house lord must include house, lord, dignity, influence, and aspects array');
        }
      });
    }
  }
} 