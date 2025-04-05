# Database Infrastructure

## Overview
**Location**: `apps/backend/src/infrastructure/database.ts`
**Purpose**: Manages database connections, models, and operations for the application.

## Database Configuration

### MongoDB Setup
```typescript
interface DatabaseConfig {
  url: string;                   // MongoDB connection URL
  options: {
    useNewUrlParser: boolean;    // Use new URL parser
    useUnifiedTopology: boolean; // Use unified topology
    maxPoolSize: number;         // Maximum connection pool size
    minPoolSize: number;         // Minimum connection pool size
    serverSelectionTimeoutMS: number; // Server selection timeout
    socketTimeoutMS: number;     // Socket timeout
  };
  models: {
    User: Model<User>;
    BirthChart: Model<BirthChart>;
    PlanetaryInsight: Model<PlanetaryInsight>;
    TimingRecommendation: Model<TimingRecommendation>;
  };
}
```

## Connection Management

### Connection Pool
- **Pool Size**: 10-100 connections
- **Timeout**: 30 seconds
- **Retry**: 3 attempts
- **Backoff**: Exponential

### Error Handling
- Connection failures
- Timeout handling
- Retry logic
- Error logging
- Graceful degradation

## Models

### User Model
- Collection: `users`
- Indexes: email, status, lastActive
- Validation: email, name, status

### Birth Chart Model
- Collection: `birthCharts`
- Indexes: userId, birthData.date
- Validation: birthData, positions

### Planetary Insight Model
- Collection: `planetaryInsights`
- Indexes: userId, date, energyLevel
- Validation: energyLevel, recommendations

### Timing Recommendation Model
- Collection: `timingRecommendations`
- Indexes: userId, activity, windows.start
- Validation: windows, risks

## Operations

### CRUD Operations
```typescript
class Database {
  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Model Operations
  create<T>(model: string, data: T): Promise<T>;
  find<T>(model: string, query: Query): Promise<T[]>;
  findOne<T>(model: string, query: Query): Promise<T>;
  update<T>(model: string, query: Query, data: Partial<T>): Promise<T>;
  delete<T>(model: string, query: Query): Promise<boolean>;

  // Transaction Support
  startTransaction(): Promise<Transaction>;
  commitTransaction(transaction: Transaction): Promise<void>;
  rollbackTransaction(transaction: Transaction): Promise<void>;
}
```

## Performance Optimization

### Indexing Strategy
- Compound indexes
- Text indexes
- Geospatial indexes
- TTL indexes

### Query Optimization
- Query caching
- Query planning
- Index usage
- Aggregation pipelines

### Monitoring
- Query performance
- Connection pool
- Index usage
- Error rates

## Security

### Authentication
- MongoDB authentication
- Role-based access
- Connection encryption
- Audit logging

### Data Protection
- Field encryption
- Data masking
- Access control
- Audit trails

## Backup and Recovery

### Backup Strategy
- Daily backups
- Incremental backups
- Point-in-time recovery
- Backup verification

### Recovery Procedures
- Data restoration
- Consistency checks
- Integrity validation
- Performance testing

## Usage Examples

### Database Connection
```typescript
const db = new Database({
  url: process.env.MONGODB_URL,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 50
  }
});

await db.connect();
```

### Model Operations
```typescript
// Create user
const user = await db.create('User', {
  email: 'user@example.com',
  name: 'John Doe'
});

// Find birth chart
const chart = await db.findOne('BirthChart', {
  userId: 'user123'
});

// Update insight
const insight = await db.update('PlanetaryInsight',
  { id: 'insight123' },
  { energyLevel: 85 }
);
```

## Error Handling

### Connection Errors
- Network issues
- Authentication failures
- Timeout errors
- Pool exhaustion

### Operation Errors
- Validation errors
- Duplicate keys
- Constraint violations
- Transaction failures

## Monitoring and Maintenance

### Health Checks
- Connection status
- Query performance
- Index usage
- Error rates

### Maintenance Tasks
- Index optimization
- Data cleanup
- Performance tuning
- Backup verification

## Future Enhancements
- Sharding support
- Read replicas
- Advanced monitoring
- Automated scaling
- Enhanced security 