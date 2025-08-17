# Plan API dla funkcjonalności "Moje fiszki"

## 1. Przegląd funkcjonalności

Widok "Moje fiszki" to centralne miejsce zarządzania wszystkimi fiszkami użytkownika. Główne funkcjonalności obejmują:

- **Przeglądanie** wszystkich fiszek użytkownika z paginacją
- **Filtrowanie** po źródle (ai-full, ai-edit, manual), dacie utworzenia, dacie powtórki
- **Sortowanie** po różnych kryteriach (data utworzenia, data powtórki, trudność)
- **Wyszukiwanie** (przyszłość - na razie nie implementujemy)
- **Edycja** istniejących fiszek inline i w modalu
- **Usuwanie** fiszek (soft delete)
- **Tworzenie** nowych fiszek ręcznie
- **Operacje grupowe** (zaznaczenie wielu fiszek i działania na nich)

## 2. Aktualny stan API

### 2.1 Istniejące endpointy

Analiza pokazuje, że większość potrzebnych endpointów już istnieje:

#### ✅ Już zaimplementowane:

1. **GET /api/flashcards** - Lista fiszek z paginacją i filtrami
   - Obsługuje: page, limit, source, due_before, sort, order
   - Zwraca: flashcards[] + pagination metadata

2. **POST /api/flashcards** - Tworzenie fiszek (single + batch)
   - Obsługuje walidację, duplicate detection
   - Zwraca: utworzone fiszki lub błędy walidacji

3. **GET /api/flashcards/{id}** - Pojedyncza fiszka
   - Zwraca: szczegóły fiszki lub 404

4. **PUT /api/flashcards/{id}** - Aktualizacja fiszki
   - Obsługuje walidację, source musi być ai-edit lub manual
   - Zwraca: zaktualizowaną fiszkę

5. **DELETE /api/flashcards/{id}** - Soft delete fiszki
   - Ustawia is_deleted=true
   - Zwraca: success message

6. **POST /api/flashcards/check-duplicate** - Sprawdzanie duplikatów
   - Sprawdza czy istnieje fiszka o podobnej treści

### 2.2 Braki w istniejącym API

#### ❌ Funkcjonalności do dodania:

1. **Operacje grupowe (Bulk Operations)**
2. **Rozszerzone filtrowanie**
3. **Statystyki dla widoku**
4. **Export danych** (przyszłość)

## 3. Nowe endpointy do implementacji

### 3.1 Bulk Operations Endpoint

#### DELETE /api/flashcards/bulk

**Opis**: Usuwa wiele fiszek na raz (soft delete)

**Request Body**:

```json
{
  "flashcard_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response Body** (Success):

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

**Response Body** (Partial failure):

```json
{
  "success": true,
  "data": {
    "deleted_count": 2,
    "failed_count": 1,
    "errors": [
      {
        "flashcard_id": "uuid3",
        "error": "Flashcard not found",
        "code": "NOT_FOUND"
      }
    ]
  }
}
```

**Walidacja**:

- Max 100 IDs per request
- Wszystkie IDs muszą być valid UUIDs
- Sprawdzenie ownership (user_id)

**HTTP Codes**:

- 200 OK (success lub partial success)
- 400 Bad Request (validation error)
- 401 Unauthorized

#### PUT /api/flashcards/bulk

**Opis**: Aktualizuje wiele fiszek na raz

**Request Body**:

```json
{
  "updates": [
    {
      "id": "uuid1",
      "front_text": "Updated front",
      "source": "manual"
    },
    {
      "id": "uuid2",
      "back_text": "Updated back",
      "source": "ai-edit"
    }
  ]
}
```

**Response Body**:

```json
{
  "success": true,
  "data": {
    "updated_count": 2,
    "failed_count": 0,
    "flashcards": [
      {
        "id": "uuid1",
        "front_text": "Updated front"
        // ... pełne dane fiszki
      }
    ],
    "errors": []
  }
}
```

**Walidacja**:

- Max 50 updates per request
- Standard flashcard validation rules
- Source validation (ai-edit, manual only)

### 3.2 Enhanced Filtering Support

#### GET /api/flashcards?search=text

**Opis**: Rozszerzenie istniejącego endpointu o wyszukiwanie

**Nowe query parametry**:

- `search`: string (opcjonalny) - wyszukiwanie w front_text i back_text
- `created_after`: ISO date - fiszki utworzone po danej dacie
- `created_before`: ISO date - fiszki utworzone przed datą
- `difficulty_min`: number - minimalna trudność
- `difficulty_max`: number - maksymalna trudność
- `reps_min`: number - minimalna liczba powtórek
- `reps_max`: number - maksymalna liczba powtórek

**Implementacja wyszukiwania**:

```sql
-- PostgreSQL full-text search z polskim wsparciem
WHERE (
  search_param IS NULL OR
  to_tsvector('polish', front_text || ' ' || back_text) @@ plainto_tsquery('polish', search_param)
)
```

### 3.3 Flashcard Statistics Endpoint

#### GET /api/flashcards/stats

**Opis**: Statystyki fiszek użytkownika dla dashboardu widoku

**Response Body**:

```json
{
  "success": true,
  "data": {
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
    "longest_streak": 7
  }
}
```

## 4. Rozszerzenia istniejących endpointów

### 4.1 GET /api/flashcards - dodatkowe funkcje

**Nowe query parametry**:

```typescript
interface ExtendedFlashcardListQuery extends FlashcardListQuery {
  search?: string; // Full-text search
  created_after?: string; // ISO date
  created_before?: string; // ISO date
  difficulty_min?: number; // 0.0 - 5.0
  difficulty_max?: number; // 0.0 - 5.0
  reps_min?: number; // >= 0
  reps_max?: number; // >= 0
  never_reviewed?: boolean; // fiszki nigdy nie przeglądane
  due_only?: boolean; // tylko fiszki do powtórki
}
```

**Rozszerzona implementacja w FlashcardService**:

```typescript
async getFlashcards(userId: string, query: ExtendedFlashcardListQuery): Promise<FlashcardsListResponseData> {
  // Existing logic +

  // Search functionality
  if (query.search) {
    supabaseQuery = supabaseQuery.textSearch('fts', query.search, {
      type: 'websearch',
      config: 'polish'
    });
  }

  // Date range filtering
  if (query.created_after) {
    supabaseQuery = supabaseQuery.gte('created_at', query.created_after);
  }

  // Difficulty range
  if (query.difficulty_min !== undefined) {
    supabaseQuery = supabaseQuery.gte('difficulty', query.difficulty_min);
  }

  // Due only filter
  if (query.due_only) {
    supabaseQuery = supabaseQuery.lte('due', new Date().toISOString());
  }

  // Never reviewed filter
  if (query.never_reviewed) {
    supabaseQuery = supabaseQuery.eq('reps', 0);
  }
}
```

## 5. Schemat walidacji

### 5.1 Bulk Operations Schemas

```typescript
// .ai/validation/flashcard-schemas.ts rozszerzenia

export const BulkDeleteRequestSchema = z.object({
  flashcard_ids: z
    .array(z.string().uuid())
    .min(1, "At least one flashcard ID is required")
    .max(100, "Cannot delete more than 100 flashcards at once"),
});

export const BulkUpdateItemSchema = z
  .object({
    id: z.string().uuid(),
    front_text: z.string().min(1).max(200).trim().optional(),
    back_text: z.string().min(1).max(500).trim().optional(),
    source: z.enum(["ai-edit", "manual"]),
  })
  .refine((data) => data.front_text || data.back_text, {
    message: "At least one field must be provided for update",
  });

export const BulkUpdateRequestSchema = z.object({
  updates: z
    .array(BulkUpdateItemSchema)
    .min(1, "At least one update is required")
    .max(50, "Cannot update more than 50 flashcards at once"),
});

export const ExtendedFlashcardListQuerySchema = FlashcardListQuerySchema.extend({
  search: z.string().min(1).max(200).optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  difficulty_min: z.number().min(0).max(5).optional(),
  difficulty_max: z.number().min(0).max(5).optional(),
  reps_min: z.number().int().min(0).optional(),
  reps_max: z.number().int().min(0).optional(),
  never_reviewed: z.boolean().optional(),
  due_only: z.boolean().optional(),
});
```

## 6. Error Handling Strategy

### 6.1 Bulk Operations Error Handling

**Zasady**:

- Operacje bulk są transakcyjne per-item, ale nie globalnie
- Partial success jest akceptowalny (207 Multi-Status nie jest potrzebny)
- Każdy błąd jest raportowany z szczegółami
- Użytkownik otrzymuje feedback o sukcesach i błędach

**Error Types**:

```typescript
interface BulkOperationError {
  flashcard_id: string;
  error: string;
  code: "NOT_FOUND" | "VALIDATION_ERROR" | "PERMISSION_DENIED" | "DUPLICATE";
}
```

### 6.2 Search Error Handling

**Potencjalne błędy**:

- Zbyt krótkie zapytanie search (< 1 znak)
- Zbyt długie zapytanie search (> 200 znaków)
- Invalid date formats
- Invalid number ranges

## 7. Performance Considerations

### 7.1 Database Indexes

**Nowe indeksy do dodania**:

```sql
-- Full-text search index
CREATE INDEX idx_flashcards_fts
ON flashcards USING gin(to_tsvector('polish', front_text || ' ' || back_text))
WHERE is_deleted = false;

-- Composite indexes for filtering
CREATE INDEX idx_flashcards_user_created
ON flashcards(user_id, created_at DESC)
WHERE is_deleted = false;

CREATE INDEX idx_flashcards_user_difficulty
ON flashcards(user_id, difficulty)
WHERE is_deleted = false;

CREATE INDEX idx_flashcards_user_reps
ON flashcards(user_id, reps)
WHERE is_deleted = false;
```

### 7.2 Query Optimization

**Strategies**:

- Limit search results (max 1000)
- Use cursor-based pagination for large datasets
- Cache popular queries (statistics)
- Lazy load detailed data

### 7.3 Bulk Operations Optimization

**Strategies**:

- Batch database operations
- Use single query with arrays gdzie możliwe
- Limit concurrent operations
- Progress feedback dla długich operacji

## 8. Security Considerations

### 8.1 Authorization

**Rules**:

- Wszystkie operacje require authentication
- User może tylko operować na własnych fiszkach
- Bulk operations maja additional validation
- Rate limiting dla search queries

### 8.2 Input Validation

**Strategies**:

- Strict schema validation
- SQL injection prevention (parametrized queries)
- XSS prevention (input sanitization)
- CSRF protection (już istnieje)

## 9. Implementation Priority

### 9.1 Faza 1 (MVP - niezbędne)

1. ✅ Podstawowe CRUD operacje (już istnieją)
2. ✅ Paginacja i filtrowanie (już istnieje)
3. **Nowe**: Bulk delete endpoint
4. **Nowe**: Basic search functionality
5. **Nowe**: Statistics endpoint

### 9.2 Faza 2 (Rozszerzenia)

1. Bulk update endpoint
2. Advanced filtering (difficulty, reps ranges)
3. Full-text search optimization
4. Export functionality

### 9.3 Faza 3 (Future)

1. Real-time updates (WebSockets)
2. Advanced analytics
3. Collaborative features
4. Mobile API optimizations

## 10. API Response Examples

### 10.1 Successful Bulk Delete

```json
{
  "success": true,
  "data": {
    "deleted_count": 5,
    "failed_count": 0,
    "errors": []
  }
}
```

### 10.2 Partial Bulk Delete Failure

```json
{
  "success": true,
  "data": {
    "deleted_count": 3,
    "failed_count": 2,
    "errors": [
      {
        "flashcard_id": "123e4567-e89b-12d3-a456-426614174001",
        "error": "Flashcard not found",
        "code": "NOT_FOUND"
      },
      {
        "flashcard_id": "123e4567-e89b-12d3-a456-426614174002",
        "error": "Permission denied",
        "code": "PERMISSION_DENIED"
      }
    ]
  }
}
```

### 10.3 Enhanced Flashcard List with Search

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
