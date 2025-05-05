# AI Module

## Overview
This module handles all AI-related functionality, including prompt generation, LLM interactions, and insight generation. It provides a unified interface for AI operations across the application, with a focus on generating personalized astrological insights.

## Structure
```
ai/
├── clients/         # AI client implementations (LLMClient, OpenAIClient)
├── services/        # AI service implementations (AIService)
├── types/           # TypeScript type definitions
├── ports/           # Interface definitions (IAIClient)
├── prompts/         # Prompt templates and builders
└── utils/           # Utility functions for AI operations
```

## Key Components

### AIService
The core service that handles all AI operations:
- Life theme insight generation
- Transit insight generation
- Natal chart analysis
- Strength and challenge analysis
- Pattern recognition
- House theme analysis
- Timing window analysis
- Daily and weekly insights
- Theme forecasting

### LLMClient
Handles interactions with Language Learning Models:
- Insight generation
- Response generation
- Error handling and retries
- Response sanitization

### PromptBuilder
Constructs specialized prompts for different use cases:
- Life theme prompts
- Transit prompts
- Natal chart prompts
- Strength analysis prompts
- Pattern recognition prompts

## Usage Examples

```typescript
// Example: Generating life theme insights
const aiService = new AIService(llmClient, cache);
const { insight, log } = await aiService.generateLifeThemeInsight(themeData);

// Example: Generating transit insights
const { insight, log } = await aiService.generateTransitInsight(transitData);

// Example: Analyzing birth chart
const { insight, log } = await aiService.generateNatalChartInsight(birthChart);
```

## Features

### Insight Generation
- Life theme insights
- Transit insights
- Natal chart insights
- Node insights
- House theme insights
- Daily insights
- Weekly digests
- Theme forecasts

### Analysis Capabilities
- Strength analysis
- Challenge analysis
- Pattern recognition
- House theme analysis
- House lord analysis
- Timing window analysis
- Smart timing recommendations

### Caching
- Implements caching for AI responses
- Configurable cache TTL
- Cache key management

## Dependencies
- OpenAI API: For LLM interactions
- Cache Service: For caching AI responses
- Config Service: For AI configuration
- Logger: For operation logging

## Related Modules
- Insight Module: For insight storage and management
- Life Theme Module: For life theme data
- Transit Module: For transit data
- Birth Chart Module: For birth chart data
- Ephemeris Module: For astronomical calculations

## Error Handling
- Implements retry mechanism for failed requests
- Comprehensive error logging
- Error type classification
- Error recovery strategies

## Configuration
- Configurable timeouts
- Retry settings
- Cache settings
- Model parameters
