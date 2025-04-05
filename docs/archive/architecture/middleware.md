# Middleware Architecture

## Overview
PulseWisdom implements a layered middleware architecture to handle cross-cutting concerns like authentication, validation, rate limiting, and error handling.

## Middleware Stack

### Core Middleware
1. **CORS**
   - Handles cross-origin requests
   - Configurable allowed origins
   - Secure headers

2. **Rate Limiting**
   - IP-based rate limiting
   - Redis-backed storage
   - Configurable limits per endpoint

3. **Request Validation**
   - Zod schema validation
   - Type-safe validation
   - Detailed error messages

4. **Authentication**
   - JWT token validation
   - User context injection
   - Role-based access control

5. **Error Handling**
   - Global error handler
   - Custom error types
   - Development mode stack traces

## Implementation

### Middleware Order
```typescript
app.use(cors());
app.use(rateLimiter);
app.use(express.json());
app.use(validateRequest);
app.use(authenticate);
app.use(errorHandler);
```

### Custom Middleware

#### Authentication Middleware
```typescript
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new AppError(401, 'No token provided');
    }
    const user = await authService.validateToken(token);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
```

#### Validation Middleware
```typescript
const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError(400, 'Validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
};
```

## Best Practices

### Middleware Design
1. Single responsibility principle
2. Early return on failure
3. Proper error propagation
4. Performance optimization

### Error Handling
1. Consistent error format
2. Proper error logging
3. Security error handling
4. Development mode details

### Performance
1. Minimal middleware overhead
2. Efficient validation
3. Caching where appropriate
4. Async operation handling

## Security Considerations

### Authentication
- Token validation
- User context
- Role checking
- Session management

### Input Validation
- Schema validation
- Type checking
- Sanitization
- Size limits

### Rate Limiting
- IP tracking
- Request counting
- Window management
- Redis storage

## Testing

### Middleware Tests
1. Unit tests for each middleware
2. Integration tests for middleware chain
3. Error handling tests
4. Performance tests 