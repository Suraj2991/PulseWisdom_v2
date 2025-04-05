# Development Context

## Recent Decisions and Their Rationale

### Authentication and Security Implementation (March 25, 2024)
- **Decision**: Implemented comprehensive authentication and security measures
- **Rationale**:
  - Secure user data and astrological insights
  - Protect against common security threats
  - Ensure reliable service delivery
- **Implementation Details**:
  - JWT-based authentication
  - Rate limiting with Redis
  - Input validation with Zod
  - Error handling middleware
  - Security headers

### Technical Documentation Simplification (March 25, 2024)
- **Decision**: Simplified technical documentation to focus on MVP features
- **Rationale**: 
  - Clearer distinction between MVP and post-MVP features
  - Better alignment with immediate development goals
  - Reduced complexity for initial launch
- **Implementation Details**:
  - Retained core Redis and WebSocket functionality
  - Simplified testing strategy
  - Streamlined deployment approach

### Service Architecture (March 25, 2024)
- **Decision**: Maintained three core services with essential features
- **Rationale**:
  - EphemerisCalculator: Core astronomical calculations
  - BirthChartService: Essential birth chart management
  - PlanetaryInsightService: Basic astrological interpretations
- **Implementation Details**:
  - Focused on MVP functionality
  - Clear service boundaries
  - Essential integrations only

### Infrastructure Decisions (March 25, 2024)
- **Decision**: Opted for simplified deployment without AWS/GCP dependency
- **Rationale**:
  - Reduced complexity for MVP
  - Lower initial infrastructure costs
  - Faster time to market
- **Implementation Details**:
  - Docker-based deployment
  - Basic monitoring setup
  - Essential security measures

## Current Issues and Their Context

### Security Implementation (March 25, 2024)
1. **Authentication System**
   - Status: Implemented
   - Context: JWT-based auth with rate limiting
   - Impact: Critical for user data protection

2. **Rate Limiting**
   - Status: Implemented
   - Context: Redis-backed rate limiting
   - Impact: Essential for service stability

3. **Input Validation**
   - Status: Implemented
   - Context: Zod schema validation
   - Impact: Critical for data integrity

### MVP Feature Scope (March 25, 2024)
1. **Core Features**
   - Status: In progress
   - Context: Implementing essential astrological calculations and insights
   - Impact: Critical for MVP launch

2. **Testing Coverage**
   - Status: Needs expansion
   - Context: Focus on core functionality testing
   - Impact: Essential for reliability

### AI Integration (March 25, 2024)
- **Current State**: Basic implementation planned
- **Pending Tasks**:
  - Essential service setup
  - Basic interpretation generation
  - Core recommendation system
- **Technical Debt**:
  - Limited feature set for MVP
  - Basic prompt templates
  - Simple caching strategy

## Development Patterns

### Error Handling
- Use try-catch blocks for all async operations
- Log errors with context
- Throw typed errors for better error handling
- Example:
```typescript
try {
  // Operation
} catch (error) {
  console.error('Context: Error message', error);
  throw new AstrologicalError('Detailed error message');
}
```

### Logging Standards
- Use console.error for errors
- Include context in log messages
- Log important state changes
- Example:
```typescript
console.error('Service: Operation: Error message', error);
```

### Code Organization
- Group related methods together
- Private methods for internal logic
- Public methods for API endpoints
- Clear separation of concerns

### Security Patterns
- Validate all user inputs
- Sanitize error messages
- Use secure headers
- Implement rate limiting
- Example:
```typescript
// Rate limiting middleware
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many attempts'
});

// Input validation
const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(new AppError(400, 'Validation failed'));
    }
  };
};
```

## Development Environment

### Local Setup
1. Install dependencies:
```bash
yarn install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start development servers:
```bash
yarn dev
```

### Testing Environment
- Jest for unit tests
- Supertest for API tests
- MongoDB for test database
- Redis for test cache

## Project Structure
```
apps/
  backend/
    src/
      services/         # Core business logic
      models/          # Data models
      routes/          # API endpoints
      middleware/      # Request/response middleware
      infrastructure/  # External services
      shared/         # Shared utilities
packages/
  ephemeris/          # Astronomical calculations
  shared/            # Shared types and utilities
docs/
  technical/         # Technical documentation
  api/              # API documentation
  architecture/     # Architecture documentation
```

## Key Dependencies
- astronomy-engine: Core astronomical calculations
- mongoose: MongoDB ODM
- express: Web framework
- typescript: Type safety
- jest: Testing framework
- ioredis: Redis client
- ws: WebSocket server
- jsonwebtoken: JWT authentication
- bcryptjs: Password hashing
- zod: Schema validation
- express-rate-limit: Rate limiting
- cors: CORS middleware

## Next Steps

### Immediate Priorities (March 25, 2024)
1. Complete security implementation
2. Expand test coverage for auth
3. Implement basic AI integration
4. Set up essential monitoring

### Technical Debt
1. Limited AI features
2. Basic testing coverage
3. Simple monitoring system
4. Essential security measures

## Notes
- Keep this document updated with significant decisions
- Document rationale for architectural changes
- Track technical debt and resolutions
- Update status of current issues

## Common Gotchas
1. **Timezone Handling**
   - Always use UTC internally
   - Convert to local time for display
   - Store timezone information with dates

2. **House System Calculations**
   - Placidus system requires latitude
   - Equal house system is simpler
   - Handle edge cases near poles

3. **Aspect Calculations**
   - Consider retrograde motion
   - Handle 0/360 degree boundary
   - Account for orb variations

4. **Authentication**
   - Always validate tokens
   - Handle token expiration
   - Implement proper logout
   - Secure password storage

5. **Rate Limiting**
   - Handle distributed systems
   - Clear rate limit data
   - Monitor rate limit events
   - Implement backoff strategy 