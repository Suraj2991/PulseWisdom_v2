# Timing Recommendation Model

## Overview
**Location**: `apps/backend/src/models/TimingRecommendation.ts`
**Purpose**: Defines the structure for storing timing-based recommendations and optimal windows for various activities.

## Data Structure

### Core Recommendation Data
```typescript
interface TimingRecommendation {
  id: string;                    // Unique identifier
  userId: string;                // Associated user ID
  birthChartId: string;          // Associated birth chart ID
  activity: ActivityType;        // Type of activity
  windows: {                     // Favorable timing windows
    start: Date;                 // Window start time
    end: Date;                   // Window end time
    strength: number;            // Window strength (0-100)
    factors: {                   // Contributing factors
      planet: string;            // Planet name
      aspect: string;            // Aspect type
      influence: number;         // Influence strength
    }[];
  }[];
  alternatives: {                // Alternative windows
    window: DateRange;           // Time window
    strength: number;            // Window strength
    reasons: string[];           // Selection reasons
  }[];
  risks: {                       // Potential risks
    factor: string;              // Risk factor
    impact: number;              // Impact level
    mitigation: string;          // Mitigation strategy
  }[];
  metadata: {                    // System metadata
    generatedAt: Date;          // Generation timestamp
    confidence: number;         // AI confidence level
    source: string;             // Data source
  };
}
```

## Related Types

### ActivityType
```typescript
enum ActivityType {
  CAREER_CHANGE = 'career_change',
  RELATIONSHIP = 'relationship',
  FINANCIAL = 'financial',
  HEALTH = 'health',
  PERSONAL_GROWTH = 'personal_growth',
  SPIRITUAL = 'spiritual',
  SOCIAL = 'social',
  CREATIVE = 'creative',
  TRAVEL = 'travel',
  EDUCATION = 'education',
  BUSINESS = 'business',
  LEGAL = 'legal'
}
```

### DateRange
```typescript
interface DateRange {
  start: Date;                   // Start date/time
  end: Date;                     // End date/time
  timezone: string;              // Timezone
  duration: number;              // Duration in minutes
}
```

### WindowStrength
```typescript
enum WindowStrength {
  VERY_LOW = 0,
  LOW = 25,
  MODERATE = 50,
  HIGH = 75,
  VERY_HIGH = 100
}
```

## Relationships

### User
- Many-to-One relationship
- Required relationship
- Links recommendation to user account

### Birth Chart
- Many-to-One relationship
- Required relationship
- Links recommendation to birth chart

### Transits
- One-to-Many relationship
- Contains transit data
- Timing information

## Validation Rules

### Required Fields
- id
- userId
- birthChartId
- activity
- windows
- metadata

### Field Constraints
- Valid date ranges
- Valid strength values
- Valid activity types
- Valid risk levels
- Valid confidence levels

## Indexes

### Primary Index
- id (unique)

### Secondary Indexes
- userId
- birthChartId
- activity
- windows.start
- metadata.generatedAt

## Methods

### Instance Methods
```typescript
class TimingRecommendation {
  // Validation
  validate(): boolean;
  validateWindows(): boolean;
  validateRisks(): boolean;

  // Analysis
  getBestWindow(): Window;
  getAlternativeWindows(): Window[];
  getRiskFactors(): Risk[];

  // Updates
  updateWindows(windows: Window[]): void;
  updateRisks(risks: Risk[]): void;
  updateConfidence(confidence: number): void;

  // Utility
  formatForDisplay(): FormattedRecommendation;
  calculateOverallStrength(): number;
}
```

## Usage Examples

### Creating a Recommendation
```typescript
const recommendation = new TimingRecommendation({
  userId: "user123",
  birthChartId: "chart123",
  activity: ActivityType.CAREER_CHANGE,
  windows: [
    {
      start: new Date("2024-03-25T09:00:00Z"),
      end: new Date("2024-03-25T17:00:00Z"),
      strength: 85,
      factors: [
        {
          planet: "Jupiter",
          aspect: "trine",
          influence: 0.8
        }
      ]
    }
  ],
  alternatives: [
    {
      window: {
        start: new Date("2024-03-26T09:00:00Z"),
        end: new Date("2024-03-26T17:00:00Z"),
        timezone: "UTC",
        duration: 480
      },
      strength: 75,
      reasons: [
        "Favorable Mercury transit",
        "Strong career house activation"
      ]
    }
  ],
  risks: [
    {
      factor: "Saturn opposition",
      impact: 0.3,
      mitigation: "Focus on preparation and planning"
    }
  ],
  metadata: {
    generatedAt: new Date(),
    confidence: 0.9,
    source: "AI_ANALYSIS"
  }
});
```

### Analyzing Recommendation
```typescript
const bestWindow = recommendation.getBestWindow();
const risks = recommendation.getRiskFactors();
const strength = recommendation.calculateOverallStrength();
```

## Data Integrity

### Constraints
- Valid date ranges
- Valid strength values
- Valid activity types
- Valid risk levels
- Data consistency

### Triggers
- Window updates
- Risk updates
- Strength recalculation
- Confidence updates
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
- Advanced timing algorithms
- More activity types
- Better risk assessment
- Enhanced optimization
- Machine learning integration 