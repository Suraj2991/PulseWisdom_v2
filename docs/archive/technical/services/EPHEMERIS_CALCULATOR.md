# Ephemeris Calculator Service

## Overview
**Location**: `packages/ephemeris/src/calculator.ts`
**Purpose**: Core astrological calculation engine that handles all astronomical and astrological computations.

## Core Functionality

### 1. Birth Chart Calculations
- **Input**: Date, time, and location of birth
- **Output**: Complete birth chart with:
  - Planetary positions
  - House cusps
  - Aspects
  - Angles (Ascendant, MC, etc.)

### 2. Planetary Positions
- Calculates positions for:
  - Sun, Moon, Mercury, Venus, Mars
  - Jupiter, Saturn, Uranus, Neptune, Pluto
- Includes:
  - Longitude
  - Latitude
  - Distance
  - Speed
  - Retrograde status

### 3. House System Calculations
- Supports multiple house systems:
  - Placidus
  - Equal
- Handles special cases:
  - Equatorial locations
  - Polar regions
  - Edge cases

### 4. Aspect Calculations
- Calculates all major aspects:
  - Conjunction (0°)
  - Opposition (180°)
  - Trine (120°)
  - Square (90°)
  - Sextile (60°)
- Includes:
  - Aspect strength
  - Orb calculations
  - Applying/separating status

### 5. Transit Calculations
- Current planetary positions
- Transit aspects to natal chart
- Transit timing windows
- Retrograde periods

## Technical Details

### Dependencies
- astronomy-engine: Core astronomical calculations
- TypeScript: Type safety and development
- Node.js: Runtime environment

### Performance Considerations
- Caching of frequently used calculations
- Optimized algorithms for common operations
- Background processing for complex calculations
- Resource management for large datasets

### Error Handling
- Input validation
- Edge case handling
- Calculation error recovery
- Graceful degradation

## Usage Examples

### Basic Birth Chart Calculation
```typescript
const calculator = new EphemerisCalculator();
const birthChart = await calculator.calculateBirthChart({
  date: "1990-01-01",
  time: "12:00:00",
  location: { latitude: 40.7128, longitude: -74.0060 }
});
```

### Transit Calculation
```typescript
const transits = await calculator.calculateTransits({
  birthChart: existingChart,
  date: "2024-03-25"
});
```

## Testing
- Unit tests for individual calculations
- Integration tests for complete charts
- Edge case testing
- Performance testing
- Accuracy validation

## Future Enhancements
- Additional house systems
- More detailed aspect calculations
- Enhanced transit analysis
- Performance optimizations
- Additional celestial bodies

## Core Features

### Astronomical Calculations
- Planetary positions
- House system calculations
- Chart angles
- Aspect calculations
- Fixed star positions

### House Systems
Currently supported:
- Placidus (default)
- Equal House

Future Supports
- Koch
- Campanus
- Regiomontanus
- Porphyrius

### Data Types
```typescript
interface DateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  timezone: number;
}

interface GeoPosition {
  latitude: number;
  longitude: number;
}

interface IBodyPosition {
  bodyId: number;
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  retrograde: boolean;
  house: number;
}

interface IHouse {
  number: number;
  cusp: number;
  nextCusp: number;
  size: number;
  rulerId: number;
}

interface IAspect {
  body1Id: number;
  body2Id: number;
  type: string;
  angle: number;
  orb: number;
  isApplying: boolean;
}

interface BirthChart {
  datetime: DateTime;
  location: GeoPosition;
  bodies: IBodyPosition[];
  houses: IHouse[];
  aspects: IAspect[];
  angles: {
    ascendant: number;
    midheaven: number;
  };
}
```

## Implementation Details

### Singleton Pattern
The service implements a singleton pattern through `EphemerisCalculatorSingleton` to ensure:
- Single instance across the application
- Efficient resource usage
- Consistent calculations
- Thread-safe operations

### Key Methods
1. **calculateBirthChart**
   ```typescript
   async calculateBirthChart(
     datetime: DateTime,
     location: GeoPosition
   ): Promise<BirthChart>
   ```
   - Calculates complete birth chart
   - Handles house system calculations
   - Returns chart with all positions
   - Supports both Placidus and Equal house systems

2. **calculateBodyPosition**
   ```typescript
   async calculateBodyPosition(
     bodyId: number,
     datetime: DateTime,
     location: GeoPosition
   ): Promise<IBodyPosition>
   ```
   - Calculates position for a single body
   - Handles retrograde motion
   - Returns complete body data

3. **calculateTransits**
   ```typescript
   async calculateTransits(
     birthChart: BirthChart,
     date: Date
   ): Promise<IAspect[]>
   ```
   - Calculates transits against birth chart
   - Returns array of aspects
   - Handles orb calculations

### Testing
The service includes comprehensive test coverage:
- Unit tests for all calculations
- Integration tests for chart generation
- Mock implementations for testing
- Type safety validation

### Recent Updates (March 25, 2024)
1. **Type System Improvements**
   - Updated DateTime interface to match expected structure
   - Fixed type definitions for body positions
   - Improved aspect type definitions
   - Enhanced house system types

2. **Test Suite Enhancements**
   - Fixed constructor access in MockEphemerisCalculator
   - Added proper calculator variable declarations
   - Updated mock data structure
   - Improved test assertions

3. **Service Implementation**
   - Verified getBirthChart method
   - Ensured proper type handling
   - Fixed type conversion issues
   - Improved error handling

## Dependencies
- Swiss Ephemeris library (Native and WASM implementations)
- TypeScript for type safety
- Node.js for runtime
- Redis for caching (optional)

## Integration
- Used by BirthChartService for chart calculations
- Integrated with PlanetaryInsightService for transit calculations
- Supports caching through RedisCache
- Provides real-time updates through WebSocket

## Testing Status
- Unit tests: 83.72% branch coverage
- Integration tests: In progress
- End-to-end tests: Pending

## Future Improvements
1. Additional Features
   - More house systems (Koch, Campanus, Regiomontanus, Porphyrius)
   - Additional fixed stars
   - Advanced timing techniques
   - Harmonic charts

2. Performance Optimization
   - Enhanced caching strategies
   - Batch calculations
   - Parallel processing
   - WASM performance improvements

3. Enhanced Accuracy
   - Improved algorithms
   - Better precision
   - Additional corrections
   - Extended ephemeris data 