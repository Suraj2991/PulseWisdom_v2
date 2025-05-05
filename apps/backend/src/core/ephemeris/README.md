# Ephemeris Module

## Overview
The Ephemeris module is responsible for calculating and managing astronomical data, including planetary positions, aspects, and house systems. It provides the foundation for astrological calculations in the application.

## Structure
```
ephemeris/
├── adapters/         # Data adapters for ephemeris calculations
├── clients/          # Ephemeris client implementations
├── services/         # Core ephemeris services
├── types/           # TypeScript type definitions
└── ports/           # Interface definitions
```

## Key Components

### BaseEphemerisService
The core service that handles ephemeris calculations:
- Planetary position calculations
- Aspect calculations
- House system calculations
- Coordinate transformations

### CelestialBodyService
Manages celestial body data and calculations:
- Position calculations
- Sign and house placements
- Aspect relationships
- Orb calculations

### AspectService
Handles aspect calculations and relationships:
- Aspect type determination
- Orb calculations
- Aspect strength evaluation
- Aspect pattern recognition

### HouseService
Manages house system calculations:
- House cusp calculations
- House system selection
- House lord determination
- House strength evaluation

## Features

### Astronomical Calculations
- Planetary positions
- Lunar nodes
- Asteroids
- Fixed stars
- House systems
- Coordinate systems

### Aspect Analysis
- Major aspects
- Minor aspects
- Aspect patterns
- Aspect strength
- Orb calculations

### House Systems
- Placidus
- Koch
- Equal
- Whole sign
- Campanus
- Regiomontanus

### Coordinate Systems
- Ecliptic coordinates
- Equatorial coordinates
- Geographic coordinates
- Time zone handling

## Usage Examples

```typescript
// Example: Calculating planetary positions
const ephemerisService = new BaseEphemerisService();
const positions = await ephemerisService.calculatePositions(date, location);

// Example: Calculating aspects
const aspectService = new AspectService();
const aspects = await aspectService.calculateAspects(positions);

// Example: Calculating house cusps
const houseService = new HouseService();
const houses = await houseService.calculateHouses(date, location);
```

## Dependencies
- Kerykeion: For astronomical calculations
- Date-fns: For date manipulation
- Config Service: For calculation parameters
- Logger: For operation logging

## Related Modules
- Birth Chart Module: For birth chart calculations
- Transit Module: For transit calculations
- Insight Module: For astrological interpretations
- AI Module: For insight generation

## Error Handling
- Calculation error handling
- Input validation
- Boundary condition checks
- Error logging and reporting

## Configuration
- Calculation parameters
- House system settings
- Aspect orb settings
- Coordinate system settings 