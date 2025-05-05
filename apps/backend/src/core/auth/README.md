# Authentication Module

## Overview
This module handles user authentication and authorization. It manages user sessions, JWT tokens, and access control.

## Structure
```
auth/
├── controllers/     # API controllers for auth endpoints
├── services/        # Authentication and authorization
├── models/          # Auth data models
├── types/           # TypeScript type definitions
├── dtos/            # Data transfer objects
├── validators/      # Input validation
├── transformers/    # Data transformation
├── ports/           # Interface definitions
├── middleware/      # Auth middleware
└── utils/           # Utility functions
```

## Key Components
- **AuthService**: Core service for authentication
- **AuthController**: Handles HTTP requests for auth operations
- **AuthMiddleware**: Middleware for protecting routes
- **AuthTypes**: TypeScript interfaces and types

## Usage
```typescript
// Example: User authentication
const authService = new AuthService();
const token = await authService.authenticateUser(email, password);
```

## Dependencies
- UserService: For user data
- JWT: For token management

## Related Modules
- User Module: For user data
