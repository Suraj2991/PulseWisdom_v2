# API Migration Guide v2

## Overview
PulseWisdom has evolved its API architecture to provide a more robust, type-safe, and real-time capable system. This document outlines the migration from v1 to v2, detailing the changes in endpoints, data models, and communication patterns.

## Key Changes in v2

### 1. Architecture Updates
- Migration from REST to GraphQL
- Introduction of WebSocket for real-time updates
- Implementation of Redis caching layer
- Enhanced type system with TypeScript
- Improved error handling and validation

### 2. Data Model Changes
```typescript
// v1 Birth Chart Model
interface BirthChartV1 {
  id: string;
  userId: string;
  birthDate: string;
  birthTime: string;
  location: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
}

// v2 Birth Chart Model
interface BirthChartV2 {
  id: string;
  userId: string;
  datetime: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    timezone: number;
  };
  location: {
    latitude: number;   // Range: -90 to 90
    longitude: number;  // Range: -180 to 180
  };
  angles: {
    ascendant: number;
    midheaven: number;
    descendant: number;
    imumCoeli: number;
  };
  houses: {
    system: 'P' | 'E';  // Placidus or Equal
    cusps: number[];    // Array of 12 house cusps
  };
  bodies: Array<{
    bodyId: number;
    longitude: number;
    latitude: number;
    distance: number;
    speed: number;
    retrograde: boolean;
    house: number;
  }>;
  aspects: Array<{
    body1Id: number;
    body2Id: number;
    type: string;
    angle: number;
    orb: number;
    isApplying: boolean;
  }>;
}
```

## Migration Steps

### 1. GraphQL Migration

#### Previous REST Endpoints
```http
# Birth Chart Operations
POST   /api/v1/birth-charts
GET    /api/v1/birth-charts/:id
PUT    /api/v1/birth-charts/:id
DELETE /api/v1/birth-charts/:id

# Insight Operations
POST   /api/v1/insights
GET    /api/v1/insights/:id
GET    /api/v1/insights/range
```

#### New GraphQL Queries
```graphql
# Birth Chart Operations
query GetBirthChart($id: ID!) {
  birthChart(id: $id) {
    id
    userId
    datetime {
      year
      month
      day
      hour
      minute
      second
      timezone
    }
    location {
      latitude
      longitude
    }
    angles {
      ascendant
      midheaven
      descendant
      imumCoeli
    }
    houses {
      system
      cusps
    }
    bodies {
      bodyId
      longitude
      latitude
      distance
      speed
      retrograde
      house
    }
    aspects {
      body1Id
      body2Id
      type
      angle
      orb
      isApplying
    }
  }
}

mutation CreateBirthChart(
  $userId: ID!
  $datetime: DateTimeInput!
  $location: GeoPositionInput!
  $houseSystem: HouseSystemType = PLACIDUS
) {
  createBirthChart(
    userId: $userId
    datetime: $datetime
    location: $location
    houseSystem: $houseSystem
  ) {
    id
    # ... fields as needed
  }
}
```

### 2. WebSocket Migration

#### Previous Implementation
```typescript
// v1 - Long polling
setInterval(async () => {
  const response = await fetch('/api/v1/planetary-positions');
  const positions = await response.json();
}, 60000);
```

#### New WebSocket Implementation
```typescript
// v2 - WebSocket connection
const ws = new WebSocket('wss://api.pulsewisdom.com/v2/ws');

// Authentication
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE',
    data: {
      channels: [{
        type: 'PLANETARY_POSITIONS'
      }]
    }
  }));
};

// Handle updates
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'POSITION_UPDATE') {
    // Handle position updates
  }
};
```

### 3. Error Handling Migration

#### Previous Error Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

#### New Error Format
```typescript
interface GraphQLError {
  message: string;
  path?: string[];
  extensions?: {
    code: 'VALIDATION_ERROR' | 'CALCULATION_ERROR' | 'DATABASE_ERROR' | 'NOT_FOUND';
    details?: string;
  };
}
```

## Breaking Changes

### 1. Authentication
- JWT required for all requests
- Token format updated
- New security headers required

### 2. Data Models
- DateTime format changed from strings to structured object
- Coordinate validation enforced (-90° to 90° latitude, -180° to 180° longitude)
- New required fields for birth charts
- Aspect calculation changes

### 3. Real-time Updates
- WebSocket connection required for real-time data
- Subscription-based updates instead of polling
- New message formats for real-time data

## Migration Timeline

### Phase 1: Preparation (Current)
- Review new API documentation
- Update client libraries
- Plan migration schedule

### Phase 2: Implementation
- Migrate to GraphQL queries
- Implement WebSocket connections
- Update error handling
- Test new features

### Phase 3: Deployment
- Gradual rollout to production
- Monitor performance
- Gather feedback

### Phase 4: Legacy API Deprecation
- REST API deprecation notice


## Support Resources

### Documentation
- [GraphQL API Documentation](./GRAPHQL_API.md)
- [WebSocket API Documentation](./WEBSOCKET_API.md)
- [Type System Documentation](../types/README.md)

### Example Implementations
- [TypeScript Client](../examples/typescript-client)
- [React Integration](../examples/react-integration)
- [WebSocket Client](../examples/websocket-client)

### Migration Support
- Migration support team available
- Weekly office hours for questions
- Migration status dashboard
- Performance monitoring tools

## Backward Compatibility

### Legacy API Support
- REST API available until Q1 2025
- Rate limits apply to legacy endpoints
- No new features in legacy API
- Security patches only

### Data Migration
- Automatic data migration for existing charts
- Migration validation tools available
- Data consistency checks
- Rollback procedures in place 