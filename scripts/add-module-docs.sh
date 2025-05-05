#!/bin/bash

# Function to create README for a module
create_module_readme() {
    local module=$1
    local readme_path="apps/backend/src/core/$module/README.md"
    
    echo "Creating README for $module..."
    
    # Create README content
    cat > "$readme_path" << EOF
# $module Module

## Overview
This module handles [module-specific functionality].

## Structure
\`\`\`
$module/
├── controllers/     # API controllers
├── services/        # Business logic
├── models/          # Data models
├── types/           # TypeScript types
├── dtos/            # Data transfer objects
├── validators/      # Input validation
├── transformers/    # Data transformation
├── ports/           # Interface definitions
├── utils/           # Utility functions
└── index.ts         # Module exports
\`\`\`

## Key Components
- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Models**: Define data structures
- **Types**: TypeScript type definitions
- **DTOs**: Data transfer objects for API communication
- **Validators**: Input validation logic
- **Transformers**: Data transformation utilities
- **Ports**: Interface definitions for external services
- **Utils**: Helper functions and utilities

## Usage
[Add module-specific usage examples]

## Dependencies
- [List module dependencies]

## Related Modules
- [List related modules]
EOF
}

# Function to create README for life-theme module
create_life_theme_readme() {
    local readme_path="apps/backend/src/core/life-theme/README.md"
    
    cat > "$readme_path" << EOF
# Life Theme Module

## Overview
This module handles the analysis and management of life themes in astrological charts. It processes birth chart data to identify and analyze life themes, patterns, and potential growth areas.

## Structure
\`\`\`
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
\`\`\`

## Key Components
- **LifeThemeService**: Core service for life theme analysis
- **LifeThemeController**: Handles HTTP requests for life theme operations
- **LifeThemeModel**: Defines the structure of life theme data
- **LifeThemeTypes**: TypeScript interfaces and types
- **LifeThemeValidator**: Validates life theme data

## Usage
\`\`\`typescript
// Example: Analyzing life themes
const lifeThemeService = new LifeThemeService();
const analysis = await lifeThemeService.analyzeLifeThemes(birthChartId);
\`\`\`

## Dependencies
- AIService: For generating insights
- BirthChartService: For accessing birth chart data
- TransitService: For transit analysis

## Related Modules
- AI Module: For insight generation
- Birth Chart Module: For birth chart data
- Transit Module: For transit analysis
EOF
}

# Function to create README for transit module
create_transit_readme() {
    local readme_path="apps/backend/src/core/transit/README.md"
    
    cat > "$readme_path" << EOF
# Transit Module

## Overview
This module handles the calculation and analysis of planetary transits. It processes current planetary positions and their relationships with natal chart positions.

## Structure
\`\`\`
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
\`\`\`

## Key Components
- **TransitService**: Core service for transit calculations
- **TransitController**: Handles HTTP requests for transit operations
- **TransitModel**: Defines the structure of transit data
- **TransitTypes**: TypeScript interfaces and types
- **TransitClassifier**: Classifies transit aspects and influences

## Usage
\`\`\`typescript
// Example: Calculating transits
const transitService = new TransitService();
const transits = await transitService.calculateTransits(birthChart, date);
\`\`\`

## Dependencies
- EphemerisService: For planetary positions
- BirthChartService: For birth chart data

## Related Modules
- Ephemeris Module: For planetary positions
- Birth Chart Module: For birth chart data
EOF
}

# Function to create README for feedback module
create_feedback_readme() {
    local readme_path="apps/backend/src/core/feedback/README.md"
    
    cat > "$readme_path" << EOF
# Feedback Module

## Overview
This module handles user feedback for insights and predictions. It manages the collection, storage, and analysis of user feedback.

## Structure
\`\`\`
feedback/
├── controllers/     # API controllers for feedback endpoints
├── services/        # Feedback management
├── models/          # Feedback data models
├── types/           # TypeScript type definitions
├── dtos/            # Data transfer objects
├── validators/      # Input validation
├── transformers/    # Data transformation
├── ports/           # Interface definitions
└── utils/           # Utility functions
\`\`\`

## Key Components
- **FeedbackService**: Core service for feedback management
- **FeedbackModel**: Defines the structure of feedback data
- **FeedbackTypes**: TypeScript interfaces and types

## Usage
\`\`\`typescript
// Example: Submitting feedback
const feedbackService = new FeedbackService();
await feedbackService.submitFeedback(userId, insightId, feedback);
\`\`\`

## Dependencies
- UserService: For user data
- InsightService: For insight data

## Related Modules
- User Module: For user data
- Insight Module: For insight data
EOF
}

# Function to create README for auth module
create_auth_readme() {
    local readme_path="apps/backend/src/core/auth/README.md"
    
    cat > "$readme_path" << EOF
# Authentication Module

## Overview
This module handles user authentication and authorization. It manages user sessions, JWT tokens, and access control.

## Structure
\`\`\`
auth/
├── controllers/     # API controllers for auth endpoints
├── services/        # Authentication and authorization
├── models/          # Auth data models
├── types/           # TypeScript type definitions
├── dtos/            # Data transfer objects
├── validators/      # Input validation
├── transformers/    # Data transformation
├── ports/           # Interface definitions
├── middleware/      # Auth middleware
└── utils/           # Utility functions
\`\`\`

## Key Components
- **AuthService**: Core service for authentication
- **AuthController**: Handles HTTP requests for auth operations
- **AuthMiddleware**: Middleware for protecting routes
- **AuthTypes**: TypeScript interfaces and types

## Usage
\`\`\`typescript
// Example: User authentication
const authService = new AuthService();
const token = await authService.authenticateUser(email, password);
\`\`\`

## Dependencies
- UserService: For user data
- JWT: For token management

## Related Modules
- User Module: For user data
EOF
}

# Function to create README for ai module
create_ai_readme() {
    local readme_path="apps/backend/src/core/ai/README.md"
    
    cat > "$readme_path" << EOF
# AI Module

## Overview
This module handles all AI-related functionality, including prompt generation, LLM interactions, and insight generation. It provides a unified interface for AI operations across the application.

## Structure
\`\`\`
ai/
├── client/          # AI client implementations
├── services/        # AI service implementations
├── types/           # TypeScript type definitions
├── ports/           # Interface definitions
├── prompts/         # Prompt templates
├── utils/           # Utility functions
└── config/          # AI configuration
\`\`\`

## Key Components
- **AIService**: Core service for AI operations
- **LLMClient**: Handles LLM API interactions
- **PromptBuilder**: Constructs prompts for different use cases
- **AIConfig**: Configuration for AI parameters

## Usage
\`\`\`typescript
// Example: Generating insights
const aiService = new AIService(llmClient, promptBuilder);
const insight = await aiService.generateInsight(prompt);
\`\`\`

## Dependencies
- OpenAI API: For LLM interactions
- Cache Service: For caching AI responses
- Config Service: For AI configuration

## Related Modules
- Insight Module: For insight generation
- Life Theme Module: For life theme analysis
- Transit Module: For transit analysis
EOF
}

# Function to create README for insight module
create_insight_readme() {
    local readme_path="apps/backend/src/core/insight/README.md"
    
    cat > "$readme_path" << EOF
# Insight Module

## Overview
This module handles the generation and management of astrological insights. It combines data from various sources to create meaningful and personalized insights for users.

## Structure
\`\`\`
insight/
├── controllers/     # API controllers for insight endpoints
├── services/        # Insight generation and management
├── models/          # Insight data models
├── types/           # TypeScript type definitions
├── dtos/            # Data transfer objects
├── validators/      # Input validation
├── transformers/    # Data transformation
├── generators/      # Insight generators
├── utils/           # Utility functions
└── repository/      # Data access layer
\`\`\`

## Key Components
- **InsightService**: Core service for insight management
- **InsightGenerator**: Generates different types of insights
- **InsightAnalyzer**: Analyzes insight data
- **InsightRepository**: Handles data persistence

## Usage
\`\`\`typescript
// Example: Generating daily insight
const insightService = new InsightService();
const insight = await insightService.generateDailyInsight(birthChartId);
\`\`\`

## Dependencies
- AIService: For AI-powered insights
- BirthChartService: For birth chart data
- TransitService: For transit data
- LifeThemeService: For life theme data

## Related Modules
- AI Module: For AI operations
- Birth Chart Module: For birth chart data
- Transit Module: For transit data
- Life Theme Module: For life theme data
EOF
}

# Function to create README for birthchart module
create_birthchart_readme() {
    local readme_path="apps/backend/src/core/birthchart/README.md"
    
    cat > "$readme_path" << EOF
# Birth Chart Module

## Overview
This module handles the creation, storage, and analysis of birth charts. It processes birth data to generate astrological charts and provides access to chart data.

## Structure
\`\`\`
birthchart/
├── controllers/     # API controllers for birth chart endpoints
├── services/        # Birth chart management
├── models/          # Birth chart data models
├── types/           # TypeScript type definitions
├── adapters/        # Data adapters
└── utils/           # Utility functions
\`\`\`

## Key Components
- **BirthChartService**: Core service for birth chart management
- **BirthChartController**: Handles HTTP requests for birth chart operations
- **BirthChartModel**: Defines the structure of birth chart data
- **ChartAdapter**: Adapts data between different formats

## Usage
\`\`\`typescript
// Example: Creating a birth chart
const birthChartService = new BirthChartService();
const chart = await birthChartService.createBirthChart(birthData);
\`\`\`

## Dependencies
- EphemerisService: For planetary positions
- UserService: For user data

## Related Modules
- Ephemeris Module: For planetary positions
- User Module: For user data
EOF
}

# Function to create README for user module
create_user_readme() {
    local readme_path="apps/backend/src/core/user/README.md"
    
    cat > "$readme_path" << EOF
# User Module

## Overview
This module handles user management, including user profiles, preferences, and settings. It provides functionality for user data management and user-related operations.

## Structure
\`\`\`
user/
├── controllers/     # API controllers for user endpoints
├── services/        # User management
├── models/          # User data models
├── types/           # TypeScript type definitions
├── dtos/            # Data transfer objects
├── validators/      # Input validation
├── transformers/    # Data transformation
├── ports/           # Interface definitions
└── database/        # Database operations
\`\`\`

## Key Components
- **UserService**: Core service for user management
- **UserController**: Handles HTTP requests for user operations
- **UserModel**: Defines the structure of user data
- **UserValidator**: Validates user data

## Usage
\`\`\`typescript
// Example: Creating a user
const userService = new UserService();
const user = await userService.createUser(userData);
\`\`\`

## Dependencies
- AuthService: For user authentication
- Database Service: For data persistence

## Related Modules
- Auth Module: For user authentication
EOF
}

# Main execution
echo "Starting documentation creation..."

# Create READMEs for each module
create_life_theme_readme
create_transit_readme
create_feedback_readme
create_auth_readme
create_ai_readme
create_insight_readme
create_birthchart_readme
create_user_readme

echo "Done!" 