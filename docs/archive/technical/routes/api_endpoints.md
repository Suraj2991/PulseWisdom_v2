# API Routes and Endpoints

## Overview
**Location**: `apps/backend/src/routes/`
**Purpose**: Defines all API endpoints and their functionality for the application.

## Authentication Routes

### User Authentication
```typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  birthData?: {
    date: DateTime;
    location: GeoPosition;
    timezone: string;
  };
}

// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

// POST /api/auth/logout
// POST /api/auth/refresh-token
// POST /api/auth/forgot-password
// POST /api/auth/reset-password
```

## User Routes

### User Management
```typescript
// GET /api/users/me
// PUT /api/users/me
interface UpdateUserRequest {
  name?: string;
  preferences?: UserPreferences;
  birthData?: BirthData;
}

// DELETE /api/users/me
// GET /api/users/:id
// PUT /api/users/:id
// DELETE /api/users/:id
```

## Birth Chart Routes

### Chart Management
```typescript
// POST /api/charts
interface CreateChartRequest {
  birthData: {
    date: DateTime;
    location: GeoPosition;
    timezone: string;
  };
  name?: string;
  notes?: string;
}

// GET /api/charts
// GET /api/charts/:id
// PUT /api/charts/:id
// DELETE /api/charts/:id

// GET /api/charts/:id/positions
// GET /api/charts/:id/houses
// GET /api/charts/:id/aspects
```

## Planetary Insight Routes

### Insight Management
```typescript
// POST /api/insights
interface CreateInsightRequest {
  birthChartId: string;
  date: Date;
  type: InsightType;
  preferences?: InsightPreferences;
}

// GET /api/insights
// GET /api/insights/:id
// PUT /api/insights/:id
// DELETE /api/insights/:id

// GET /api/insights/:id/analysis
// GET /api/insights/:id/recommendations
```

## Timing Recommendation Routes

### Timing Management
```typescript
// POST /api/timing
interface CreateTimingRequest {
  birthChartId: string;
  activity: ActivityType;
  dateRange: DateRange;
  preferences?: TimingPreferences;
}

// GET /api/timing
// GET /api/timing/:id
// PUT /api/timing/:id
// DELETE /api/timing/:id

// GET /api/timing/:id/windows
// GET /api/timing/:id/risks
```

## Response Formats

### Success Response
```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  metadata?: {
    timestamp: Date;
    requestId: string;
    processingTime: number;
  };
}
```

### Error Response
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
  };
}
```

## Rate Limiting

### Limits
- Authentication: 5 requests/minute
- User operations: 60 requests/minute
- Chart operations: 30 requests/minute
- Insight operations: 20 requests/minute
- Timing operations: 20 requests/minute

### Headers
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Authentication

### JWT Authentication
- Bearer token required
- Token expiration: 24 hours
- Refresh token: 7 days
- Token rotation: Enabled

### Headers
- `Authorization: Bearer <token>`
- `X-Request-ID`
- `X-Client-Version`

## Validation

### Request Validation
- Input sanitization
- Schema validation
- Type checking
- Required fields

### Response Validation
- Data formatting
- Error handling
- Status codes
- Content types

## Error Handling

### Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

### Error Types
- ValidationError
- AuthenticationError
- AuthorizationError
- NotFoundError
- RateLimitError
- ServerError

## Usage Examples

### Creating a Birth Chart
```typescript
const response = await fetch('/api/charts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    birthData: {
      date: {
        year: 1990,
        month: 1,
        day: 1,
        hour: 12,
        minute: 0,
        second: 0,
        timezone: -5
      },
      location: {
        latitude: 40.7128,
        longitude: -74.0060
      },
      timezone: "America/New_York"
    }
  })
});
```

### Getting Planetary Insights
```typescript
const response = await fetch('/api/insights?birthChartId=123&date=2024-03-20', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Security

### Data Protection
- HTTPS required
- Input validation
- Output sanitization
- Rate limiting
- CORS configuration

### Access Control
- Role-based access
- Resource ownership
- Permission checks
- Audit logging

## Monitoring

### Metrics
- Request rates
- Response times
- Error rates
- Cache hits/misses
- Resource usage

### Logging
- Request/response logs
- Error logs
- Access logs
- Performance logs

## Future Enhancements
- GraphQL support
- WebSocket endpoints
- Batch operations
- Advanced filtering
- Enhanced security 