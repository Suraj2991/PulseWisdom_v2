# Rate Limiting API

## Overview
PulseWisdom implements rate limiting to protect the API from abuse and ensure fair usage. Rate limits are applied per IP address and vary based on the endpoint type.

## Rate Limit Headers

All API responses include the following headers:
```
X-RateLimit-Limit: Maximum number of requests allowed per window
X-RateLimit-Remaining: Number of requests remaining in current window
X-RateLimit-Reset: Unix timestamp when the rate limit resets
```

## Endpoint Limits

### Authentication Endpoints
- **Limit**: 5 requests
- **Window**: 15 minutes
- **Affected Endpoints**:
  - `/api/auth/register`
  - `/api/auth/login`

### Standard API Endpoints
- **Limit**: 100 requests
- **Window**: 15 minutes
- **Affected Endpoints**:
  - All other API endpoints

## Rate Limit Exceeded Response

When rate limit is exceeded, the API returns:
```json
{
  "status": "error",
  "message": "Too many attempts, please try again after 15 minutes"
}
```

With HTTP status code: `429 Too Many Requests`

## Implementation Details

### Storage
- Rate limit data is stored in Redis
- Key format: `ratelimit:{ip}:{endpoint}`
- TTL: 15 minutes

### Algorithm
1. Check current request count
2. If count >= limit, reject request
3. If count < limit, increment counter
4. Set TTL if counter is new

## Best Practices

### Client Implementation
1. Monitor rate limit headers
2. Implement exponential backoff
3. Cache rate limit information
4. Handle 429 responses gracefully

### Server Implementation
1. Use Redis for distributed rate limiting
2. Implement sliding window algorithm
3. Clear rate limit data on successful authentication
4. Log rate limit exceeded events 