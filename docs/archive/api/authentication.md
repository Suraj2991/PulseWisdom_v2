# Authentication API

## Overview
The authentication API provides secure user authentication and management for PulseWisdom. It implements industry-standard security practices including JWT-based authentication, password hashing, and rate limiting.

## Endpoints

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "birthDate": "string (optional)",
  "birthTime": "string (optional)",
  "birthLocation": {
    "latitude": "number",
    "longitude": "number",
    "placeName": "string"
  } (optional)
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "birthDate": "string",
    "birthTime": "string",
    "birthLocation": {
      "latitude": "number",
      "longitude": "number",
      "placeName": "string"
    }
  },
  "token": "string"
}
```

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "birthDate": "string",
    "birthTime": "string",
    "birthLocation": {
      "latitude": "number",
      "longitude": "number",
      "placeName": "string"
    }
  },
  "token": "string"
}
```

### Logout
```http
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

### Change Password
```http
POST /api/auth/change-password
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

## Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on sensitive endpoints
- Input validation using Zod
- Protected routes with authentication middleware

## Error Responses
All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "details": [
    {
      "field": "string",
      "message": "string"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "status": "error",
  "message": "Invalid credentials"
}
```

**429 Too Many Requests:**
```json
{
  "status": "error",
  "message": "Too many attempts, please try again after 15 minutes"
}
```

## Rate Limiting
Authentication endpoints are rate-limited to 5 requests per 15-minute window per IP address. Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets 