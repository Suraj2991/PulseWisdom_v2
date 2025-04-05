# User Model

## Overview
**Location**: `apps/backend/src/models/User.ts`
**Purpose**: Defines the core user data structure and relationships for the application.

## Data Structure

### Core User Data
```typescript
interface User {
  id: string;                    // Unique identifier
  email: string;                 // User's email address
  name: string;                  // User's full name
  birthData?: {                  // Optional birth data
    date: DateTime;              // Birth date and time
    location: GeoPosition;       // Birth location
    timezone: string;           // Birth timezone
  };
  preferences: {                 // User preferences
    notifications: boolean;      // Notification settings
    theme: string;              // UI theme preference
    language: string;           // Language preference
    privacy: PrivacySettings;   // Privacy settings
  };
  subscription: {                // Subscription information
    plan: SubscriptionPlan;     // Current subscription plan
    status: SubscriptionStatus; // Subscription status
    startDate: Date;           // Subscription start date
    endDate: Date;             // Subscription end date
    autoRenew: boolean;        // Auto-renewal setting
  };
  metadata: {                    // System metadata
    createdAt: Date;           // Account creation date
    updatedAt: Date;           // Last update date
    lastActive: Date;          // Last activity date
    status: UserStatus;        // Account status
  };
}
```

## Related Types

### DateTime
```typescript
interface DateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  timezone: number;
}
```

### GeoPosition
```typescript
interface GeoPosition {
  latitude: number;
  longitude: number;
}
```

### PrivacySettings
```typescript
interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  birthDataVisibility: 'public' | 'private' | 'friends';
  activityVisibility: 'public' | 'private' | 'friends';
  allowDataSharing: boolean;
}
```

### SubscriptionPlan
```typescript
enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}
```

### SubscriptionStatus
```typescript
enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
  TRIAL = 'trial'
}
```

### UserStatus
```typescript
enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
  PENDING = 'pending'
}
```

## Relationships

### Birth Chart
- One-to-One relationship
- Optional relationship
- Contains birth data for astrological calculations

### Insights
- One-to-Many relationship
- Contains user's astrological insights
- Historical record of generated insights

### Activity Logs
- One-to-Many relationship
- Tracks user activity
- Used for analytics and monitoring

## Validation Rules

### Required Fields
- id
- email
- name
- preferences
- subscription
- metadata

### Field Constraints
- Email: Valid email format
- Name: Non-empty string
- Dates: Valid date format
- Status: Valid enum value
- Plan: Valid subscription plan

## Indexes

### Primary Index
- id (unique)

### Secondary Indexes
- email (unique)
- status
- subscription.status
- metadata.lastActive

## Methods

### Instance Methods
```typescript
class User {
  // Validation
  validate(): boolean;
  validateEmail(): boolean;
  validateBirthData(): boolean;

  // Status Management
  activate(): void;
  deactivate(): void;
  suspend(): void;
  delete(): void;

  // Subscription Management
  updateSubscription(plan: SubscriptionPlan): void;
  cancelSubscription(): void;
  renewSubscription(): void;

  // Preference Management
  updatePreferences(preferences: UserPreferences): void;
  resetPreferences(): void;
}
```

## Usage Examples

### Creating a User
```typescript
const user = new User({
  email: "user@example.com",
  name: "John Doe",
  preferences: {
    notifications: true,
    theme: "dark",
    language: "en",
    privacy: {
      profileVisibility: "private",
      birthDataVisibility: "private",
      activityVisibility: "friends",
      allowDataSharing: false
    }
  },
  subscription: {
    plan: SubscriptionPlan.FREE,
    status: SubscriptionStatus.ACTIVE,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    autoRenew: false
  }
});
```

### Updating User Status
```typescript
user.suspend();
user.updatePreferences({
  notifications: false,
  theme: "light",
  language: "es"
});
```

## Data Integrity

### Constraints
- Unique email addresses
- Valid subscription dates
- Required metadata fields
- Valid status transitions

### Triggers
- Status change notifications
- Subscription expiration checks
- Activity logging
- Data backup

## Performance Considerations
- Indexed queries
- Cached user data
- Efficient updates
- Batch operations
- Query optimization

## Security
- Data encryption
- Access control
- Audit logging
- Data masking
- Privacy compliance

## Future Enhancements
- Additional preferences
- Enhanced privacy controls
- Advanced subscription features
- Better activity tracking
- Social features 