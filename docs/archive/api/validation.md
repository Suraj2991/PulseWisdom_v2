# Request Validation API

## Overview
PulseWisdom uses Zod for request validation, providing type-safe validation with detailed error messages. All API endpoints implement consistent validation patterns.

## Validation Patterns

### Common Validation Rules

#### Email Validation
```typescript
z.string().email('Invalid email format')
```

#### Password Validation
```typescript
z.string().min(8, 'Password must be at least 8 characters')
```

#### Date Validation
```typescript
z.string().datetime('Invalid date format')
```

#### Location Validation
```typescript
z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  placeName: z.string()
})
```

## Error Response Format

### Validation Error
```json
{
  "status": "error",
  "message": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

## Implementation Details

### Middleware
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

### Usage Example
```typescript
router.post('/register', validateRequest(registerSchema), async (req, res) => {
  // Handle validated request
});
```

## Best Practices

### Schema Organization
1. Define schemas in separate files
2. Reuse common validation rules
3. Use TypeScript inference
4. Document validation rules

### Error Handling
1. Provide clear error messages
2. Include field-specific errors
3. Handle nested validation
4. Log validation failures

### Performance
1. Cache compiled schemas
2. Minimize validation overhead
3. Validate early in request lifecycle
4. Use appropriate validation depth

## Security Considerations

### Input Sanitization
- HTML escaping
- SQL injection prevention
- XSS protection
- CSRF protection

### Data Types
- Strict type checking
- Number range validation
- String length limits
- Date format validation

## Testing

### Validation Tests
1. Test valid inputs
2. Test invalid inputs
3. Test edge cases
4. Test nested objects
5. Test array validation 