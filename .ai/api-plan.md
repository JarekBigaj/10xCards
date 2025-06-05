# REST API Plan

## 1. Resources

### Primary Resources

- **users** - User accounts and profiles (managed by Supabase Auth)
- **flashcards** - Individual flashcards with front/back text and spaced repetition metadata
- **review_records** - Records of user reviews/ratings for flashcards
- **ai_candidates** - Temporary AI-generated flashcard candidates (session storage only)

## 2. Endpoints

### AI Generation Endpoints

#### Generate Flashcard Candidates

- **Method**: POST
- **Path**: `/api/ai/generate-candidates`
- **Description**: Generate flashcard candidates from input text using AI
- **Query Parameters**: None
- **Request Body**:

```json
{
  "text": "string (1000-10000 characters)",
  "retry_count": "number (optional, for internal retry logic)"
}
```

- **Response Body**:

```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "id": "string (temporary UUID)",
        "front_text": "string (max 200 chars)",
        "back_text": "string (max 500 chars)",
        "confidence": "number (0-1)"
      }
    ],
    "generation_metadata": {
      "model_used": "string",
      "processing_time_ms": "number",
      "retry_count": "number"
    }
  }
}
```

- **Success Codes**: 200 OK
- **Error Codes**:
  - 400 Bad Request (invalid text length)
  - 429 Too Many Requests (rate limiting)
  - 503 Service Unavailable (AI service circuit breaker active)

### Flashcards Endpoints

#### Get User's Flashcards

- **Method**: GET
- **Path**: `/api/flashcards`
- **Description**: Retrieve user's flashcards with pagination and filtering
- **Query Parameters**:
  - `page`: number (default: 1)
  - `limit`: number (default: 20, max: 100)
  - `source`: string (ai-full|ai-edit|manual)
  - `due_before`: ISO timestamp
  - `sort`: string (created_at|due|difficulty)
  - `order`: string (asc|desc, default: desc)
- **Response Body**:

```json
{
  "success": true,
  "data": {
    "flashcards": [
      {
        "id": "uuid",
        "front_text": "string",
        "back_text": "string",
        "source": "ai-full|ai-edit|manual",
        "due": "ISO timestamp",
        "scheduled_days": "number",
        "difficulty": "number",
        "reps": "number",
        "created_at": "ISO timestamp",
        "updated_at": "ISO timestamp"
      }
    ],
    "pagination": {
      "current_page": "number",
      "total_pages": "number",
      "total_count": "number",
      "limit": "number"
    }
  }
}
```

- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 403 Forbidden

#### Create Flashcard(s)

- **Method**: POST
- **Path**: `/api/flashcards`
- **Description**: Create one or multiple flashcards (manual or from accepted AI candidates)
- **Request Body** (Single flashcard):

```json
{
  "front_text": "string (max 200 chars, required)",
  "back_text": "string (max 500 chars, required)",
  "source": "ai-full|ai-edit|manual (required)",
  "candidate_id": "string (optional, for tracking AI candidates)"
}
```

- **Request Body** (Multiple flashcards):

```json
{
  "flashcards": [
    {
      "front_text": "string (max 200 chars, required)",
      "back_text": "string (max 500 chars, required)",
      "source": "ai-full|ai-edit|manual (required)",
      "candidate_id": "string (optional, for tracking AI candidates)"
    },
    {
      "front_text": "string (max 200 chars, required)",
      "back_text": "string (max 500 chars, required)",
      "source": "ai-full|ai-edit|manual (required)",
      "candidate_id": "string (optional, for tracking AI candidates)"
    }
  ]
}
```

- **Response Body** (Single flashcard):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "front_text": "string",
    "back_text": "string",
    "source": "string",
    "due": "ISO timestamp",
    "scheduled_days": 0,
    "difficulty": 2.5,
    "reps": 0,
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp"
  }
}
```

- **Response Body** (Multiple flashcards):

```json
{
  "success": true,
  "data": {
    "created_count": "number",
    "failed_count": "number",
    "flashcards": [
      {
        "id": "uuid",
        "front_text": "string",
        "back_text": "string",
        "source": "string",
        "due": "ISO timestamp",
        "scheduled_days": 0,
        "difficulty": 2.5,
        "reps": 0,
        "created_at": "ISO timestamp",
        "updated_at": "ISO timestamp"
      }
    ],
    "errors": [
      {
        "index": "number",
        "front_text": "string",
        "error": "string",
        "code": "DUPLICATE|VALIDATION_ERROR"
      }
    ]
  }
}
```

- **Success Codes**:
  - 201 Created (all flashcards created successfully)
  - 207 Multi-Status (partial success - some flashcards created, some failed)
- **Error Codes**:
  - 400 Bad Request (validation errors for single flashcard or invalid request format)
  - 409 Conflict (duplicate front_text for user in single flashcard creation)
  - 413 Payload Too Large (too many flashcards in batch, max 50 per request)

#### Get Single Flashcard

- **Method**: GET
- **Path**: `/api/flashcards/{id}`
- **Description**: Retrieve a specific flashcard
- **Response Body**: Same as single flashcard object above
- **Success Codes**: 200 OK
- **Error Codes**: 404 Not Found, 403 Forbidden

#### Update Flashcard

- **Method**: PUT
- **Path**: `/api/flashcards/{id}`
- **Description**: Update an existing flashcard
- **Request Body**:

```json
{
  "front_text": "string (max 200 chars, optional)",
  "back_text": "string (max 500 chars, optional)",
  "source": "ai-edit|manual (required)",
}
```

- **Response Body**: Same as single flashcard object
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 404 Not Found, 409 Conflict
- **Validations**:
    - `front` maximum length: 200 characters.
    - `back` maximum length: 500 characters.
    - `source`: Must be one of `ai-edit` or `manual`

#### Delete Flashcard

- **Method**: DELETE
- **Path**: `/api/flashcards/{id}`
- **Description**: Soft delete a flashcard
- **Response Body**:

```json
{
  "success": true,
  "message": "Flashcard deleted successfully"
}
```

- **Success Codes**: 200 OK
- **Error Codes**: 404 Not Found, 403 Forbidden

### Study Session Endpoints

#### Get Study Session

- **Method**: GET
- **Path**: `/api/study/session`
- **Description**: Get flashcards due for review based on ts-fsrs algorithm
- **Query Parameters**:
  - `limit`: number (default: 20, max: 50)
- **Response Body**:

```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "flashcards": [
      {
        "id": "uuid",
        "front_text": "string",
        "back_text": "string",
        "due": "ISO timestamp",
        "difficulty": "number",
        "reps": "number"
      }
    ],
    "total_due": "number",
    "estimated_time_minutes": "number"
  }
}
```

- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized

#### Get Review Schedule

- **Method**: GET
- **Path**: `/api/study/schedule`
- **Description**: Get upcoming review schedule
- **Query Parameters**:
  - `days_ahead`: number (default: 7, max: 30)
- **Response Body**:

```json
{
  "success": true,
  "data": {
    "schedule": [
      {
        "date": "ISO date",
        "count": "number",
        "flashcard_ids": ["uuid"]
      }
    ]
  }
}
```

- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized

### Review Records Endpoints

#### Submit Review

- **Method**: POST
- **Path**: `/api/reviews`
- **Description**: Submit a review rating for a flashcard
- **Request Body**:

```json
{
  "flashcard_id": "uuid (required)",
  "rating": "number (1-4, required)",
  "session_id": "uuid (optional)"
}
```

- **Response Body**:

```json
{
  "success": true,
  "data": {
    "review_id": "uuid",
    "flashcard_id": "uuid",
    "rating": "number",
    "next_due": "ISO timestamp",
    "updated_difficulty": "number",
    "updated_reps": "number",
    "created_at": "ISO timestamp"
  }
}
```

- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request, 404 Not Found (flashcard not found)

#### Get Review History

- **Method**: GET
- **Path**: `/api/reviews`
- **Description**: Get user's review history
- **Query Parameters**:
  - `flashcard_id`: uuid (optional)
  - `page`: number (default: 1)
  - `limit`: number (default: 50, max: 200)
  - `from_date`: ISO date (optional)
  - `to_date`: ISO date (optional)
- **Response Body**:

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "flashcard_id": "uuid",
        "rating": "number",
        "created_at": "ISO timestamp"
      }
    ],
    "pagination": {
      "current_page": "number",
      "total_pages": "number",
      "total_count": "number"
    }
  }
}
```

- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized

### User Profile Endpoints

#### Get User Profile

- **Method**: GET
- **Path**: `/api/users/profile`
- **Description**: Get current user's profile information
- **Response Body**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "created_at": "ISO timestamp",
    "stats": {
      "total_flashcards": "number",
      "flashcards_by_source": {
        "ai-full": "number",
        "ai-edit": "number",
        "manual": "number"
      },
      "total_reviews": "number",
      "avg_rating": "number"
    }
  }
}
```

- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized

#### Delete User Account

- **Method**: DELETE
- **Path**: `/api/users/profile`
- **Description**: Delete user account and all associated data
- **Response Body**:

```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized

### Analytics Endpoints

#### Get Generation Analytics

- **Method**: GET
- **Path**: `/api/analytics/generation`
- **Description**: Get AI generation metrics for monitoring
- **Query Parameters**:
  - `from_date`: ISO date (optional)
  - `to_date`: ISO date (optional)
- **Response Body**:

```json
{
  "success": true,
  "data": {
    "total_generations": "number",
    "total_candidates": "number",
    "total_accepted": "number",
    "acceptance_rate": "number",
    "ai_vs_manual_ratio": "number",
    "avg_processing_time_ms": "number",
    "error_rate": "number"
  }
}
```

- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 403 Forbidden (admin only)

## 3. Authentication and Authorization

### Authentication Mechanism

- **Provider**: Supabase Auth
- **Method**: JWT tokens passed in Authorization header as `Bearer {token}`
- **Token Refresh**: Handled automatically by Supabase client libraries
- **Session Management**: Stateless JWT-based authentication

### Authorization Rules

- **Row Level Security (RLS)**: Implemented at database level via Supabase
- **User Isolation**: Users can only access their own flashcards and reviews
- **Admin Endpoints**: Analytics endpoints require admin role (future implementation)

### Security Headers

- All endpoints require `Authorization: Bearer {jwt_token}` header
- CORS configured for frontend domain only
- Rate limiting applied per user for AI generation endpoints

## 4. Validation and Business Logic

### Validation Rules

#### Text Input Validation

- **AI Generation Text**: 1000-10000 characters required
- **Flashcard Front Text**: 1-200 characters required, unique per user
- **Flashcard Back Text**: 1-500 characters required
- **Review Rating**: Integer between 1-4 inclusive
- **Source**: Must be one of: 'ai-full', 'ai-edit', 'manual'

#### Business Logic Implementation

#### AI Generation Logic

- **Retry Mechanism**: Automatic retry up to 2 times with exponential backoff and jitter
- **Circuit Breaker**: Activate after 5 consecutive failures, disable for 5 minutes
- **Rate Limiting**: Maximum 10 generations per user per hour
- **Quality Control**: Validate generated candidates meet length requirements

#### Spaced Repetition Logic

- **Algorithm**: ts-fsrs v4 implementation for scheduling
- **Default Values**: difficulty=2.5, scheduled_days=0, reps=0
- **Review Processing**: Update flashcard metadata based on rating using ts-fsrs
- **Due Date Calculation**: Automatic calculation based on algorithm output

#### Data Integrity Logic

- **Soft Delete**: Set is_deleted=true instead of hard delete
- **Duplicate Prevention**: Enforce unique front_text per user constraint
- **Referential Integrity**: Ensure review records reference valid flashcards
- **Timestamp Management**: Auto-update updated_at on flashcard modifications

#### Error Handling Strategy

- **AI Service Failures**: Graceful degradation with clear user messaging
- **Validation Errors**: Detailed field-level error responses
- **Rate Limiting**: Clear indication of limits and reset times
- **Database Constraints**: User-friendly messages for constraint violations

#### Performance Optimizations

- **Pagination**: Default limits to prevent large response payloads
- **Indexing**: Leverage database indexes for user_id, due date queries
- **Caching**: Session storage for AI candidates to reduce API calls
- **Bulk Operations**: Consider batch endpoints for multiple flashcard operations

#### Monitoring and Telemetry

- **AI Generation Metrics**: Track success rates, processing times, error rates
- **User Engagement**: Monitor flashcard creation and review patterns
- **Performance Metrics**: Track API response times and error rates
- **Business Metrics**: Calculate acceptance rates for AI-generated candidates
