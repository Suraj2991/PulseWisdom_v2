# Planetary Insight API Documentation

## Overview

The Planetary Insight API provides endpoints for managing and retrieving planetary insights, including daily positions, transits, and astrological interpretations.

## Endpoints

### Create Planetary Insight

```http
POST /api/insights
```

Creates a new planetary insight for a specific user and birth chart.

#### Request Body
```json
{
  "userId": "string",
  "birthChartId": "string",
  "date": "2024-03-22T00:00:00Z",
  "type": "daily"
}
```

#### Response
```json
{
  "id": "string",
  "userId": "string",
  "birthChartId": "string",
  "date": "2024-03-22T00:00:00Z",
  "insights": [
    {
      "bodyId": 0,
      "type": "daily",
      "aspects": [
        {
          "bodyId": 1,
          "type": "conjunction",
          "angle": 0,
          "orb": 2.5,
          "isApplying": true
        }
      ],
      "house": 1,
      "dignity": {
        "ruler": true,
        "exaltation": false,
        "detriment": false,
        "fall": false,
        "score": 5
      },
      "interpretation": "string",
      "recommendations": ["string"]
    }
  ]
}
```

### Get Insight by ID

```http
GET /api/insights/:id
```

Retrieves a specific planetary insight by its ID.

#### Response
```json
{
  "id": "string",
  "userId": "string",
  "birthChartId": "string",
  "date": "2024-03-22T00:00:00Z",
  "insights": [...]
}
```

### Get Insights by User

```http
GET /api/insights/user/:userId
```

Retrieves all planetary insights for a specific user.

#### Response
```json
{
  "insights": [
    {
      "id": "string",
      "birthChartId": "string",
      "date": "2024-03-22T00:00:00Z",
      "insights": [...]
    }
  ]
}
```

### Get Insights by Birth Chart

```http
GET /api/insights/chart/:birthChartId
```

Retrieves all planetary insights for a specific birth chart.

#### Response
```json
{
  "insights": [
    {
      "id": "string",
      "userId": "string",
      "date": "2024-03-22T00:00:00Z",
      "insights": [...]
    }
  ]
}
```

### Get Insights by Date Range

```http
GET /api/insights/range
```

Retrieves planetary insights within a specified date range.

#### Query Parameters
- `userId`: string
- `startDate`: ISO date string
- `endDate`: ISO date string

#### Response
```json
{
  "insights": [
    {
      "id": "string",
      "birthChartId": "string",
      "date": "2024-03-22T00:00:00Z",
      "insights": [...]
    }
  ]
}
```

### Update Insight

```http
PUT /api/insights/:id
```

Updates an existing planetary insight.

#### Request Body
```json
{
  "interpretation": "string",
  "recommendations": ["string"]
}
```

#### Response
```json
{
  "id": "string",
  "userId": "string",
  "birthChartId": "string",
  "date": "2024-03-22T00:00:00Z",
  "insights": [...]
}
```

### Delete Insight

```http
DELETE /api/insights/:id
```

Deletes a specific planetary insight.

#### Response
```json
{
  "success": true
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid input",
  "details": "string"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "string"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "string"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "string"
}
```

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per user

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <token>
``` 