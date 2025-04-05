# Birth Chart Service

## Overview
**Location**: `apps/backend/src/services/BirthChartService.ts`
**Purpose**: Manages birth chart data, calculations, and storage, serving as the central service for all birth chart-related operations.

## Core Functionality

### 1. Birth Chart Management
- **Creation**
  - Validates birth data
  - Calculates chart positions
  - Stores chart data
  - Generates initial insights

- **Retrieval**
  - Fetches stored charts
  - Handles caching
  - Validates access rights
  - Returns formatted data

- **Updates**
  - Modifies chart data
  - Updates calculations
  - Maintains data integrity
  - Handles versioning

### 2. Chart Calculations
- **Core Calculations**
  - Planetary positions
  - House cusps
  - Aspects
  - Angles

- **Additional Features**
  - Retrograde periods
  - Dignities
  - Rulerships
  - Fixed stars

### 3. Data Storage
- **Database Operations**
  - Chart storage
  - Data retrieval
  - Cache management
  - Data validation

- **Data Integrity**
  - Version control
  - Backup procedures
  - Data validation
  - Error recovery

## Technical Implementation

### Service Architecture
```typescript
class BirthChartService {
  // Core methods
  async createBirthChart(data: BirthChartData): Promise<BirthChart>
  async getBirthChart(id: string): Promise<BirthChart>
  async updateBirthChart(id: string, data: Partial<BirthChart>): Promise<BirthChart>
  async deleteBirthChart(id: string): Promise<void>

  // Calculation methods
  async calculatePositions(date: DateTime, location: GeoPosition): Promise<BodyPosition[]>
  async calculateHouses(date: DateTime, location: GeoPosition): Promise<House[]>
  async calculateAspects(positions: BodyPosition[]): Promise<Aspect[]>

  // Utility methods
  async validateBirthData(data: BirthChartData): Promise<boolean>
  async formatChartData(chart: BirthChart): Promise<FormattedChart>
}
```

### Data Models

#### BirthChart
```typescript
interface BirthChart {
  id: string;
  userId: string;
  birthData: {
    date: DateTime;
    location: GeoPosition;
    timezone: string;
  };
  positions: {
    planets: BodyPosition[];
    houses: House[];
    aspects: Aspect[];
    angles: {
      ascendant: number;
      mc: number;
      descendant: number;
      ic: number;
    };
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: number;
    notes?: string;
  };
}
```

## Usage Examples

### Creating a Birth Chart
```typescript
const birthChart = await birthChartService.createBirthChart({
  userId: "user123",
  birthData: {
    date: "1990-01-01T12:00:00Z",
    location: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    timezone: "America/New_York"
  }
});
```

### Retrieving a Chart
```typescript
const chart = await birthChartService.getBirthChart("chart123");
```

## Error Handling
- Input validation errors
- Calculation errors
- Storage errors
- Access control errors
- Data integrity errors

## Performance Considerations
- Database optimization
- Caching strategy
- Query efficiency
- Resource management
- Load balancing

## Testing
- Unit tests for core logic
- Integration tests for storage
- Performance testing
- Error scenario testing
- Data validation testing

## Future Enhancements
- Additional house systems
- More detailed calculations
- Enhanced data validation
- Better caching
- Advanced chart features 