# WebSocket API Documentation

## Overview
The WebSocket API provides real-time updates for birth charts, planetary positions, and astrological insights. It enables live chart updates, transit monitoring, and instant notifications for significant astrological events.

## Connection Details

### Connection URL
```typescript
const ws = new WebSocket('wss://api.pulsewisdom.com/v2/ws');
```

### Authentication
```typescript
// Initial connection with authentication token
const ws = new WebSocket('wss://api.pulsewisdom.com/v2/ws', {
  headers: {
    'Authorization': `Bearer ${jwt_token}`
  }
});
```

## Message Protocol

### Message Structure
```typescript
interface WebSocketMessage<T> {
  type: MessageType;
  data: T;
  timestamp: string;
  requestId?: string;  // For request-response pattern
}

enum MessageType {
  // Server -> Client Messages
  POSITION_UPDATE = 'POSITION_UPDATE',
  BIRTH_CHART_UPDATE = 'BIRTH_CHART_UPDATE',
  INSIGHT_UPDATE = 'INSIGHT_UPDATE',
  ERROR = 'ERROR',
  
  // Client -> Server Messages
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  REQUEST_UPDATE = 'REQUEST_UPDATE'
}
```

### Subscription Messages

1. **Subscribe to Updates**
```typescript
interface SubscriptionRequest {
  type: 'SUBSCRIBE';
  data: {
    channels: Array<{
      type: 'BIRTH_CHART' | 'PLANETARY_POSITIONS' | 'INSIGHTS';
      id?: string;  // Required for birth chart and insight subscriptions
    }>;
  };
}
```

2. **Unsubscribe from Updates**
```typescript
interface UnsubscriptionRequest {
  type: 'UNSUBSCRIBE';
  data: {
    channels: Array<{
      type: 'BIRTH_CHART' | 'PLANETARY_POSITIONS' | 'INSIGHTS';
      id?: string;
    }>;
  };
}
```

### Update Messages

1. **Planetary Position Updates**
```typescript
interface PositionUpdate {
  type: 'POSITION_UPDATE';
  data: {
    bodies: Array<{
      bodyId: number;
      longitude: number;
      latitude: number;
      distance: number;
      speed: number;
      retrograde: boolean;
      id: number;
      isRetrograde: boolean;
      house: number;
    }>;
  };
  timestamp: string;
}
```

2. **Birth Chart Updates**
```typescript
interface BirthChartUpdate {
  type: 'BIRTH_CHART_UPDATE';
  data: {
    chartId: string;
    chart: {
      // Full birth chart data structure
      id: string;
      userId: string;
      datetime: DateTime;
      location: GeoPosition;
      angles: ChartAngles;
      houses: HouseSystem;
      bodies: CelestialBody[];
      aspects: Aspect[];
    };
  };
  timestamp: string;
}
```

3. **Insight Updates**
```typescript
interface InsightUpdate {
  type: 'INSIGHT_UPDATE';
  data: {
    userId: string;
    insights: Array<{
      id: string;
      type: 'DAILY' | 'TRANSIT' | 'PROGRESSION';
      description: string;
      interpretation: string;
      recommendations: string[];
      bodies: CelestialBody[];
      aspects: Aspect[];
      dignity: Dignity[];
    }>;
  };
  timestamp: string;
}
```

### Error Messages
```typescript
interface ErrorMessage {
  type: 'ERROR';
  data: {
    code: ErrorCode;
    message: string;
    details?: string;
    requestId?: string;
  };
  timestamp: string;
}

enum ErrorCode {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  SUBSCRIPTION_ERROR = 'SUBSCRIPTION_ERROR',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

## Connection Management

### Heartbeat Mechanism
```typescript
// Client-side heartbeat implementation
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'PING' }));
  }
}, HEARTBEAT_INTERVAL);

// Server responds with PONG
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'PONG') {
    // Reset connection timeout
  }
};
```

### Reconnection Strategy
```typescript
const RECONNECT_DELAYS = [0, 1000, 5000, 15000]; // Progressive delays
let reconnectAttempt = 0;

function connect() {
  ws = new WebSocket(URL);
  
  ws.onclose = () => {
    if (reconnectAttempt < RECONNECT_DELAYS.length) {
      setTimeout(connect, RECONNECT_DELAYS[reconnectAttempt++]);
    }
  };

  ws.onopen = () => {
    reconnectAttempt = 0;
    // Resubscribe to previous channels
  };
}
```

## Performance Optimizations

### Message Batching
- Updates are batched and sent every 1 second
- Multiple position updates are combined
- Aspect calculations are cached
- Transit notifications are grouped

### Connection Pooling
- Maximum 10,000 concurrent connections
- Load balancing across multiple servers
- Connection cleanup after 5 minutes of inactivity
- Resource usage monitoring

### Data Optimization
- Message compression for large updates
- Partial updates for changed data only
- Binary protocol for position updates
- Efficient JSON serialization

## Security Features

### Connection Security
- WSS (WebSocket Secure) required
- JWT token validation
- Rate limiting per connection
- IP-based throttling

### Data Validation
- Message schema validation
- Input sanitization
- Payload size limits
- Type checking

### Access Control
- User-specific subscriptions
- Resource-based permissions
- Connection quotas
- Action rate limiting

## Monitoring

### Metrics
- Connection count
- Message throughput
- Error rates
- Latency measurements
- Resource usage
- Cache hit rates

### Logging
- Connection events
- Error tracking
- Performance metrics
- Security events
- System health

## Error Handling
- Automatic reconnection
- Error message queuing
- Graceful degradation
- Circuit breaking
- Error reporting 