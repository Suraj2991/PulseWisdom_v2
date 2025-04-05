# Development Setup

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Redis (for rate limiting)
- MongoDB (for data storage)

## Project Structure
```
apps/
  backend/
    src/
      services/      # Business logic
      models/        # Database models
      routes/        # API routes
      middleware/    # Express middleware
      infrastructure/ # External services
      shared/        # Shared utilities
    tests/          # Test files
    package.json    # Dependencies
    tsconfig.json   # TypeScript config
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/PulseWisdom_v2.git
cd PulseWisdom_v2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/pulsewisdom

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Development

### Running the Server
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "*": ["node_modules/*", "src/*"]
    }
  }
}
```

## Dependencies

### Core Dependencies
- express: Web framework
- mongoose: MongoDB ODM
- jsonwebtoken: JWT authentication
- bcryptjs: Password hashing
- zod: Schema validation
- express-rate-limit: Rate limiting
- cors: CORS middleware

### Development Dependencies
- typescript: TypeScript compiler
- @types/node: Node.js type definitions
- @types/express: Express type definitions
- @types/jsonwebtoken: JWT type definitions
- @types/bcryptjs: bcrypt type definitions
- jest: Testing framework
- ts-jest: TypeScript testing support

## Development Guidelines

### Code Style
- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful comments

### Testing
- Write unit tests for services
- Write integration tests for routes
- Maintain test coverage
- Use meaningful test descriptions

### Git Workflow
- Use feature branches
- Write meaningful commit messages
- Keep commits focused
- Review code before merging

### Error Handling
- Use custom error types
- Log errors appropriately
- Handle async errors
- Provide meaningful error messages

## Troubleshooting

### Common Issues
1. MongoDB connection issues
   - Check MongoDB service
   - Verify connection string
   - Check network access

2. Redis connection issues
   - Check Redis service
   - Verify Redis URL
   - Check network access

3. TypeScript compilation errors
   - Check type definitions
   - Verify tsconfig.json
   - Update dependencies

4. Rate limiting issues
   - Check Redis connection
   - Verify rate limit settings
   - Check IP tracking 