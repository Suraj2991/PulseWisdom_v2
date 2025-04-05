# Birth Chart Model

## Overview
**Location**: `apps/backend/src/models/BirthChart.ts`
**Purpose**: Defines the structure for storing and managing astrological birth chart data.

## Data Structure

### Core Birth Chart Data
```typescript
interface BirthChart {
  id: string;                    // Unique identifier
  userId: string;                // Associated user ID
  birthData: {                   // Birth information
    date: DateTime;              // Birth date and time
    location: GeoPosition;       // Birth location
    timezone: string;           // Birth timezone
  };
  positions: {                   // Astrological positions
    planets: BodyPosition[];     // Planetary positions
    houses: House[];            // House cusps
    aspects: Aspect[];          // Planetary aspects
    angles: {                   // Chart angles
      ascendant: number;        // Rising sign
      mc: number;              // Midheaven
      descendant: number;      // Descendant
      ic: number;             // Imum Coeli
    };
  };
  metadata: {                    // System metadata
    createdAt: Date;           // Creation date
    updatedAt: Date;           // Last update date
    version: number;           // Data version
    notes?: string;            // Optional notes
  };
}
```

## Related Types

### BodyPosition
```typescript
interface BodyPosition {
  bodyId: number;              // Celestial body identifier
  longitude: number;           // Ecliptic longitude
  latitude: number;            // Ecliptic latitude
  distance: number;            // Distance from Earth
  speed: number;               // Orbital speed
  isRetrograde: boolean;       // Retrograde status
  house: number;               // House placement
  dignity?: Dignity;           // Planetary dignity
}
```

### House
```typescript
interface House {
  number: number;              // House number (1-12)
  cusp: number;                // House cusp degree
  nextCusp: number;            // Next house cusp degree
  size: number;                // House size in degrees
  rulerId: number;             // Ruling planet ID
  intercepted?: boolean;       // Intercepted status
  planets: number[];           // Planets in house
}
```

### Aspect
```typescript
interface Aspect {
  body1Id: number;             // First planet ID
  body2Id: number;             // Second planet ID
  type: string;                // Aspect type
  angle: number;               // Aspect angle
  orb: number;                 // Orb of aspect
  isApplying: boolean;         // Applying/separating status
  strength: number;            // Aspect strength
}
```

### Dignity
```typescript
interface Dignity {
  type: string;                // Dignity type
  strength: number;            // Dignity strength
  description: string;         // Dignity description
}
```

## Relationships

### User
- Many-to-One relationship
- Required relationship
- Links chart to user account

### Insights
- One-to-Many relationship
- Contains generated insights
- Historical record

### Transits
- One-to-Many relationship
- Contains transit data
- Timing information

## Validation Rules

### Required Fields
- id
- userId
- birthData
- positions
- metadata

### Field Constraints
- Valid date range
- Valid coordinates
- Valid house numbers
- Valid aspect angles
- Valid planet IDs

## Indexes

### Primary Index
- id (unique)

### Secondary Indexes
- userId
- birthData.date
- positions.angles.ascendant
- metadata.createdAt

## Methods

### Instance Methods
```typescript
class BirthChart {
  // Validation
  validate(): boolean;
  validateBirthData(): boolean;
  validatePositions(): boolean;

  // Calculations
  calculateAspects(): Aspect[];
  calculateHouses(): House[];
  calculateDignities(): Dignity[];

  // Analysis
  getPlanetInHouse(planetId: number): number;
  getAspectsToPlanet(planetId: number): Aspect[];
  getHouseRuler(houseNumber: number): number;

  // Updates
  updatePositions(positions: BodyPosition[]): void;
  updateHouses(houses: House[]): void;
  updateAspects(aspects: Aspect[]): void;
}
```

## Usage Examples

### Creating a Birth Chart
```typescript
const birthChart = new BirthChart({
  userId: "user123",
  birthData: {
    date: {
      year: 1990,
      month: 1,
      day: 1,
      hour: 12,
      minute: 0,
      second: 0,
      timezone: -5
    },
    location: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    timezone: "America/New_York"
  },
  positions: {
    planets: [
      {
        bodyId: 0, // Sun
        longitude: 280.5,
        latitude: 0,
        distance: 1.0,
        speed: 1.0,
        isRetrograde: false,
        house: 10
      }
      // ... other planets
    ],
    houses: [
      {
        number: 1,
        cusp: 15.5,
        nextCusp: 45.5,
        size: 30,
        rulerId: 4, // Mars
        planets: [1, 2] // Moon, Mercury
      }
      // ... other houses
    ],
    aspects: [
      {
        body1Id: 0,
        body2Id: 1,
        type: "trine",
        angle: 120,
        orb: 2.5,
        isApplying: true,
        strength: 0.8
      }
      // ... other aspects
    ],
    angles: {
      ascendant: 15.5,
      mc: 280.5,
      descendant: 195.5,
      ic: 100.5
    }
  }
});
```

### Analyzing Chart
```typescript
const aspects = birthChart.getAspectsToPlanet(0); // Get aspects to Sun
const houseRuler = birthChart.getHouseRuler(1);   // Get ruler of 1st house
```

## Data Integrity

### Constraints
- Valid planetary positions
- Valid house cusps
- Valid aspect angles
- Valid dignity values
- Data consistency

### Triggers
- Position updates
- Aspect recalculation
- House system changes
- Data validation
- Version updates

## Performance Considerations
- Efficient calculations
- Cached results
- Optimized queries
- Batch operations
- Data compression

## Security
- Access control
- Data encryption
- Audit logging
- Version control
- Backup procedures

## Future Enhancements
- Additional house systems
- More aspect types
- Advanced dignities
- Fixed star positions
- Harmonic analysis 