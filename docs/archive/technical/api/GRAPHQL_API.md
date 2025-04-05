# GraphQL API Documentation

## Overview
The GraphQL API provides a type-safe, efficient interface for accessing birth charts, planetary insights, and real-time planetary positions. The API is built with TypeScript and implements comprehensive error handling and validation.

## Schema Structure

### Core Types
```graphql
type BirthChart {
  id: ID!
  userId: ID!
  datetime: DateTime!
  location: GeoPosition!
  angles: ChartAngles!
  houses: HouseSystem!
  bodies: [CelestialBody!]!
  aspects: [Aspect!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type DateTime {
  year: Int!
  month: Int!
  day: Int!
  hour: Int!
  minute: Int!
  second: Int!
  timezone: Float!
}

type GeoPosition {
  latitude: Float!  # Range: -90 to 90
  longitude: Float! # Range: -180 to 180
}

type ChartAngles {
  ascendant: Float!
  midheaven: Float!
  descendant: Float!
  imumCoeli: Float!
}

type HouseSystem {
  system: HouseSystemType!
  cusps: [Float!]! # Array of 12 house cusps
}

enum HouseSystemType {
  PLACIDUS
  EQUAL
}

type CelestialBody {
  bodyId: Int!
  longitude: Float!
  latitude: Float!
  distance: Float!
  speed: Float!
  retrograde: Boolean!
  id: Int!
  isRetrograde: Boolean!
  house: Int!
}

type Aspect {
  body1Id: Int!
  body2Id: Int!
  type: String!
  angle: Float!
  orb: Float!
  isApplying: Boolean!
}

type PlanetaryInsight {
  id: ID!
  userId: ID!
  datetime: DateTime!
  type: InsightType!
  description: String!
  interpretation: String!
  recommendations: [String!]!
  bodies: [CelestialBody!]!
  aspects: [Aspect!]!
  dignity: [Dignity!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Dignity {
  bodyId: Int!
  score: Float!
  rulership: String
  exaltation: String
  detriment: String
  fall: String
}

enum InsightType {
  DAILY
  TRANSIT
  PROGRESSION
}

input DateTimeInput {
  year: Int!
  month: Int!
  day: Int!
  hour: Int!
  minute: Int!
  second: Int!
  timezone: Float!
}

input GeoPositionInput {
  latitude: Float!  # Range: -90 to 90
  longitude: Float! # Range: -180 to 180
}
```

### Queries
```graphql
type Query {
  # Birth Chart Queries
  birthChart(id: ID!): BirthChart
  birthChartsByUserId(userId: ID!): [BirthChart!]!
  
  # Planetary Insight Queries
  planetaryInsight(id: ID!): PlanetaryInsight
  dailyInsights(userId: ID!, date: DateTime!): [PlanetaryInsight!]!
  currentPlanetaryPositions: [CelestialBody!]!
}

# Example Birth Chart Query
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
      id
      isRetrograde
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
    createdAt
    updatedAt
  }
}
```

### Mutations
```graphql
type Mutation {
  # Birth Chart Mutations
  createBirthChart(
    userId: ID!
    datetime: DateTimeInput!
    location: GeoPositionInput!
    houseSystem: HouseSystemType = PLACIDUS
  ): BirthChart!

  updateBirthChart(
    id: ID!
    datetime: DateTimeInput
    location: GeoPositionInput
    houseSystem: HouseSystemType
  ): BirthChart!

  deleteBirthChart(id: ID!): Boolean!
  
  recalculateBirthChart(id: ID!): BirthChart!

  # Planetary Insight Mutations
  calculateDailyInsights(
    userId: ID!
    date: DateTime!
  ): [PlanetaryInsight!]!
}
```

### Subscriptions
```graphql
type Subscription {
  planetaryPositionsUpdated: [CelestialBody!]!
  birthChartUpdated(chartId: ID!): BirthChart!
  dailyInsightsUpdated(userId: ID!): [PlanetaryInsight!]!
}
```

## Error Handling

### Error Types
```typescript
interface GraphQLError {
  message: string;
  path?: string[];
  extensions?: {
    code: ErrorCode;
    details?: string;
  };
}

enum ErrorCode {
  VALIDATION_ERROR    // Invalid input data (e.g., coordinates out of range)
  CALCULATION_ERROR   // Ephemeris calculation failures
  DATABASE_ERROR      // MongoDB operation failures
  NOT_FOUND          // Requested resource not found
  UNAUTHORIZED       // User not authorized for operation
  RATE_LIMITED       // Too many requests
}
```

### Error Examples
```graphql
{
  "errors": [
    {
      "message": "Invalid latitude value",
      "path": ["createBirthChart", "location", "latitude"],
      "extensions": {
        "code": "VALIDATION_ERROR",
        "details": "Latitude must be between -90 and 90 degrees"
      }
    }
  ]
}
```

## Security Features

### Query Protection
- Depth limiting (max depth: 7)
- Complexity analysis
- Rate limiting per user/IP
- Operation whitelisting

### Authentication & Authorization
- JWT validation
- Role-based access control
- Field-level permissions
- Resource ownership validation

### Input Validation
- Coordinate range validation
- DateTime validation
- Required field validation
- Type checking

## Performance Optimizations

### Caching Strategy
- Redis field-level caching
- Cached queries
- Cache invalidation on updates
- Cache warmup for common queries

### Query Optimization
- Query batching
- Dataloader implementation
- Selective field resolution
- Pagination support

### Real-time Updates
- WebSocket connection pooling
- Subscription batching
- Heartbeat mechanism
- Automatic reconnection

## Testing
- Schema validation tests
- Resolver unit tests
- Integration tests
- Subscription tests
- Error handling tests
- Performance benchmarks
- Security tests
- Load tests

## Monitoring
- Query execution metrics
- Error rate tracking
- Response time monitoring
- Cache hit rates
- Subscription analytics
- Resource usage tracking

## Future Improvements
1. Additional Features
   - More complex queries
   - Batch operations
   - Advanced filtering
   - Custom scalars

2. Performance Optimization
   - Query optimization
   - Caching improvements
   - Batch processing
   - Subscription optimization

3. Security Enhancements
   - Role-based access
   - Field-level security
   - Rate limiting
   - Query complexity limits 