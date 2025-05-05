# AI Module

## Overview
This module handles all AI-related functionality, including prompt generation, LLM interactions, and insight generation. It provides a unified interface for AI operations across the application.

## Structure
```
ai/
├── client/          # AI client implementations
├── services/        # AI service implementations
├── types/           # TypeScript type definitions
├── ports/           # Interface definitions
├── prompts/         # Prompt templates
├── utils/           # Utility functions
└── config/          # AI configuration
```

## Key Components
- **AIService**: Core service for AI operations
- **LLMClient**: Handles LLM API interactions
- **PromptBuilder**: Constructs prompts for different use cases
- **AIConfig**: Configuration for AI parameters

## Usage
```typescript
// Example: Generating insights
const aiService = new AIService(llmClient, promptBuilder);
const insight = await aiService.generateInsight(prompt);
```

## Dependencies
- OpenAI API: For LLM interactions
- Cache Service: For caching AI responses
- Config Service: For AI configuration

## Related Modules
- Insight Module: For insight generation
- Life Theme Module: For life theme analysis
- Transit Module: For transit analysis
