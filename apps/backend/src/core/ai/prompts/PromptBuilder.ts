import { LifeTheme } from '../../life-theme';
import { Strength, Challenge, Pattern, CelestialBody, NodePlacement } from '../../ephemeris';
import { Transit } from '../../transit';
import { BirthChart } from '../../ephemeris';
import { HouseTheme, HouseLord } from '../../insight';
import { ICache } from '../../../infrastructure/cache/ICache';
import { config } from '../../../shared/config';
import { formatPrompt } from '../utils/aiUtils';

export class PromptBuilder {
  constructor(private readonly cache: ICache) {}

  static buildLifeThemePrompt(themeData: LifeTheme, useMarkdown = false): string {
    const header = `${config.ai.promptTags.lifeTheme} You are an expert astrologer. Provide a detailed insight based on the following life theme data.`;
    const content = {
      Theme: themeData.title,
      Description: themeData.description,
      'Supporting Aspects': themeData.supportingAspects.map(aspect => ({
        Planet1: aspect.body1,
        Planet2: aspect.body2,
        Aspect: aspect.type,
        Orb: aspect.orb
      })),
      Metadata: {
        Category: themeData.metadata.category,
        LifeAreas: themeData.metadata.lifeAreas,
        Intensity: themeData.metadata.intensity,
        Duration: themeData.metadata.duration
      }
    };
    return formatPrompt(header, content, useMarkdown);
  }

  static buildTransitPrompt(transitData: Transit, useMarkdown = false): string {
    const header = `${config.ai.promptTags.daily} You are an expert astrologer. Provide a detailed insight based on the following transit data.`;
    const content = {
      'Planet Name': transitData.planet,
      Sign: transitData.sign,
      House: transitData.house,
      Orb: transitData.orb,
      'Exact Date': transitData.exactDate.toISOString(),
      Influence: transitData.influence
    };
    return formatPrompt(header, content, useMarkdown);
  }

  static buildNatalChartPrompt(birthChart: BirthChart, useMarkdown = false): string {
    const header = `${config.ai.promptTags.nodePath} You are an expert astrologer. Provide a detailed insight based on the following natal chart data.`;
    const content = {
      Sun: birthChart.sun,
      Moon: birthChart.moon,
      Ascendant: birthChart.ascendant,
      Planets: birthChart.planets.map(planet => ({
        Name: planet.name,
        Sign: planet.sign,
        House: planet.house,
        Degree: planet.degree
      })),
      Aspects: birthChart.aspects.map(aspect => ({
        Planet1: aspect.body1,
        Planet2: aspect.body2,
        Aspect: aspect.type,
        Orb: aspect.orb
      })),
      'House Placements': birthChart.housePlacements.map(house => ({
        House: house.house,
        Sign: house.sign
      })),
      Chiron: {
        Sign: birthChart.chiron.sign,
        House: birthChart.chiron.house,
        Degree: birthChart.chiron.degree
      },
      'North Node': {
        Sign: birthChart.northNode.sign,
        House: birthChart.northNode.house,
        Degree: birthChart.northNode.degree
      },
      'South Node': {
        Sign: birthChart.southNode.sign,
        House: birthChart.southNode.house,
        Degree: birthChart.southNode.degree
      }
    };
    return formatPrompt(header, content, useMarkdown);
  }

  static buildStrengthsPrompt(strengths: Strength[], useMarkdown = false): string {
    const header = 'You are an expert astrologer. Provide insights based on the following strengths.';
    const content = strengths.map(strength => ({
      Area: strength.area,
      Description: strength.description,
      'Supporting Aspects': strength.supportingAspects
    }));
    return formatPrompt(header, content, useMarkdown);
  }

  static buildChallengesPrompt(challenges: Challenge[], useMarkdown = false): string {
    const header = 'You are an expert astrologer. Provide insights based on the following challenges.';
    const content = challenges.map(challenge => ({
      Area: challenge.area,
      Description: challenge.description,
      'Growth Opportunities': challenge.growthOpportunities,
      'Supporting Aspects': challenge.supportingAspects
    }));
    return formatPrompt(header, content, useMarkdown);
  }

  static buildPatternsPrompt(patterns: Pattern[], useMarkdown = false): string {
    const header = 'You are an expert astrologer. Provide insights based on the following patterns.';
    const content = patterns.map(pattern => ({
      Type: pattern.type,
      Description: pattern.description,
      Planets: pattern.planets,
      Houses: pattern.houses
    }));
    return formatPrompt(header, content, useMarkdown);
  }

  static buildHouseThemesPrompt(houseThemes: HouseTheme[], useMarkdown = false): string {
    const header = 'You are an expert astrologer. Provide insights based on the following house themes.';
    const content = houseThemes.map(theme => ({
      House: theme.house,
      Theme: theme.theme,
      Description: theme.description,
      Planets: theme.planets,
      Aspects: theme.aspects.map(aspect => ({
        Planet1: aspect.body1Id,
        Planet2: aspect.body2Id,
        Aspect: aspect.type,
        Orb: aspect.orb
      }))
    }));
    return formatPrompt(header, content, useMarkdown);
  }

  static buildHouseLordsPrompt(houseLords: HouseLord[], useMarkdown = false): string {
    const header = 'You are an expert astrologer. Provide insights based on the following house lords.';
    const content = houseLords.map(lord => ({
      House: lord.house,
      Lord: lord.lord,
      Dignity: lord.dignity,
      Influence: lord.influence,
      Aspects: lord.aspects
    }));
    return formatPrompt(header, content, useMarkdown);
  }

  static buildCoreIdentityPrompt(sun: CelestialBody, moon: CelestialBody, ascendant: number, useMarkdown = false): string {
    const header = 'You are an expert astrologer. Provide insights based on the core identity.';
    const content = {
      Sun: sun,
      Moon: moon,
      Ascendant: ascendant
    };
    return formatPrompt(header, content, useMarkdown);
  }

  static buildOverallSummaryPrompt(summary: { strengths: Strength[]; challenges: Challenge[]; patterns: Pattern[] }, useMarkdown = false): string {
    const header = 'You are an expert astrologer. Provide an overall summary based on the following insights.';
    const content = {
      Strengths: summary.strengths,
      Challenges: summary.challenges,
      Patterns: summary.patterns
    };
    return formatPrompt(header, content, useMarkdown);
  }

  static buildNodeInsightPrompt(nodes: { northNode: NodePlacement; southNode: NodePlacement }, useMarkdown = false): string {
    const header = 'You are an expert astrologer. Provide a soul growth-oriented insight based on the following node placements. Note: Using the Whole Sign House system.';
    const content = {
      'North Node': {
        Sign: nodes.northNode.sign,
        House: nodes.northNode.house,
        Degree: nodes.northNode.degree,
        Themes: 'Soul path and future growth themes'
      },
      'South Node': {
        Sign: nodes.southNode.sign,
        House: nodes.southNode.house,
        Degree: nodes.southNode.degree,
        Themes: 'Karmic past patterns and comfort zones'
      },
      'Integration Themes': 'Key lessons for integrating North and South Node insights'
    };
    return formatPrompt(header, content, useMarkdown);
  }

  static buildDailyInsightPrompt(
    birthChart: BirthChart,
    transits: Transit[],
    currentDate: Date,
    useMarkdown = false
  ): string {
    const header = `You are an expert astrologer. Provide a personalized daily forecast for ${currentDate.toDateString()} based on the user's natal chart and the current transits. Focus on energy shifts, guidance, and empowering insight. Use the Whole Sign House system.`;

    const content = {
      Date: currentDate.toISOString(),
      NatalChart: {
        Sun: birthChart.sun,
        Moon: birthChart.moon,
        Ascendant: birthChart.ascendant,
        Planets: birthChart.planets,
        Aspects: birthChart.aspects,
        HousePlacements: birthChart.housePlacements,
        Chiron: birthChart.chiron,
        NorthNode: birthChart.northNode,
        SouthNode: birthChart.southNode
      },
      CurrentTransits: transits.map(transit => ({
        Planet: transit.planet,
        Sign: transit.sign,
        House: transit.house,
        Orb: transit.orb,
        AspectingNatal: transit.aspectingNatal,
        ExactDate: transit.exactDate.toISOString(),
        Influence: transit.influence
      }))
    };

    return formatPrompt(header, content, useMarkdown);
  }

  static buildSmartTimingPrompt(
    birthChart: BirthChart,
    transits: Transit[],
    currentDate: Date,
    useMarkdown = false
  ): string {
    const header = `You are an expert astrologer. Analyze the current transits and the user's natal chart to identify meaningful time windows. Classify them into Opportunity, Challenge, or Integration. Use the Whole Sign House system.`;

    const content = {
      Date: currentDate.toISOString(),
      NatalChart: {
        Sun: birthChart.sun,
        Moon: birthChart.moon,
        Ascendant: birthChart.ascendant,
        Planets: birthChart.planets,
        Aspects: birthChart.aspects,
        HousePlacements: birthChart.housePlacements,
        Chiron: birthChart.chiron,
        NorthNode: birthChart.northNode,
        SouthNode: birthChart.southNode
      },
      CurrentTransits: transits.map(transit => ({
        Planet: transit.planet,
        Sign: transit.sign,
        House: transit.house,
        Orb: transit.orb,
        AspectingNatal: transit.aspectingNatal,
        ExactDate: transit.exactDate.toISOString(),
        Influence: transit.influence
      }))
    };

    return formatPrompt(header, content, useMarkdown);
  }

  static buildWeeklyDigestPrompt(
    birthChart: BirthChart,
    transits: Transit[],
    insights: string[],
    startDate: Date,
    useMarkdown = false
  ): string {
    const header = `You are an expert astrologer. Generate a weekly astrological digest for the week starting ${startDate.toISOString()}. 
    Consider the following transits and their interpretations:
    
    Provide a comprehensive weekly overview that includes:
    1. Key themes and energies
    2. Important dates and timing
    3. Areas of focus and opportunity
    4. Potential challenges and growth points
    5. Practical guidance and recommendations`;

    const content = {
      Date: startDate.toISOString(),
      NatalChart: {
        Sun: birthChart.sun,
        Moon: birthChart.moon,
        Ascendant: birthChart.ascendant,
        Planets: birthChart.planets,
        Aspects: birthChart.aspects,
        HousePlacements: birthChart.housePlacements,
        Chiron: birthChart.chiron,
        NorthNode: birthChart.northNode,
        SouthNode: birthChart.southNode
      },
      CurrentTransits: transits.map(transit => ({
        Planet: transit.planet,
        Sign: transit.sign,
        House: transit.house,
        Orb: transit.orb,
        AspectingNatal: transit.aspectingNatal,
        ExactDate: transit.exactDate.toISOString(),
        Influence: transit.influence
      })),
      IndividualTransitInsights: insights
    };

    return formatPrompt(header, content, useMarkdown);
  }

  static buildThemeForecastPrompt(
    birthChart: BirthChart,
    themes: LifeTheme[],
    transits: Transit[],
    useMarkdown = false
  ): string {
    const header = `You are an expert astrologer. Generate a thematic forecast based on the natal chart themes and current transits.
    
    Analyze how current transits are activating or challenging the established life themes.
    Include:
    1. Theme activation and timing
    2. Growth opportunities
    3. Potential challenges
    4. Integration strategies
    5. Key dates and windows of opportunity`;

    const content = {
      Date: new Date().toISOString(),
      NatalChart: {
        Sun: birthChart.sun,
        Moon: birthChart.moon,
        Ascendant: birthChart.ascendant,
        Planets: birthChart.planets,
        Aspects: birthChart.aspects,
        HousePlacements: birthChart.housePlacements,
        Chiron: birthChart.chiron,
        NorthNode: birthChart.northNode,
        SouthNode: birthChart.southNode
      },
      LifeThemes: themes.map(theme => ({
        Title: theme.title,
        Description: theme.description,
        Key: theme.key,
        SupportingAspects: theme.supportingAspects,
        Metadata: theme.metadata
      })),
      CurrentTransits: transits.map(transit => ({
        Planet: transit.planet,
        Sign: transit.sign,
        House: transit.house,
        Orb: transit.orb,
        AspectingNatal: transit.aspectingNatal,
        ExactDate: transit.exactDate.toISOString(),
        Influence: transit.influence
      }))
    };

    return formatPrompt(header, content, useMarkdown);
  }
} 