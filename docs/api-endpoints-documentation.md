# API Endpoints Documentation - "Moje fiszki" Features

## Overview

This document describes the new and enhanced API endpoints implemented for the "Moje fiszki" (My Flashcards) functionality. All endpoints require authentication via JWT token in the Authorization header.

## Base URL

```
/api/flashcards
```

## Enhanced Endpoints

### 1. GET /api/flashcards (Enhanced)

**Description**: Retrieve user's flashcards with basic or extended filtering, search, and pagination.

**Query Parameters**:

#### Basic Parameters (existing):

- `page`: number (default: 1) - Page number for pagination
- `limit`: number (default: 20, max: 100) - Number of results per page
- `source`: string ("ai-full" | "ai-edit" | "manual") - Filter by flashcard source
- `due_before`: string (ISO timestamp) - Filter flashcards due before this date
- `sort`: string ("created_at" | "due" | "difficulty") - Sort field
- `order`: string ("asc" | "desc", default: "desc") - Sort order

#### Extended Parameters (new):

- `search`: string (1-200 chars) - Full-text search in front_text and back_text
- `created_after`: string (ISO date) - Filter flashcards created after this date
- `created_before`: string (ISO date) - Filter flashcards created before this date
- `difficulty_min`: number (0-5) - Minimum difficulty level
- `difficulty_max`: number (0-5) - Maximum difficulty level
- `reps_min`: number (≥0) - Minimum number of repetitions
- `reps_max`: number (≥0) - Maximum number of repetitions
- `never_reviewed`: boolean - Show only flashcards never reviewed (reps = 0)
- `due_only`: boolean - Show only flashcards due for review

**Example Requests**:

```bash
# Basic filtering
GET /api/flashcards?source=ai-full&limit=10&sort=created_at&order=desc

# Extended search and filtering
GET /api/flashcards?search=javascript&difficulty_min=2&difficulty_max=4&never_reviewed=true

# Date range filtering
GET /api/flashcards?created_after=2024-01-01T00:00:00Z&created_before=2024-12-31T23:59:59Z

# Due flashcards only
GET /api/flashcards?due_only=true&limit=50
```

**Response**:

```json
{
  "success": true,
  "data": {
    "flashcards": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "front_text": "Czym jest React?",
        "back_text": "React to biblioteka JavaScript do budowania interfejsów użytkownika",
        "source": "ai-full",
        "due": "2024-01-15T10:00:00Z",
        "scheduled_days": 1,
        "difficulty": 2.5,
        "reps": 3,
        "created_at": "2024-01-01T10:00:00Z",
        "updated_at": "2024-01-10T15:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_count": 89,
      "limit": 20
    }
  }
}
```

---

### 2. DELETE /api/flashcards/bulk

**Description**: Bulk delete multiple flashcards (soft delete - sets is_deleted = true).

**Request Body**:

```json
{
  "flashcard_ids": [
    "123e4567-e89b-12d3-a456-426614174001",
    "123e4567-e89b-12d3-a456-426614174002",
    "123e4567-e89b-12d3-a456-426614174003"
  ]
}
```

**Validation Rules**:

- `flashcard_ids`: Array of UUIDs, min 1, max 100 items
- All flashcard IDs must be valid UUIDs
- User can only delete their own flashcards

**Success Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "deleted_count": 3,
    "failed_count": 0,
    "errors": []
  }
}
```

**Partial Success Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "deleted_count": 2,
    "failed_count": 1,
    "errors": [
      {
        "flashcard_id": "123e4567-e89b-12d3-a456-426614174003",
        "error": "Flashcard not found",
        "code": "NOT_FOUND"
      }
    ]
  }
}
```

**Error Codes**:

- `NOT_FOUND`: Flashcard doesn't exist or doesn't belong to user
- `VALIDATION_ERROR`: Database or other validation error

---

### 3. PUT /api/flashcards/bulk

**Description**: Bulk update multiple flashcards.

**Request Body**:

```json
{
  "updates": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "front_text": "Updated front text",
      "source": "manual"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "back_text": "Updated back text",
      "source": "ai-edit"
    }
  ]
}
```

**Validation Rules**:

- `updates`: Array of update objects, min 1, max 50 items
- Each update must contain:
  - `id`: Valid UUID (required)
  - `front_text`: String 1-200 chars (optional)
  - `back_text`: String 1-500 chars (optional)
  - `source`: "ai-edit" | "manual" (required)
- At least one of `front_text` or `back_text` must be provided per update

**Success Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "updated_count": 2,
    "failed_count": 0,
    "flashcards": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "front_text": "Updated front text",
        "back_text": "Original back text",
        "source": "manual",
        "due": "2024-01-15T10:00:00Z",
        "scheduled_days": 1,
        "difficulty": 2.5,
        "reps": 3,
        "created_at": "2024-01-01T10:00:00Z",
        "updated_at": "2024-01-15T12:00:00Z"
      }
    ],
    "errors": []
  }
}
```

**Partial Success Response** (207 Multi-Status):

```json
{
  "success": true,
  "data": {
    "updated_count": 1,
    "failed_count": 1,
    "flashcards": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "front_text": "Updated front text"
        // ... other fields
      }
    ],
    "errors": [
      {
        "flashcard_id": "123e4567-e89b-12d3-a456-426614174002",
        "error": "Flashcard with this front text already exists",
        "code": "DUPLICATE"
      }
    ]
  }
}
```

**Error Codes**:

- `NOT_FOUND`: Flashcard doesn't exist or doesn't belong to user
- `DUPLICATE`: Front text conflicts with existing flashcard
- `VALIDATION_ERROR`: Field validation or database error

---

### 4. GET /api/flashcards/stats

**Description**: Get comprehensive flashcard statistics for the authenticated user.

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "stats": {
      "total_count": 150,
      "by_source": {
        "ai-full": 80,
        "ai-edit": 45,
        "manual": 25
      },
      "by_difficulty": {
        "easy": 60,
        "medium": 70,
        "hard": 20
      },
      "due_today": 12,
      "due_this_week": 45,
      "overdue": 8,
      "never_reviewed": 23,
      "avg_difficulty": 2.8,
      "total_reviews": 340,
      "created_this_month": 15,
      "longest_streak": 0
    }
  }
}
```

**Statistics Explanation**:

- `total_count`: Total number of active (non-deleted) flashcards
- `by_source`: Breakdown by creation source
- `by_difficulty`: Breakdown by difficulty levels:
  - easy: 0-2
  - medium: 2-4
  - hard: 4-5
- `due_today`: Flashcards due today or earlier
- `due_this_week`: Flashcards due within the next 7 days
- `overdue`: Flashcards past their due date
- `never_reviewed`: Flashcards with reps = 0
- `avg_difficulty`: Average difficulty across all flashcards
- `total_reviews`: Sum of all repetitions
- `created_this_month`: Flashcards created in current month
- `longest_streak`: Learning streak (placeholder, always 0)

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "details": [
    {
      "field": "field_name",
      "code": "ERROR_CODE",
      "message": "Detailed error message"
    }
  ]
}
```

**Common HTTP Status Codes**:

- `200 OK`: Success
- `207 Multi-Status`: Partial success for bulk operations
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate data
- `413 Payload Too Large`: Request body too large
- `500 Internal Server Error`: Server error

## Performance Considerations

### Database Indexes

The following indexes have been added for optimal performance:

1. **Full-text search**: `idx_flashcards_fulltext_search`
2. **User + date filtering**: `idx_flashcards_user_created`
3. **User + difficulty**: `idx_flashcards_user_difficulty`
4. **User + repetitions**: `idx_flashcards_user_reps`
5. **User + due dates**: `idx_flashcards_user_due`
6. **Hash-based duplicate detection**: `idx_flashcards_user_front_hash`

### Rate Limiting

- Search queries: Max 100 requests per minute per user
- Bulk operations: Max 10 requests per minute per user
- Statistics: Max 60 requests per minute per user

### Pagination Limits

- Default page size: 20 items
- Maximum page size: 100 items
- Maximum search results: 1000 items

## Usage Examples

### 1. Search for JavaScript flashcards with medium difficulty

```bash
curl -X GET "/api/flashcards?search=javascript&difficulty_min=2&difficulty_max=4" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Delete multiple flashcards

```bash
curl -X DELETE "/api/flashcards/bulk" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "flashcard_ids": [
      "123e4567-e89b-12d3-a456-426614174001",
      "123e4567-e89b-12d3-a456-426614174002"
    ]
  }'
```

### 3. Update multiple flashcards

```bash
curl -X PUT "/api/flashcards/bulk" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "front_text": "What is React?",
        "source": "manual"
      }
    ]
  }'
```

### 4. Get user statistics

```bash
curl -X GET "/api/flashcards/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This completes the implementation of the "Moje fiszki" API functionality as specified in the requirements document.
