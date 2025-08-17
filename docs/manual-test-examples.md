# Manual Test Examples for GET /api/flashcards

## Prerequisites

1. Run the dummy data migration:

   ```sql
   -- Execute the migration: supabase/migrations/20241231120000_insert_dummy_flashcards.sql
   ```

2. Make sure you have a valid session for user with ID: `7ce3aad3-1038-41bc-b901-5a225e52b2db`

## Test Cases

### 1. Basic Request - Get All Flashcards (Default)

```bash
curl -X GET "http://localhost:3000/api/flashcards" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**

- Status: 200 OK
- Should return 10 flashcards (default limit: 20, but we have 10 dummy records)
- Default sorting: `created_at` DESC
- Pagination metadata with `current_page: 1`, `total_count: 10`, etc.

### 2. Pagination Tests

#### Page 1 with limit 5

```bash
curl -X GET "http://localhost:3000/api/flashcards?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Page 2 with limit 5

```bash
curl -X GET "http://localhost:3000/api/flashcards?page=2&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:**

- First request: 5 flashcards, `current_page: 1`, `total_pages: 2`
- Second request: 5 flashcards, `current_page: 2`, `total_pages: 2`

### 3. Filtering Tests

#### Filter by source: ai-full

```bash
curl -X GET "http://localhost:3000/api/flashcards?source=ai-full" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** 3 flashcards (React, TypeScript, Node.js, JavaScript)

#### Filter by source: ai-edit

```bash
curl -X GET "http://localhost:3000/api/flashcards?source=ai-edit" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** 3 flashcards (Astro, Supabase, HTML)

#### Filter by source: manual

```bash
curl -X GET "http://localhost:3000/api/flashcards?source=manual" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** 4 flashcards (France, Math, CSS, etc.)

#### Filter by due_before (cards due before tomorrow)

```bash
curl -X GET "http://localhost:3000/api/flashcards?due_before=$(date -d 'tomorrow' -Iseconds)" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** Cards that are due before tomorrow (should include overdue cards)

### 4. Sorting Tests

#### Sort by due date (ascending)

```bash
curl -X GET "http://localhost:3000/api/flashcards?sort=due&order=asc" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** Cards sorted by due date, earliest first

#### Sort by difficulty (descending)

```bash
curl -X GET "http://localhost:3000/api/flashcards?sort=difficulty&order=desc" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** Cards sorted by difficulty, hardest first

#### Sort by created_at (ascending)

```bash
curl -X GET "http://localhost:3000/api/flashcards?sort=created_at&order=asc" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** Cards sorted by creation date, oldest first

### 5. Combined Filters

#### AI-generated cards due before now, sorted by difficulty

```bash
curl -X GET "http://localhost:3000/api/flashcards?source=ai-full&due_before=$(date -Iseconds)&sort=difficulty&order=desc" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Manual cards, page 1, limit 2

```bash
curl -X GET "http://localhost:3000/api/flashcards?source=manual&page=1&limit=2" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. Error Cases

#### Invalid page number

```bash
curl -X GET "http://localhost:3000/api/flashcards?page=0" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** 400 Bad Request with validation error

#### Invalid limit (too high)

```bash
curl -X GET "http://localhost:3000/api/flashcards?limit=101" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** 400 Bad Request with validation error

#### Invalid source

```bash
curl -X GET "http://localhost:3000/api/flashcards?source=invalid" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** 400 Bad Request with validation error

#### Invalid due_before format

```bash
curl -X GET "http://localhost:3000/api/flashcards?due_before=invalid-date" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** 400 Bad Request with validation error

#### Invalid sort field

```bash
curl -X GET "http://localhost:3000/api/flashcards?sort=invalid" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** 400 Bad Request with validation error

#### No authentication

```bash
curl -X GET "http://localhost:3000/api/flashcards"
```

**Expected:** 401 Unauthorized

### 7. Edge Cases

#### Empty result set (future due date)

```bash
curl -X GET "http://localhost:3000/api/flashcards?due_before=2020-01-01T00:00:00Z" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** 200 OK with empty flashcards array

#### Page beyond available data

```bash
curl -X GET "http://localhost:3000/api/flashcards?page=999" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** 200 OK with empty flashcards array

## Expected Response Format

All successful responses should follow this structure:

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

Error responses should follow this structure:

```json
{
  "success": false,
  "error": "string",
  "details": [
    {
      "field": "string",
      "code": "VALIDATION_ERROR",
      "message": "string"
    }
  ]
}
```

## Notes

- All dummy flashcards belong to user ID: `7ce3aad3-1038-41bc-b901-5a225e52b2db`
- Hash fields (`front_text_hash`, `back_text_hash`) should NOT be included in responses
- User ID and `is_deleted` fields should NOT be included in responses
- The endpoint properly filters flashcards by user_id to ensure users only see their own data
