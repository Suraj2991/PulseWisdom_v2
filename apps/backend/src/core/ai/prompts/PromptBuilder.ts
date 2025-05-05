import { LifeTheme } from '../../life-theme';
import { Strength, Challenge, Pattern, CelestialBody, NodePlacement } from '../../ephemeris';
import { Transit } from '../../transit';
import { BirthChart } from '../../ephemeris';
import { HouseTheme, HouseLord } from '../../insight';
import { config } from '../../../shared/config';
import { formatPrompt } from '../utils/aiUtils';
import { AstrologyUtils, ZodiacSign } from '../../../shared/utils/astrology';
import { BirthChartDocument } from '../../birthchart/types/birthChart.types';

export class PromptBuilder {
  private static getSystemPrompt(): string {
    return `You are an expert astrologer with deep knowledge of birth chart analysis and pattern recognition. 
    Your responses should be insightful, clear, and focused on practical implications. 
    Use a professional yet accessible tone, and avoid technical jargon unless necessary.
    When explaining astrological concepts, focus on their real-world manifestations and practical applications.
    
    `;
  }

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

  static buildHouseLordsAnalysisPrompt(birthChart: BirthChart, useMarkdown = false): string {
    const header = `You are an expert astrologer. Analyze the house lords in this birth chart and provide detailed information about each house's ruler, their dignity, influence, and aspects. For each house (1-12), describe:

1. The ruling planet (house lord)
2. The planet's dignity status (ruler, exaltation, detriment, or fall)
3. The overall influence (Very Strong, Strong, Moderate, Weak, or Very Weak)
4. Any significant aspects to other planets

Format each house analysis as:
House X: [Analysis including ruler, dignity, influence, and aspects]`;

    const content = {
      Houses: birthChart.houses.cusps.map((cusp, index) => ({
        Number: index + 1,
        Cusp: cusp,
        Sign: AstrologyUtils.getSignName(cusp)
      })),
      Planets: birthChart.bodies.map(body => ({
        Name: body.name,
        Sign: body.sign,
        House: body.house,
        Longitude: body.longitude
      })),
      Aspects: birthChart.aspects.map(aspect => ({
        Body1: aspect.body1,
        Body2: aspect.body2,
        Type: aspect.type,
        Orb: aspect.orb
      }))
    };

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

  static buildHouseThemesAnalysisPrompt(birthChart: BirthChart, useMarkdown = false): string {
    const header = `You are an expert astrologer. Analyze each house (1-12) in this birth chart and provide detailed information about its themes and influences. For each house, describe:

1. The overall theme of the house
2. A description of how this theme manifests
3. Planets placed in the house
4. Significant aspects involving planets in the house

Format each house analysis as:
House X:
Theme: [Theme name]
Description: [Brief description]
[Additional details about planets and aspects]`;

    const content = {
      Houses: birthChart.houses.cusps.map((cusp, index) => ({
        Number: index + 1,
        Cusp: cusp,
        Sign: AstrologyUtils.getSignName(cusp)
      })),
      Planets: birthChart.bodies.map(body => ({
        Name: body.name,
        Sign: body.sign,
        House: body.house,
        Longitude: body.longitude
      })),
      Aspects: birthChart.aspects.map(aspect => ({
        Body1: aspect.body1,
        Body2: aspect.body2,
        Type: aspect.type,
        Orb: aspect.orb
      }))
    };

    return formatPrompt(header, content, useMarkdown);
  }

  static buildStrengthsAnalysisPrompt(birthChart: BirthChart, useMarkdown = false): string {
    const header = `You are an expert astrologer. Analyze this birth chart and identify key strengths and talents. Consider:

1. Harmonious aspects (trines, sextiles, conjunctions)
2. Planets in their dignity or exaltation
3. Planets in favorable houses
4. Stelliums and other beneficial patterns
5. Mutual receptions and other planetary relationships
6. House rulerships and their conditions
7. Element and modality balances

For each strength identified, provide:
Strength X:
Area: [Area of life/capability]
Description: [Detailed description including specific planetary positions, aspects, and their meanings]
[Additional details about supporting aspects, house positions, and dignity status]`;

    const content = {
      Planets: birthChart.bodies.map(body => ({
        Name: body.name,
        Sign: body.sign as ZodiacSign,
        House: body.house,
        Longitude: body.longitude,
        Dignity: AstrologyUtils.getDignityStatus(body.name, body.sign as ZodiacSign),
        IsRetrograde: body.retrograde
      })),
      Aspects: birthChart.aspects.map(aspect => ({
        Body1: aspect.body1,
        Body2: aspect.body2,
        Type: aspect.type,
        Orb: aspect.orb,
        IsApplying: aspect.isApplying
      })),
      Houses: birthChart.houses.cusps.map((cusp, index) => ({
        Number: index + 1,
        Cusp: cusp,
        Sign: AstrologyUtils.getSignName(cusp),
        Ruler: AstrologyUtils.getHouseRuler(cusp)
      })),
      ElementBalance: AstrologyUtils.calculateElementBalance(birthChart),
      ModalityBalance: AstrologyUtils.calculateModalityBalance(birthChart)
    };

    return formatPrompt(header, content, useMarkdown);
  }

  static buildChallengesAnalysisPrompt(birthChart: BirthChart, useMarkdown = false): string {
    const header = `You are an expert astrologer. Analyze this birth chart and identify key challenges and growth opportunities. Consider:

1. Hard aspects (squares, oppositions)
2. Planets in detriment or fall
3. Retrograde planets
4. Challenging house placements
5. T-squares and grand crosses
6. Intercepted houses and planets
7. Unaspected or heavily aspected planets
8. House ruler challenges

For each challenge identified, provide:
Challenge X:
Area: [Area of life/pattern]
Description: [Detailed description including specific planetary positions, aspects, and their meanings]
Growth Opportunities: [List specific ways to work with these energies constructively]
[Additional details about aspects, house positions, and remediation strategies]`;

    const content = {
      Planets: birthChart.bodies.map(body => ({
        Name: body.name,
        Sign: body.sign as ZodiacSign,
        House: body.house,
        Longitude: body.longitude,
        Dignity: AstrologyUtils.getDignityStatus(body.name, body.sign as ZodiacSign),
        IsRetrograde: body.retrograde,
        AspectCount: birthChart.aspects.filter(a => 
          a.body1 === body.name || a.body2 === body.name
        ).length
      })),
      Aspects: birthChart.aspects.map(aspect => ({
        Body1: aspect.body1,
        Body2: aspect.body2,
        Type: aspect.type,
        Orb: aspect.orb,
        IsApplying: aspect.isApplying
      })),
      Houses: birthChart.houses.cusps.map((cusp, index) => ({
        Number: index + 1,
        Cusp: cusp,
        Sign: AstrologyUtils.getSignName(cusp),
        Ruler: AstrologyUtils.getHouseRuler(cusp),
        IsIntercepted: AstrologyUtils.isHouseIntercepted(birthChart, index + 1)
      }))
    };

    return formatPrompt(header, content, useMarkdown);
  }

  static buildPatternsAnalysisPrompt(birthChart: BirthChart, useMarkdown = false): string {
    const header = `You are an expert astrologer. Analyze this birth chart and identify significant astrological patterns. Consider:

1. Major Patterns:
   - Stelliums (3+ planets in a sign or house)
   - Grand Trines
   - Grand Crosses
   - T-Squares
   - Yods (Finger of God)
   - Mystic Rectangles
   - Kites
   - Grand Sextiles

2. Minor Patterns:
   - Multiple conjunctions
   - Element or modality concentrations
   - Mutual receptions
   - Planetary pairs
   - Aspect patterns to angles
   - Midpoint configurations
   - Planetary pictures

For each pattern found, provide:
Pattern X:
Type: [Pattern name]
Description: [Detailed description of the pattern configuration]
Planets: [List all involved planets with their exact positions]
Houses: [List affected houses and areas of life]
Interpretation: [Specific meaning and manifestation potential]`;

    const content = {
      Planets: birthChart.bodies.map(body => ({
        Name: body.name,
        Sign: body.sign as ZodiacSign,
        House: body.house,
        Longitude: body.longitude,
        Dignity: AstrologyUtils.getDignityStatus(body.name, body.sign as ZodiacSign),
        IsRetrograde: body.retrograde,
        Speed: body.speed
      })),
      Aspects: birthChart.aspects.map(aspect => {
        const body1 = birthChart.bodies.find(b => b.name === aspect.body1);
        const body2 = birthChart.bodies.find(b => b.name === aspect.body2);
        return {
          Body1: aspect.body1,
          Body2: aspect.body2,
          Type: aspect.type,
          Orb: aspect.orb,
          IsApplying: aspect.isApplying,
          ExactDegree: Math.abs((body1?.longitude ?? 0) - (body2?.longitude ?? 0))
        };
      }),
      Houses: birthChart.houses.cusps.map((cusp, index) => ({
        Number: index + 1,
        Cusp: cusp,
        Sign: AstrologyUtils.getSignName(cusp),
        Ruler: AstrologyUtils.getHouseRuler(cusp),
        PlanetCount: birthChart.bodies.filter(b => b.house === index + 1).length
      })),
      ElementBalance: AstrologyUtils.calculateElementBalance(birthChart),
      ModalityBalance: AstrologyUtils.calculateModalityBalance(birthChart),
      AngularPlanets: birthChart.bodies.filter(b => [1, 4, 7, 10].includes(b.house))
    };

    return formatPrompt(header, content, useMarkdown);
  }

  static buildPatternInsightPrompt(patternData: {
    type: string;
    sign: string;
    count: number;
    planets: Array<{
      id: number;
      sign: string;
      house: number;
      degree: number;
      retrograde: boolean;
    }>;
    birthChart: BirthChartDocument;
  }, includeSystemPrompt = false): string {
    const systemPrompt = includeSystemPrompt ? this.getSystemPrompt() : '';
    
    const prompt = `
      Analyze the following astrological pattern in the birth chart:
      
      Pattern Type: ${patternData.type}
      Sign: ${patternData.sign}
      Number of Planets: ${patternData.count}
      
      Planets involved:
      ${patternData.planets.map(p => `- Planet ${p.id} in ${p.sign} (House ${p.house}, ${p.retrograde ? 'Retrograde' : 'Direct'})`).join('\n')}
      
      Please provide a detailed interpretation of this pattern, including:
      1. The overall significance and meaning
      2. How it influences the native's personality and life path
      3. The potential opportunities and challenges it presents
      4. Specific areas of life most affected (based on houses involved)
      5. Practical advice for working with this energy
      
      Format the response as a cohesive, natural-sounding insight that flows well and is easy to understand.
    `.trim();

    return `${systemPrompt}${prompt}`;
  }
} 