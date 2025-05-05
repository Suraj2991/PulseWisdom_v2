# Transit Module

## Overview
This module handles the calculation and analysis of planetary transits. It processes current planetary positions and their relationships with natal chart positions.

## Structure
```
transit/
├── controllers/     # API controllers for transit endpoints
├── services/        # Transit calculation and analysis
├── models/          # Transit data models
├── types/           # TypeScript type definitions
├── dtos/            # Data transfer objects
├── validators/      # Input validation
├── transformers/    # Data transformation
├── ports/           # Interface definitions
└── utils/           # Utility functions
```

## Key Components
- **TransitService**: Core service for transit calculations
- **TransitController**: Handles HTTP requests for transit operations
- **TransitModel**: Defines the structure of transit data
- **TransitTypes**: TypeScript interfaces and types
- **TransitClassifier**: Classifies transit aspects and influences

## Usage
```typescript
// Example: Calculating transits
const transitService = new TransitService();
const transits = await transitService.calculateTransits(birthChart, date);
```

## Dependencies
- EphemerisService: For planetary positions
- BirthChartService: For birth chart data

## Related Modules
- Ephemeris Module: For planetary positions
- Birth Chart Module: For birth chart data
