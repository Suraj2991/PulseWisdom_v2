# Planetary Insight Model

## Overview
**Location**: `apps/backend/src/models/PlanetaryInsight.ts`
**Purpose**: Defines the structure for storing AI-generated astrological insights and interpretations.

## Data Structure

### Core Insight Data
```typescript
interface PlanetaryInsight {
  id: string;                    // Unique identifier
  userId: string;                // Associated user ID
  birthChartId: string;          // Associated birth chart ID
  date: Date;                    // Insight date
  energyLevel: number;           // Overall energy level (0-100)
  favorableActivities: string[]; // Recommended activities
  challengingAspects: string[];  // Challenging aspects
  recommendations: {             // Detailed recommendations
    timing: string;              // Recommended timing
    action: string;              // Recommended action
    reason: string;              // Reasoning
  }[];
  transits: {                    // Current transits
    planet: string;              // Transit planet
    aspect: string;              // Aspect type
    impact: string;              // Impact description
  }[];
  metadata: {                    // System metadata
    createdAt: Date;            // Creation date
    updatedAt: Date;            // Last update date
    confidence: number;         // AI confidence level
    source: string;             // Data source
  };
}
```

## Related Types

### EnergyLevel
```typescript
enum EnergyLevel {
  VERY_LOW = 0,
  LOW = 25,
  MODERATE = 50,
  HIGH = 75,
  VERY_HIGH = 100
}
```

### ActivityType
```typescript
enum ActivityType {
  CAREER = 'career',
  RELATIONSHIPS = 'relationships',
  HEALTH = 'health',
  FINANCE = 'finance',
  PERSONAL_GROWTH = 'personal_growth',
  SPIRITUAL = 'spiritual',
  SOCIAL = 'social',
  CREATIVE = 'creative'
}
```

### TransitImpact
```typescript
interface TransitImpact {
  planet: string;               // Transit planet
  aspect: string;               // Aspect type
  strength: number;             // Impact strength
  duration: {                   // Impact duration
    start: Date;
    end: Date;
  };
  description: string;          // Impact description
  recommendations: string[];    // Specific recommendations
}
```

## Relationships

### User
- Many-to-One relationship
- Required relationship
- Links insight to user account

### Birth Chart
- Many-to-One relationship
- Required relationship
- Links insight to birth chart

### Transits
- One-to-Many relationship
- Contains transit data
- Timing information

## Validation Rules

### Required Fields
- id
- userId
- birthChartId
- date
- energyLevel
- recommendations
- metadata

### Field Constraints
- Valid energy level range
- Valid date range
- Valid activity types
- Valid transit data
- Valid confidence level

## Indexes

### Primary Index
- id (unique)

### Secondary Indexes
- userId
- birthChartId
- date
- energyLevel
- metadata.createdAt

## Methods

### Instance Methods
```typescript
class PlanetaryInsight {
  // Validation
  validate(): boolean;
  validateEnergyLevel(): boolean;
  validateTransits(): boolean;

  // Analysis
  getFavorableActivities(): string[];
  getChallengingAspects(): string[];
  getTransitImpacts(): TransitImpact[];

  // Updates
  updateEnergyLevel(level: number): void;
  updateRecommendations(recommendations: Recommendation[]): void;
  updateTransits(transits: Transit[]): void;

  // Utility
  formatForDisplay(): FormattedInsight;
  calculateConfidence(): number;
}
```

## Usage Examples

### Creating an Insight
```typescript
const insight = new PlanetaryInsight({
  userId: "user123",
  birthChartId: "chart123",
  date: new Date(),
  energyLevel: 75,
  favorableActivities: [
    "Career advancement",
    "Creative projects",
    "Social networking"
  ],
  challengingAspects: [
    "Financial decisions",
    "Relationship commitments"
  ],
  recommendations: [
    {
      timing: "Morning hours",
      action: "Schedule important meetings",
      reason: "Favorable Mercury transit"
    }
  ],
  transits: [
    {
      planet: "Jupiter",
      aspect: "trine",
      impact: "Expansion and growth"
    }
  ],
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    confidence: 0.85,
    source: "AI_ANALYSIS"
  }
});
```

### Analyzing Insight
```typescript
const activities = insight.getFavorableActivities();
const impacts = insight.getTransitImpacts();
const confidence = insight.calculateConfidence();
```

## Data Integrity

### Constraints
- Valid energy levels
- Valid transit data
- Valid recommendations
- Data consistency
- Required relationships

### Triggers
- Energy level updates
- Transit changes
- Recommendation updates
- Confidence recalculation
- Data validation

## Performance Considerations
- Efficient queries
- Cached results
- Optimized storage
- Batch operations
- Data compression

## Security
- Access control
- Data encryption
- Audit logging
- Version control
- Backup procedures

## Future Enhancements
- Enhanced AI analysis
- More detailed insights
- Better transit tracking
- Advanced recommendations
- Historical analysis 