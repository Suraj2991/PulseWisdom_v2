# Planetary Insight Service

## Overview
**Location**: `apps/backend/src/services/PlanetaryInsightService.ts`
**Purpose**: AI-powered service that generates personalized astrological insights and recommendations based on birth chart data and current planetary positions.

## Core Functionality

### 1. Daily Insights Generation
- **Input**: 
  - User's birth chart
  - Current planetary positions
  - User preferences
  - Selected life aspects
- **Output**:
  - Daily energy forecast
  - Favorable activities
  - Challenging aspects
  - Personal recommendations

### 2. Transit Interpretations
- Analyzes current transits to natal chart
- Identifies significant planetary movements
- Provides timing-based recommendations
- Explains transit impacts

### 3. Aspect Analysis
- Interprets natal aspects
- Analyzes transit aspects
- Provides relationship insights
- Identifies growth opportunities

### 4. Timing Recommendations
- Identifies favorable timing windows
- Suggests optimal activity periods
- Warns about challenging times
- Provides planning guidance

## Technical Implementation

### AI Integration
- Uses Claude/OpenAI for interpretation
- Structured prompt templates
- Context-aware responses
- Personalization layer

### Data Processing
- Birth chart data normalization
- Transit calculation integration
- Aspect pattern recognition
- Historical data analysis

### Caching Strategy
- Daily insight caching
- Transit data caching
- User preference caching
- Performance optimization

## Usage Examples

### Daily Insight Generation
```typescript
const insights = await planetaryInsightService.generateDailyInsights({
  userId: "user123",
  date: "2024-03-25",
  aspects: ["career", "relationships"]
});
```

### Transit Analysis
```typescript
const transitInsights = await planetaryInsightService.analyzeTransits({
  birthChart: userChart,
  date: "2024-03-25"
});
```

## Data Models

### PlanetaryInsight
```typescript
interface PlanetaryInsight {
  date: Date;
  energyLevel: number;
  favorableActivities: string[];
  challengingAspects: string[];
  recommendations: {
    timing: string;
    action: string;
    reason: string;
  }[];
  transits: {
    planet: string;
    aspect: string;
    impact: string;
  }[];
}
```

## Error Handling
- AI service failures
- Data validation errors
- Cache misses
- Rate limiting
- Timeout handling

## Performance Considerations
- Response time optimization
- Cache hit rates
- AI cost management
- Resource utilization
- Load balancing

## Testing
- Unit tests for core logic
- Integration tests with AI
- Performance testing
- Error scenario testing
- Cache effectiveness testing

## Future Enhancements
- Enhanced AI models
- More detailed insights
- Better personalization
- Advanced timing tools
- Historical analysis 