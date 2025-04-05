# EphemerisCalculator API Documentation

## Overview
The `EphemerisCalculator` class is a critical foundation component of PulseWisdom v2, providing the astronomical calculations needed for birth chart analysis, planetary insights, and timing recommendations. This component serves as the Swiss Ephemeris wrapper that powers the core astrological features of the application.

## Role in the System
The calculator is part of the `ephemeris` package, which is one of the core shared packages in the PulseWisdom monorepo. It provides:
- Precise planetary positions for birth chart generation
- House system calculations for astrological analysis
- Aspect calculations for planetary alignments
- Speed and retrograde motion detection for timing insights

## Core Components

### 1. Body Mapping
```typescript
private readonly bodyMap: Record<number, Body> = {
  0: Body.Sun,
  1: Body.Moon,
  2: Body.Mercury,
  3: Body.Venus,
  4: Body.Mars,
  5: Body.Jupiter,
  6: Body.Saturn,
  7: Body.Uranus,
  8: Body.Neptune,
  9: Body.Pluto
};
```
- Maps numeric IDs to astronomical bodies
- Supports 10 major celestial bodies
- Used for position calculations and identification

### 2. Date and Time Handling
- Validates date components
- Handles timezone adjustments
- Converts between time formats
- Ensures accurate temporal calculations

### 3. Body Position Calculations

#### Moon Calculations
```typescript
if (bodyId === 1) { // Moon
  const ecl = Ecliptic(geo);
  const longitude = ecl.elon;
  const latitude = ecl.elat;
  // ... speed calculations
}
```
- Special handling for Moon calculations
- Precise ecliptic coordinates
- Speed and retrograde detection
- Normalized longitude values

#### Other Bodies
```typescript
const ecl = Ecliptic(geo);
let longitude = ecl.elon;
// ... speed calculations
```
- Standard calculations for other bodies
- Sun latitude adjustments
- Distance calculations
- Retrograde motion detection

### 4. House System Calculations

#### Placidus System
```typescript
private calculatePlacidusHouses(ramc: number, obliquity: number, latitude: number): number[]
```
- Calculates house cusps using Placidus system
- Handles equatorial locations
- Manages circumpolar points
- Maintains angular relationships

#### Equal House System
```typescript
private calculateEqualHouses(ascendant: number): number[]
```
- Divides zodiac into 12 equal segments
- Starts from ascendant
- Simpler calculation method

### 5. Aspect Calculations
```typescript
private calculateAspects(bodies: CelestialBody[])
```
- Detects major aspects:
  - Conjunction (0°)
  - Sextile (60°)
  - Square (90°)
  - Trine (120°)
  - Opposition (180°)
- Uses 8° orb for detection
- Handles angle normalization
- Calculates aspect orbs

## Main Methods

### calculateBirthChart
```typescript
async calculateBirthChart(datetime: DateTime, location: GeoPosition, houseSystem: 'P' | 'E' = 'P')
```
- Main entry point for chart calculations
- Validates input parameters
- Calculates:
  - Planetary positions
  - House cusps
  - Chart angles
- Returns complete birth chart data

### calculateBodyPosition
```typescript
async calculateBodyPosition(datetime: DateTime, bodyId: Body)
```
- Calculates position for a single body
- Returns longitude, latitude, and distance
- Used for individual body calculations

## Integration Points
The calculator integrates with other components of PulseWisdom:
1. Birth Chart Visualization
   - Provides planetary positions
   - Calculates house cusps
   - Determines aspects

2. Planetary Insights
   - Tracks planetary movements
   - Detects alignments
   - Identifies patterns

3. Timing Recommendations
   - Calculates transit positions
   - Determines optimal timing
   - Identifies energy patterns

## Error Handling
- Validates date components
- Validates geographical coordinates
- Handles unknown body IDs
- Provides descriptive error messages

## Usage Example
```typescript
const calculator = new EphemerisCalculator();
const chart = await calculator.calculateBirthChart({
  year: 2024,
  month: 3,
  day: 15,
  hour: 12,
  minute: 0,
  second: 0,
  timezone: 0
}, {
  latitude: 40.7128,
  longitude: -74.0060
});
```

## Technical Details

### Coordinate Systems
- Uses ecliptic coordinates
- Handles equatorial conversions
- Normalizes angles to 0-360° range

### Precision
- High-precision Moon calculations
- Timezone adjustments
- Edge case handling

### Performance
- Caches initialization state
- Reuses calculations
- Optimizes aspect calculations

## Dependencies
- astronomy-engine: Core astronomical calculations
- TypeScript: Type safety
- Node.js: Runtime environment

## Limitations
- Limited to supported bodies
- House calculations at extreme latitudes
- Fixed aspect orbs 