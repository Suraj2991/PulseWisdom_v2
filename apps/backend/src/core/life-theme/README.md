# Life Theme Module

## Overview
This module handles the analysis and management of life themes in astrological charts. It processes birth chart data to identify and analyze life themes, patterns, and potential growth areas.

## Structure
```
life-theme/
├── controllers/     # API controllers for life theme endpoints
├── services/        # Life theme analysis and management
├── models/          # Life theme data models
├── types/           # TypeScript type definitions
├── dtos/            # Data transfer objects
├── validators/      # Input validation
├── transformers/    # Data transformation
├── ports/           # Interface definitions
└── utils/           # Utility functions
```

## Key Components
- **LifeThemeService**: Core service for life theme analysis
- **LifeThemeController**: Handles HTTP requests for life theme operations
- **LifeThemeModel**: Defines the structure of life theme data
- **LifeThemeTypes**: TypeScript interfaces and types
- **LifeThemeValidator**: Validates life theme data

## Usage
```typescript
// Example: Analyzing life themes
const lifeThemeService = new LifeThemeService();
const analysis = await lifeThemeService.analyzeLifeThemes(birthChartId);
```

## Dependencies
- AIService: For generating insights
- BirthChartService: For accessing birth chart data
- TransitService: For transit analysis

## Related Modules
- AI Module: For insight generation
- Birth Chart Module: For birth chart data
- Transit Module: For transit analysis
