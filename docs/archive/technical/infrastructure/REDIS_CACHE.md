# Redis Cache Infrastructure

## Overview
**Location**: `apps/backend/src/infrastructure/redis.ts`
**Purpose**: Manages Redis caching for improved performance and reduced database load.

## Redis Configuration

### Connection Setup
```typescript
interface RedisConfig {
  host: string;                  // Redis host
  port: number;                  // Redis port
  password?: string;             // Redis password
  db?: number;                   // Redis database number
  options: {
    retryStrategy: Function;     // Retry strategy
    maxRetriesPerRequest: number; // Max retries
    enableReadyCheck: boolean;   // Ready check
    connectTimeout: number;      // Connection timeout
    maxRetriesPerRequest: number; // Max retries per request
  };
}
```

## Cache Management

### Key Structure
- `user:{id}`: User data
- `birthChart:{id}`: Birth chart data
- `insight:{id}`: Planetary insight
- `timing:{id}`: Timing recommendation
- `session:{id}`: User session
- `rateLimit:{ip}`: Rate limiting

### TTL (Time To Live)
- User data: 1 hour
- Birth chart: 24 hours
- Insights: 12 hours
- Timing: 6 hours
- Sessions: 30 minutes
- Rate limits: 1 minute

## Operations

### Cache Operations
```typescript
class RedisCache {
  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Basic Operations
  get<T>(key: string): Promise<T>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;

  // Advanced Operations
  increment(key: string): Promise<number>;
  decrement(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<boolean>;
  ttl(key: string): Promise<number>;

  // Batch Operations
  mget(keys: string[]): Promise<any[]>;
  mset(keyValues: [string, any][]): Promise<void>;
  mdel(keys: string[]): Promise<void>;
}
```

## Caching Strategy

### Cache Levels
1. **L1 Cache**: In-memory cache
2. **L2 Cache**: Redis cache
3. **L3 Cache**: Database

### Cache Invalidation
- Time-based expiration
- Event-based invalidation
- Manual invalidation
- Pattern-based invalidation

### Cache Warming
- Preload common data
- Background warming
- On-demand warming
- Cache warming events

## Performance Optimization

### Memory Management
- Memory limits
- Eviction policies
- Memory monitoring
- Cleanup procedures

### Connection Pool
- Pool size: 10-50
- Connection reuse
- Timeout handling
- Error recovery

### Monitoring
- Hit rates
- Memory usage
- Latency metrics
- Error rates

## Security

### Authentication
- Redis authentication
- SSL/TLS encryption
- Access control
- Audit logging

### Data Protection
- Data encryption
- Key isolation
- Access patterns
- Security monitoring

## Usage Examples

### Cache Connection
```typescript
const cache = new RedisCache({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  options: {
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3
  }
});

await cache.connect();
```

### Cache Operations
```typescript
// Set cache with TTL
await cache.set('user:123', userData, 3600);

// Get cached data
const userData = await cache.get('user:123');

// Batch operations
const keys = ['user:123', 'chart:456', 'insight:789'];
const data = await cache.mget(keys);
```

## Error Handling

### Connection Errors
- Network issues
- Authentication failures
- Timeout errors
- Pool exhaustion

### Operation Errors
- Key not found
- Memory limits
- Connection drops
- Operation timeouts

## Monitoring and Maintenance

### Health Checks
- Connection status
- Memory usage
- Operation latency
- Error rates

### Maintenance Tasks
- Memory cleanup
- Key optimization
- Performance tuning
- Backup procedures

## Future Enhancements
- Cluster support
- Sentinel mode
- Advanced monitoring
- Automated scaling
- Enhanced security 