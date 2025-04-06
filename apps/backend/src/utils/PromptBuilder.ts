import { LifeTheme } from '../domain/types/lifeTheme.types';
import { Strength, Challenge, Pattern, CelestialBody, NodePlacement } from '../domain/types/ephemeris.types';
import { Transit } from '../domain/types/transit.types';
import { BirthChart } from '../domain/types/ephemeris.types';
import { HouseTheme, HouseLord } from '../domain/types/insight.types';

export class PromptBuilder {
  static buildLifeThemePrompt(themeData: LifeTheme, useMarkdown: boolean = false): string {
    const header = 'You are an expert astrologer. Provide a detailed insight based on the following life theme data.';
    const content = {
      Theme: themeData.theme,
      Description: themeData.description,
      Influences: themeData.influences,
      'Planetary Aspects': themeData.planetaryAspects.map(aspect => ({
        Planet: aspect.planet,
        Aspect: aspect.aspect,
        Influence: aspect.influence
      }))
    };
    return this.formatPrompt(header, content, useMarkdown);
  }

  static buildTransitPrompt(transitData: Transit, useMarkdown: boolean = false): string {
    const header = 'You are an expert astrologer. Provide a detailed insight based on the following transit data.';
    const content = {
      'Planet Name': transitData.planet,
      Sign: transitData.sign,
      House: transitData.house,
      Orb: transitData.orb,
      'Exact Date': transitData.exactDate.toISOString(),
      Influence: transitData.influence
    };
    return this.formatPrompt(header, content, useMarkdown);
  }

  static buildNatalChartPrompt(birthChart: BirthChart, useMarkdown: boolean = false): string {
    const header = 'You are an expert astrologer. Provide a detailed insight based on the following natal chart data.';
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
        Planet1: aspect.planet1,
        Planet2: aspect.planet2,
        Aspect: aspect.aspect,
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
    return this.formatPrompt(header, content, useMarkdown);
  }

  static buildStrengthsPrompt(strengths: Strength[], useMarkdown: boolean = false): string {
    const header = 'You are an expert astrologer. Provide insights based on the following strengths.';
    const content = strengths.map(strength => ({
      Area: strength.area,
      Description: strength.description,
      'Supporting Aspects': strength.supportingAspects
    }));
    return this.formatPrompt(header, content, useMarkdown);
  }

  static buildChallengesPrompt(challenges: Challenge[], useMarkdown: boolean = false): string {
    const header = 'You are an expert astrologer. Provide insights based on the following challenges.';
    const content = challenges.map(challenge => ({
      Area: challenge.area,
      Description: challenge.description,
      'Growth Opportunities': challenge.growthOpportunities,
      'Supporting Aspects': challenge.supportingAspects
    }));
    return this.formatPrompt(header, content, useMarkdown);
  }

  static buildPatternsPrompt(patterns: Pattern[], useMarkdown: boolean = false): string {
    const header = 'You are an expert astrologer. Provide insights based on the following patterns.';
    const content = patterns.map(pattern => ({
      Type: pattern.type,
      Description: pattern.description,
      Planets: pattern.planets,
      Houses: pattern.houses
    }));
    return this.formatPrompt(header, content, useMarkdown);
  }

  static buildHouseThemesPrompt(houseThemes: HouseTheme[], useMarkdown: boolean = false): string {
    const header = 'You are an expert astrologer. Provide insights based on the following house themes.';
    const content = houseThemes.map(theme => ({
      Theme: theme.theme,
      Description: theme.description,
      'Supporting Factors': theme.supportingFactors,
      Manifestation: theme.manifestation
    }));
    return this.formatPrompt(header, content, useMarkdown);
  }

  static buildHouseLordsPrompt(houseLords: HouseLord[], useMarkdown: boolean = false): string {
    const header = 'You are an expert astrologer. Provide insights based on the following house lords.';
    const content = houseLords.map(lord => ({
      House: lord.house,
      Lord: lord.lord,
      Dignity: lord.dignity,
      Influence: lord.influence,
      Aspects: lord.aspects
    }));
    return this.formatPrompt(header, content, useMarkdown);
  }

  static buildCoreIdentityPrompt(sun: CelestialBody, moon: CelestialBody, ascendant: number, useMarkdown: boolean = false): string {
    const header = 'You are an expert astrologer. Provide insights based on the core identity.';
    const content = {
      Sun: sun,
      Moon: moon,
      Ascendant: ascendant
    };
    return this.formatPrompt(header, content, useMarkdown);
  }

  static buildOverallSummaryPrompt(summary: { strengths: Strength[]; challenges: Challenge[]; patterns: Pattern[] }, useMarkdown: boolean = false): string {
    const header = 'You are an expert astrologer. Provide an overall summary based on the following insights.';
    const content = {
      Strengths: summary.strengths,
      Challenges: summary.challenges,
      Patterns: summary.patterns
    };
    return this.formatPrompt(header, content, useMarkdown);
  }

  static buildNodeInsightPrompt(nodes: { northNode: NodePlacement; southNode: NodePlacement }, useMarkdown: boolean = false): string {
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
    return this.formatPrompt(header, content, useMarkdown);
  }

  static buildDailyInsightPrompt(
    birthChart: BirthChart,
    transits: Transit[],
    currentDate: Date,
    useMarkdown: boolean = false
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

    return this.formatPrompt(header, content, useMarkdown);
  }

  static buildSmartTimingPrompt(
    birthChart: BirthChart,
    transits: Transit[],
    currentDate: Date,
    useMarkdown: boolean = false
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

    return this.formatPrompt(header, content, useMarkdown);
  }

  private static formatPrompt(header: string, content: string | object, useMarkdown: boolean): string {
    if (useMarkdown) {
      const formatted = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      return `${header}\n\n\`\`\`json\n${formatted}\n\`\`\``;
    }
    return `${header}\n\n${typeof content === 'string' ? content : JSON.stringify(content, null, 2)}`;
  }
} 