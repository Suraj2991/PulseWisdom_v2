# Error Handling Architecture

## Overview
PulseWisdom implements a comprehensive error handling system that provides consistent error responses, proper logging, and development-friendly debugging information.

## Error Types

### AppError
Base error class for application-specific errors:
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: ValidationError[] | boolean
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
```

### Custom Error Types
1. **ValidationError**
   - HTTP Status: 400
   - Input validation failures
   - Schema validation errors

2. **AuthenticationError**
   - HTTP Status: 401
   - Invalid credentials
   - Missing token

3. **AuthorizationError**
   - HTTP Status: 403
   - Insufficient permissions
   - Role-based access failures

4. **NotFoundError**
   - HTTP Status: 404
   - Resource not found
   - Invalid routes

5. **RateLimitError**
   - HTTP Status: 429
   - Rate limit exceeded
   - Too many requests

## Error Response Format

### Standard Error Response
```json
{
  "status": "error",
  "message": "string",
  "details": [
    {
      "field": "string",
      "message": "string"
    }
  ]
}
```

### Development Mode Response
```json
{
  "status": "error",
  "message": "string",
  "details": [...],
  "stack": "string"
}
```

## Implementation

### Global Error Handler
```typescript
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  // Send generic error response
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
```

## Best Practices

### Error Creation
1. Use appropriate error types
2. Include meaningful messages
3. Provide relevant details
4. Set correct status codes

### Error Handling
1. Catch errors early
2. Log errors properly
3. Sanitize error messages
4. Handle async errors

### Error Logging
1. Structured logging
2. Error context
3. Stack traces
4. Performance impact

## Security Considerations

### Error Exposure
- Hide sensitive information
- Sanitize error messages
- Control stack traces
- Rate limit error responses

### Error Monitoring
- Track error patterns
- Monitor error rates
- Alert on critical errors
- Analyze error trends

## Testing

### Error Tests
1. Test error creation
2. Test error handling
3. Test error responses
4. Test error logging
5. Test security measures 