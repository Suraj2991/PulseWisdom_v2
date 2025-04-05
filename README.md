# PulseWisdom v2

PulseWisdom is an astrological insights application that provides personalized recommendations based on planetary movements and alignments. The application helps users make decisions in harmony with universal energies through birth chart analysis and real-time planetary insights.

## Current Status (March 25, 2024)

### ✅ Implemented
- Backend core calculation engine
- MongoDB and Redis integration
- GraphQL API with WebSocket support
- Basic authentication system
- Essential astrological calculations
  - Planetary positions
  - House systems (Placidus & Equal)
  - Major aspects
  - Transit detection

### 🚧 In Progress
- Backend test coverage expansion
- API documentation
- Performance optimization
- Error handling improvements

### 📋 To Start
- Frontend implementation
- Birth chart visualization
- User interface development
- Real-time updates integration

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Yarn package manager
- MongoDB (local instance)
- Redis (local instance)

### Local Development Setup

1. **Clone the Repository**
```bash
git clone [repository-url]
cd PulseWisdom_v2
```

2. **Install Dependencies**
```bash
yarn install
```

3. **Environment Setup**
```bash
cp .env.example .env
```
Edit `.env` with your local settings:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/pulsewisdom

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=4000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
```

4. **Start Development Servers**
```bash
# Start all services
yarn dev

# Or start individual services
yarn dev:backend  # Start backend only
yarn dev:web     # Start web frontend (not implemented yet)
yarn dev:mobile  # Start mobile app (not implemented yet)
```

5. **Run Tests**
```bash
yarn test        # Run all tests
yarn test:backend # Run backend tests only
```

## Project Structure
```
PulseWisdom/
├── apps/
│   ├── backend/        # Node.js backend (implemented)
│   ├── web/           # Web frontend (pending)
│   └── mobile/        # Mobile app (pending)
├── packages/
│   ├── core/          # Core business logic
│   ├── ui/            # Shared UI components (pending)
│   └── ephemeris/     # Astronomical calculations
└── docs/             # Documentation
```

## API Documentation

### GraphQL Endpoint
- URL: `http://localhost:4000/graphql`
- Playground available in development

### WebSocket
- URL: `ws://localhost:4000/ws`
- Used for real-time planetary updates

For detailed API documentation, see [API Documentation](docs/api/README.md)

## Development Guidelines

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `fix/*`: Bug fixes

### Commit Guidelines
- Use conventional commits
- Include ticket reference
- Keep commits focused

### Pull Request Process
1. Create feature/fix branch
2. Implement changes
3. Add/update tests
4. Update documentation
5. Create pull request
6. Address review feedback

## Testing

### Running Tests
```bash
# Run all tests
yarn test

# Run with coverage
yarn test:coverage

# Run specific tests
yarn test:backend
```

### Current Coverage
- Branch: 83.72%
- Statement: 96.34%
- Function: 100%
- Line: 98.69%

## Known Limitations (MVP)
1. Frontend not implemented yet
2. Limited to essential planetary bodies
3. Basic aspect calculations only
4. Simple timezone handling
5. Basic error recovery
6. Limited AI features

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Update documentation
6. Submit a pull request

## License

Proprietary Software License

Copyright (c) 2024 PulseWisdom. All rights reserved.

This software and associated documentation files (the "Software") are proprietary and confidential. 
The Software is protected by copyright laws and international copyright treaties, as well as other 
intellectual property laws and treaties.

Unauthorized copying, distribution, modification, public display, or public performance of the Software 
is strictly prohibited. No part of the Software may be reproduced, distributed, or transmitted in any 
form or by any means without the prior written permission of PulseWisdom.

The receipt or possession of the Software does not convey any rights to use, modify, or create derivative 
works of the Software. The Software is licensed, not sold, and all rights not expressly granted are 
reserved by PulseWisdom.

For licensing inquiries, please contact: [Contact Information]

## Support
For issues and feature requests, please use the GitHub issue tracker.

## Roadmap

### Phase 1 (Current)
- ✅ Core backend implementation
- ✅ Essential calculations
- ✅ Basic API structure
- 🚧 Test coverage
- 📋 Frontend development

### Phase 2 (Upcoming)
- Frontend implementation
- User interface development
- Visualization components
- Real-time updates integration
- Enhanced testing

### Phase 3 (Future)
- Advanced features
- AI integration
- Performance optimization
- Extended calculations
- Enhanced security 