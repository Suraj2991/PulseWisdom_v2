# PulseWisdom Technical Documentation V2

## Project Overview
PulseWisdom is a cross-platform astronomical insights application built with React Native and React Native Web. The application provides personalized action recommendations based on planetary movements, alignments, and astronomical events, helping users make decisions that are in harmony with universal energies. Key features include birth chart analysis, planetary alignment insights, and actionable recommendations for personal growth and timing based on astronomical phenomena.

## Architecture Overview

The architecture follows a modern monorepo approach with clear separation of concerns, shared packages, and platform-specific implementations. This design emphasizes code reusability, maintainability, and scalability while ensuring optimal performance across all platforms.

### Key Architectural Principles
- Clear separation of concerns
- Code reusability through shared packages
- Platform-specific optimizations
- Scalable infrastructure
- Comprehensive testing strategy
- Security by design
- Performance-first approach

### Monorepo Structure
```
PulseWisdom/
├── apps/                  # Application implementations
│   ├── mobile/           # React Native mobile app
│   │   ├── ios/         # iOS-specific code
│   │   └── android/     # Android-specific code
│   ├── web/             # Web application
│   └── backend/         # Node.js backend
├── packages/             # Shared packages
│   ├── core/            # Core business logic
│   │   ├── astrology/   # Astrological calculations
│   │   ├── insights/    # Planetary alignment insights
│   │   └── user/        # User management
│   ├── ui/              # Shared UI components
│   │   ├── mobile/      # Mobile-specific components
│   │   └── web/         # Web-specific components
│   ├── ephemeris/       # Swiss Ephemeris wrapper
│   │   ├── native/      # Native bindings
│   │   └── wasm/        # WebAssembly implementation
│   └── config/          # Shared configuration
├── tools/               # Development and deployment tools
│   ├── scripts/        # Build and deployment scripts
│   └── ci/             # CI/CD configurations
└── docs/               # Documentation
    ├── api/            # API documentation
    └── architecture/   # Architecture documentation
```

### Backend Architecture
```
backend/
├── src/
│   ├── api/              # API layer
│   │   ├── rest/        # REST endpoints
│   │   ├── graphql/     # GraphQL schema and resolvers
│   │   └── websocket/   # Real-time planetary updates
│   ├── core/            # Core business logic
│   │   ├── astrology/   # Astrological calculations
│   │   ├── insights/    # Planetary alignment insights
│   │   └── user/        # User management
│   ├── infrastructure/  # External services
│   │   ├── database/    # Database access
│   │   ├── cache/       # Caching layer
│   │   ├── queue/       # Message queue
│   │   └── ephemeris/   # Swiss Ephemeris integration
│   └── shared/          # Shared utilities
├── tests/              # Test suites
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── e2e/          # End-to-end tests
└── config/            # Environment configurations
```

### Frontend Architecture (Mobile & Web)
```
apps/[platform]/
├── src/
│   ├── features/           # Feature modules
│   │   ├── birthChart/    # Birth chart feature
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── state/
│   │   │   └── api/
│   │   ├── insights/      # Planetary insights feature
│   │   └── actions/       # Recommended actions feature
│   ├── shared/           # Shared code
│   │   ├── components/   # Common components
│   │   ├── hooks/       # Common hooks
│   │   └── utils/       # Utilities
│   ├── navigation/      # Navigation setup
│   ├── state/          # Global state management
│   └── api/            # API integration
└── tests/             # Test suites
```

### Data Flow Architecture
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │     │    Backend   │     │   Services   │
│  (Mobile/Web)│ ──> │  (Node.js)   │ ──> │  (External) │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    │                    │
       v                    v                    v
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Cache     │     │   Database   │     │  Ephemeris   │
│    (Local)   │     │  (MongoDB)   │     │  (Native/WASM)│
└──────────────┘     └──────────────┘     └──────────────┘
```

### State Management
- Redux Toolkit for global state
- React Query for server state
- Context for UI state
- Persistence strategy
- State synchronization

### API Layer
- REST API with future GraphQL support
- Proper request/response validation
- Rate limiting and security measures
- Caching strategy with Redis
- API versioning support

### Performance Optimization
- Web Workers for heavy calculations
- Code splitting and lazy loading
- Asset optimization
- Proper caching strategies
- Server-side rendering for web
- Performance monitoring and metrics

### Security Measures
- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting
- Security headers
- CORS configuration
- Secure storage for sensitive data

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests with Detox (mobile) and Cypress (web)
- Performance testing
- Security testing
- Snapshot testing for UI components

### CI/CD Pipeline
- Automated testing
- Code quality checks
- Security scanning
- Automated deployments
- Environment management
- Version control strategy

### Monitoring and Logging
- Application performance monitoring
- Error tracking and reporting
- User analytics
- Server metrics
- Logging strategy
- Alerting system

### Theme System
- **Colors**: Purple-based color scheme with platform-specific adjustments
- **Typography**: Platform-specific font stacks
- **Spacing**: Consistent spacing system across platforms
- **Breakpoints**: Responsive design breakpoints for web
- **Shadows**: Platform-specific shadow implementations

### Platform-Specific Features
1. **Web**
   - Responsive layouts
   - Hover states
   - Touch-friendly interactions
   - SEO optimization
   - Progressive Web App capabilities

2. **Mobile**
   - Native gestures
   - Platform-specific animations
   - Native navigation patterns
   - Touch feedback
   - Offline support

## Technical Stack

### Frontend
- React Native (Mobile)
- React Native Web (Web)
- TypeScript
- Redux Toolkit (State Management)
- React Query (Data Fetching)
- Styled Components (Styling)
- React Navigation (Routing)
- D3.js (Data Visualization)
  - Custom birth chart components
  - Interactive zodiac wheel
  - Aspect visualization
  - House system rendering
  - Planet positioning calculations
  - Transit overlay system
  - Touch and gesture support
  - Responsive design utilities

### Backend
- Node.js
- TypeScript
- Express/Fastify
- MongoDB
- Redis (Caching)
- Swiss Ephemeris
- GraphQL (Future)

### DevOps
- Docker
- Kubernetes
- GitHub Actions
- AWS/GCP
- Terraform
- ELK Stack

## Core Features

#### 1. User Profile & Personalization
- **Profile Creation**
  - Birth data input (date, time, location)
  - Personal goals and areas of interest
  - Customizable preferences
  - Notification settings

- **Personalization**
  - Customizable dashboard
  - Focus area selection
  - Notification frequency control
  - Privacy settings

#### 2. Astrological Analysis
- **Birth Chart Analysis**
  - Interactive birth chart visualization
    - D3.js-based circular chart rendering
    - Dynamic planet positioning
    - Aspect line visualization
    - House system overlay
    - Zodiac wheel with degrees
    - Responsive design for all screen sizes
    - Touch and mouse interactions
    - Zoom and pan capabilities
    - Planet information tooltips
    - Aspect information display
    - House cusps and degrees
    - Retrograde planet indicators
    - Special points (Chiron, North/South Nodes)
    - Element and modality highlighting
    - Aspect patterns identification
    - Harmonic resonance visualization
    - Real-time transit overlay option
    - Multiple house system support
    - Customizable visual themes
    - Export capabilities (SVG/PNG)
  - Core identity & personality insights
  - Key strengths & focus areas
  - Challenges & growth opportunities
  - Notable patterns
  - Overall life themes

- **Daily/Weekly Insights**
  - Planetary Position Analysis
    - Current positions of all planets
    - Retrograde status and movements
    - Planetary aspects and alignments
    - House positions and influences
    - Special points (Chiron, Nodes) tracking
    - Element and modality distribution
    - Cardinal/Fixed/Mutable balance
  - Astronomical Events
    - Planetary transits and movements
    - Aspect formations and releases
    - House ingress events
    - Retrograde stations
    - Lunar phases and eclipses
    - Significant alignments
  - Daily Insights
    - Day-specific planetary positions
    - Key aspects and alignments
    - Optimal timing windows
    - Energy patterns and themes
    - Action recommendations
    - Personal growth opportunities
  - Weekly Overview
    - Weekly planetary movements
    - Major aspect patterns
    - Energy shifts and transitions
    - Theme identification
    - Strategic planning windows
    - Pattern recognition
  - Influence Interpretation
    - Planetary energy analysis
    - Aspect pattern significance
    - House-based influences
    - Element and modality balance
    - Cardinal/Fixed/Mutable dynamics
  - Life Area Impact Assessment
    - Career and professional growth
    - Personal relationships
    - Health and wellness
    - Creative expression
    - Spiritual development
    - Financial matters
  - Actionable Recommendations
    - Timing-based actions
    - Energy-aligned activities
    - Personal growth practices
    - Strategic planning
    - Decision-making guidance
    - Pattern-based insights

#### 3. Personal Growth Tools
- **Goal Tracking**
  - Goal setting and management
  - Astrological alignment integration
  - Progress monitoring
  - Achievement celebration

- **Reflection Journal**
  - Prompt-based journaling
  - Astrological event correlation
  - Pattern recognition
  - Personal growth tracking

#### 4. Educational Content
- **Learning Resources**
  - Basic astrology lessons
  - Insight interpretation guides
  - Planetary movement explanations
  - Aspect significance

- **Interactive Tutorials**
  - Chart reading basics
  - Insight application
  - Goal alignment strategies
  - Journaling prompts

#### 5. Community Features
- **Social Integration**
  - Optional insight sharing
  - Discussion forums
  - Community support
  - Experience exchange

- **Privacy Controls**
  - Content visibility settings
  - Profile privacy options
  - Sharing preferences
  - Data protection

#### 6. Notification System
- **Smart Alerts**
  - Daily insight reminders
  - Significant astrological events
  - Goal milestone notifications
  - Journaling prompts
  - Custom alert preferences

### Engagement Features
- Smart Notifications
  - Daily insight reminders
  - Significant transit alerts
  - Goal check-in prompts
  - Custom notification preferences
- Community Integration
  - Optional insight sharing
  - Discussion forums
  - Privacy-focused social features
- Customization Options
  - Life area focus settings
  - Notification frequency control
  - Content complexity adjustment

### Data Integration & Analytics
- Personal Analytics
  - Pattern recognition
  - Goal achievement metrics
  - Insight effectiveness tracking
- Progress Tracking
  - Goal completion rates
  - Action implementation tracking
  - Growth measurements
- Insight Correlation
  - Astrological event mapping
  - Personal experience correlation
  - Pattern validation

### Privacy & Security
- Data Protection
  - End-to-end encryption
  - Secure birth data storage
  - Privacy-first sharing options
- User Control
  - Data visibility settings
  - Export capabilities
  - Account deletion options

## Premium Strategy & Implementation

### Rollout Phases

#### 1. Launch Phase (Months 1-3)
- All features freely available
- Focus on user acquisition and engagement
- Data collection for feature usage analytics
- Premium waitlist building
- Metrics tracking:
  - Feature engagement rates
  - User retention patterns
  - Most valuable feature identification
  - Usage frequency patterns

#### 2. Premium Introduction (Month 4)
- Premium tier announcement
- Early adopter benefits:
  - 30-day premium trial for existing users
  - Special "early supporter" discounted rates
  - Grandfather clause for active users
- New user onboarding:
  - 7-day trial period
  - Clear feature tier differentiation
  - Upgrade prompts at key engagement points

#### 3. Full Premium Rollout (Month 5+)
- Standard pricing implementation
- Tiered feature access
- Trial system activation
- Referral program launch

### Feature Tier Structure

#### Free Tier Features
- Basic Birth Chart Analysis
  - Simple chart visualization
  - Basic planetary positions
  - Limited house information
  - Basic aspect display
- Daily Insights
  - Current day's planetary positions
  - Basic daily horoscope
  - Limited recommendations (3/day)
  - Basic transit information
- Educational Content
  - Basic astrology lessons
  - Simple chart reading guides
  - Limited knowledge base access

#### Premium Tier Features
- Advanced Birth Chart Analysis
  - Interactive, detailed visualization
  - Comprehensive aspect patterns
  - Special points analysis
  - Multiple house systems
  - Chart export capabilities
- Comprehensive Insights
  - Extended forecast periods
  - Detailed transit analysis
  - Personalized recommendations
  - Pattern recognition
  - Timing optimization
- Professional Tools
  - Multiple chart storage
  - Synastry and composite charts
  - Advanced calculations
  - Custom pattern detection
- Advanced Features
  - Premium notifications
  - Data exports
  - API access
  - Priority support

### Technical Implementation

#### User Model Extension
```typescript
interface UserSubscription {
  tier: 'free' | 'premium' | 'professional';
  status: 'active' | 'trial' | 'expired';
  trialStart?: Date;
  trialEnd?: Date;
  subscriptionStart?: Date;
  subscriptionEnd?: Date;
  earlySupporter: boolean;
  features: {
    advancedCharts: boolean;
    extendedForecasts: boolean;
    professionalTools: boolean;
    customAlerts: boolean;
    dataExport: boolean;
    apiAccess: boolean;
  };
}

interface UserUsage {
  dailyRequestCount: number;
  storedCharts: number;
  lastResetDate: Date;
  totalUsageDays: number;
  featureUsage: Record<string, number>;
}
```

#### Feature Access Control
```typescript
interface FeatureAccess {
  free: {
    dailyLimit: number;
    storageLimit: number;
    forecastDays: number;
  };
  premium: {
    dailyLimit: number;
    storageLimit: number;
    forecastDays: number;
  };
}

const checkFeatureAccess = async (
  user: User,
  feature: keyof UserSubscription['features']
): Promise<boolean> => {
  if (user.subscription.tier === 'premium') return true;
  if (user.subscription.status === 'trial') return true;
  return false;
};
```

#### Trial Management
```typescript
interface TrialSystem {
  startTrial: (userId: string, trialDays: number) => Promise<void>;
  endTrial: (userId: string) => Promise<void>;
  checkTrialStatus: (userId: string) => Promise<TrialStatus>;
  extendTrial: (userId: string, additionalDays: number) => Promise<void>;
}

interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  features: string[];
  conversionUrl: string;
}
```

#### Usage Tracking
```typescript
interface UsageTracking {
  trackFeatureUse: (userId: string, feature: string) => Promise<void>;
  getDailyUsage: (userId: string) => Promise<UserUsage>;
  checkLimits: (userId: string, feature: string) => Promise<boolean>;
  resetDailyCounters: () => Promise<void>;
}
```

### API Endpoints

#### Trial Management
```typescript
// POST /api/v1/trials/start
interface StartTrialRequest {
  userId: string;
  trialType: 'standard' | 'early-adopter';
}

// GET /api/v1/trials/status
interface TrialStatusResponse {
  isActive: boolean;
  daysRemaining: number;
  features: FeatureAccess;
  nextBillingDate?: Date;
}
```

#### Subscription Management
```typescript
// POST /api/v1/subscriptions/create
interface CreateSubscriptionRequest {
  userId: string;
  tier: 'premium' | 'professional';
  paymentMethod: string;
  couponCode?: string;
}

// GET /api/v1/subscriptions/status
interface SubscriptionStatusResponse {
  tier: string;
  status: string;
  features: FeatureAccess;
  billingInfo: BillingInfo;
}
```

## Development Guidelines

### Code Organization
- Feature-first organization
- Clear module boundaries
- Shared code in packages
- Platform-specific code separation
- Comprehensive documentation

### State Management Strategy
- Redux Toolkit for global state
- React Query for server state
- Context for UI state
- Persistence strategy
- State synchronization

### Testing Strategy
- Unit tests (Jest)
- Integration tests
- E2E tests (Detox/Cypress)
- Performance testing
- Visual regression testing
- Coverage requirements

### Security Implementation
- JWT authentication
- Role-based access control
- API rate limiting
- Input validation
- Security headers
- Encryption at rest
- Secure communication

### Performance Optimization
- Code splitting
- Tree shaking
- Asset optimization
- Caching strategy
- Lazy loading
- Performance monitoring

### Monitoring and Logging
- Application metrics
- Error tracking
- User analytics
- Performance metrics
- Log aggregation
- Alerting system

## Development and Testing Workflow

### Development Environment

#### Starting Development Servers
```bash
# Start all services
yarn dev

# Start individual services
yarn workspace @pulsewisdom/mobile start  # Starts Expo development server
yarn workspace @pulsewisdom/web start     # Starts web development server
yarn workspace @pulsewisdom/backend start # Starts backend server
```

#### Mobile Development (Expo)
- Use Expo Go for rapid development and testing
- Access via QR code scanning
- Real-time updates without rebuilding
- Commands:
  ```bash
  # Test on iOS
  expo start --ios
  
  # Test on Android
  expo start --android
  
  # Build development client
  eas build --profile development
  ```

#### Web Development
- Local development server with hot reloading
- Cross-browser testing support
- PWA development and testing
- Commands:
  ```bash
  # Start web development
  yarn workspace @pulsewisdom/web start
  
  # Build for production
  yarn workspace @pulsewisdom/web build
  ```

### Testing Workflows

#### Feature Testing
```typescript
// Feature flag configuration for testing
const TEST_CONFIG = {
  MOCK_PREMIUM: true,    // Test premium features
  MOCK_TRIAL: false,     // Test trial state
  TRIAL_DAYS: 7,         // Configure trial period
  MOCK_CALCULATIONS: true // Use test data for astronomical calculations
};

// Test account states
const TEST_ACCOUNTS = {
  FREE_USER: {
    tier: 'free',
    features: { /* limited features */ }
  },
  TRIAL_USER: {
    tier: 'trial',
    trialEnd: 'future_date',
    features: { /* full features */ }
  },
  PREMIUM_USER: {
    tier: 'premium',
    features: { /* full features */ }
  }
};
```

#### Automated Testing
```bash
# Run all tests
yarn test

# Run platform-specific tests
yarn workspace @pulsewisdom/mobile test
yarn workspace @pulsewisdom/web test
yarn workspace @pulsewisdom/backend test

# Run E2E tests
yarn workspace @pulsewisdom/mobile test:e2e
yarn workspace @pulsewisdom/web test:e2e

# Run with coverage
yarn test --coverage
```

#### Testing Premium Features
1. Use test accounts with different subscription states
2. Toggle feature flags for different scenarios
3. Mock subscription API responses
4. Test upgrade/downgrade flows
5. Verify feature access control

#### Testing Astronomical Calculations
1. Use predefined test data sets
2. Compare with known good results
3. Test edge cases and special configurations
4. Verify accuracy across platforms

#### Cross-platform Testing Matrix
| Feature Category | Mobile (iOS) | Mobile (Android) | Web | Desktop Web |
|-----------------|--------------|------------------|-----|-------------|
| Birth Charts    | ✓            | ✓                | ✓   | ✓           |
| Calculations    | ✓            | ✓                | ✓   | ✓           |
| Offline Mode    | ✓            | ✓                | ✓   | -           |
| Push Notifications | ✓          | ✓                | ✓   | ✓           |
| Deep Linking    | ✓            | ✓                | -   | -           |
| File Export     | ✓            | ✓                | ✓   | ✓           |

## Build and Deployment

### Development Environment
```bash
# Install dependencies
yarn install

# Start development servers
yarn dev:mobile
yarn dev:web
yarn dev:backend
```

### Production Build
```bash
# Build all applications
yarn build

# Build specific applications
yarn build:mobile
yarn build:web
yarn build:backend
```

### Deployment Strategy
- Container-based deployment
- Blue-green deployment strategy
- Automated rollback capability
- Environment configuration management
- Secret management
- Database migration strategy

## Dependencies

### Core Dependencies
- expo: ~50.0.0
- react: 18.2.0
- react-native: 0.73.2
- react-native-web: ~0.19.6
- styled-components: ^6.1.8
- @react-navigation/native: ^6.1.9
- @react-navigation/native-stack: ^6.9.17

### Development Dependencies
- typescript: ^5.1.3
- @types/react: ~18.2.45
- @types/react-native: ^0.73.0
- @types/styled-components: ^5.1.34
- @types/styled-components-react-native: ^5.2.5
- eslint: ^8.0.0
- jest: ^29.0.0
- @testing-library/react-native: ^12.0.0

## Scalability Considerations

### Infrastructure Scaling
- Horizontal scaling
- Load balancing
- Database sharding
- Caching strategy
- Message queues
- Service mesh

### Application Scaling
- Microservices evolution
- Feature flags
- A/B testing
- Gradual rollouts
- Performance optimization

### Data Scaling
- Database partitioning
- Caching layers
- Data archival
- Analytics pipeline
- Backup strategy

## Future Considerations

### AI Integration
- Pattern recognition in planetary alignments
- Personalized action recommendation algorithms
- User behavior and outcome analysis
- Alignment success pattern identification

### User Growth Tracking
- Alignment adherence monitoring
- Action completion tracking
- Personal growth metrics
- Outcome documentation

### Advanced Features
- Multi-dimensional transit analysis
- Compound alignment interpretations
- Custom action definition system
- Group alignment dynamics

### Performance Optimization
- Code splitting
- Asset optimization
- Bundle size reduction
- Platform-specific optimizations

### Internationalization
- Translation management
- RTL support
- Cultural considerations
- Date/time handling
- Number formatting

### Accessibility
- WCAG compliance
- Screen reader support
- Keyboard navigation
- Color contrast
- Focus management

### Backend Integration
- API endpoints for astrological calculations
- Data caching strategy
- Offline support
- Error handling

### Swiss Ephemeris Integration
- Calculation services
- Performance optimization
- Error handling
- Mobile-specific optimizations

### AI Integration
- Astronomical event pattern recognition
- Personalized action recommendations based on planetary movements
- User behavior and outcome analysis
- Alignment success pattern identification

### Performance Optimization
- Code splitting
- Asset optimization
- Bundle size reduction
- Platform-specific optimizations

### Internationalization
- Translation management
- RTL support
- Cultural considerations
- Date/time handling
- Number formatting

### Accessibility
- WCAG compliance
- Screen reader support
- Keyboard navigation
- Color contrast
- Focus management

### Backend Integration
- API endpoints for astrological calculations
- Data caching strategy
- Offline support
- Error handling

### Swiss Ephemeris Integration
- Calculation services
- Performance optimization
- Error handling
- Mobile-specific optimizations 