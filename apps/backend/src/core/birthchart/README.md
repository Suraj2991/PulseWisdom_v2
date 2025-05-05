# Birth Chart Module

## Overview
This module handles the creation, storage, and analysis of birth charts. It processes birth data to generate astrological charts and provides access to chart data.

## Structure
```
birthchart/
├── controllers/     # API controllers for birth chart endpoints
├── services/        # Birth chart management
├── models/          # Birth chart data models
├── types/           # TypeScript type definitions
├── adapters/        # Data adapters
└── utils/           # Utility functions
```

## Key Components
- **BirthChartService**: Core service for birth chart management
- **BirthChartController**: Handles HTTP requests for birth chart operations
- **BirthChartModel**: Defines the structure of birth chart data
- **ChartAdapter**: Adapts data between different formats

## Usage
```typescript
// Example: Creating a birth chart
const birthChartService = new BirthChartService();
const chart = await birthChartService.createBirthChart(birthData);
```

## Dependencies
- EphemerisService: For planetary positions
- UserService: For user data

## Related Modules
- Ephemeris Module: For planetary positions
- User Module: For user data
