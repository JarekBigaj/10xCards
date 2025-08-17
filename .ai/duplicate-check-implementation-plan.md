# API Endpoint Implementation Plan: Check Flashcard Duplicates

## 1. Przegląd punktu końcowego

Endpoint służy do sprawdzania czy fiszka o podobnej treści już istnieje w bazie danych użytkownika. Wykorzystuje mechanizm hash-ów (SHA-256) do szybkiego porównywania treści oraz algorytm podobieństwa do wykrywania potencjalnych duplikatów. Jest kluczowy dla zapobiegania tworzeniu identycznych fiszek przez użytkowników.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/flashcards/check-duplicate`
- **Parametry**:
  - **Wymagane**:
    - `front_text` (string, max 200 znaków) - tekst przedniej strony fiszki
  - **Opcjonalne**:
    - `back_text` (string, max 500 znaków) - tekst tylnej strony dla sprawdzenia podobieństwa
    - `user_id` (string, UUID) - ID użytkownika, domyślnie current user z auth
- **Request Body**:

```json
{
  "front_text": "string (required, max 200 chars)",
  "back_text": "string (optional, max 500 chars)",
  "user_id": "string (optional, UUID)"
}
```

## 3. Wykorzystywane typy

- **Request DTO**: `CheckDuplicateRequest` (już zdefiniowany w types.ts)
- **Response DTO**: `DuplicateCheckResponse` (już zdefiniowany w types.ts)
- **Response Data**: `DuplicateCheckResponseData` (już zdefiniowany w types.ts)
- **Database Types**: `Tables<"flashcards">` z database.types.ts

## 4. Szczegóły odpowiedzi

- **Success Response (200)**:

```json
{
  "success": true,
  "data": {
    "is_duplicate": boolean,
    "existing_flashcard_id": "string (UUID, optional)",
    "similarity_score": number, // 0-1
    "duplicate_type": "exact" | "similar" | "none"
  }
}
```

- **Error Response (400/401/500)**:

```json
{
  "success": false,
  "error": "string",
  "details": [
    {
      "field": "string (optional)",
      "code": "VALIDATION_ERROR",
      "message": "string"
    }
  ]
}
```

## 5. Przepływ danych

1. **Walidacja żądania** - Zod schema sprawdza format i długość danych
2. **Uwierzytelnienie** - Pobranie user_id z context.locals.supabase.auth
3. **Generowanie hash-ów** - SHA-256 dla front_text i back_text (jeśli podany)
4. **Zapytanie do bazy** - Wyszukanie fiszek z identycznymi hash-ami
5. **Sprawdzenie podobieństwa** - Jeśli brak dokładnego dopasowania, sprawdzenie podobieństwa
6. **Zwrócenie wyniku** - Informacja o duplikacie z metadanymi

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie**: Wymagane przez middleware Astro z Supabase Auth
- **Autoryzacja**: RLS w PostgreSQL zapewnia dostęp tylko do własnych fiszek
- **Walidacja user_id**: Jeśli podany, musi być zgodny z auth.uid()
- **Sanityzacja danych**: Zod schema chroni przed injection attacks
- **Rate limiting**: Implementacja na poziomie middleware (przyszłość)

## 7. Obsługa błędów

| Kod | Scenariusz                        | Odpowiedź             |
| --- | --------------------------------- | --------------------- |
| 200 | Sukces                            | Dane o duplikacie     |
| 400 | Nieprawidłowe dane wejściowe      | Szczegóły walidacji   |
| 400 | front_text za długi (>200 znaków) | VALIDATION_ERROR      |
| 400 | back_text za długi (>500 znaków)  | VALIDATION_ERROR      |
| 400 | user_id niezgodny z auth.uid()    | VALIDATION_ERROR      |
| 401 | Brak autoryzacji                  | Unauthorized          |
| 500 | Błąd bazy danych                  | Database error        |
| 500 | Błąd generowania hash-a           | Internal server error |

## 8. Rozważania dotyczące wydajności

- **Indeksy**: Wykorzystanie `idx_flashcards_user_front_hash` dla szybkiego wyszukiwania
- **Hash-based comparison**: SHA-256 hash-e zamiast porównywania pełnego tekstu
- **Limit wyników**: Ograniczenie do pierwszego znalezionego duplikatu
- **Connection pooling**: Supabase zarządza połączeniami automatycznie
- **Caching**: Możliwość cache'owania wyników dla identycznych zapytań (przyszłość)

## 9. Etapy wdrożenia

1. **Utworzenie Zod schema** w `src/lib/validation/flashcard.schemas.ts`

   - Schema dla `CheckDuplicateRequest`
   - Walidacja długości tekstu i formatu UUID

2. **Implementacja service** w `src/lib/services/duplicate-check.service.ts`

   - Funkcja `generateContentHash()` dla SHA-256
   - Funkcja `checkExactDuplicate()` dla dokładnych duplikatów
   - Funkcja `calculateSimilarity()` dla podobieństwa treści
   - Główna funkcja `checkDuplicate()`

3. **Utworzenie API endpoint** w `src/pages/api/flashcards/check-duplicate.ts`

   - Handler POST z walidacją Zod
   - Integracja z duplicate-check.service
   - Obsługa błędów i zwracanie odpowiedzi

4. **Testy jednostkowe** dla service i endpoint

   - Test dokładnych duplikatów
   - Test podobieństwa treści
   - Test walidacji danych
   - Test autoryzacji

5. **Integracja z frontend** (opcjonalnie)

   - Hook do sprawdzania duplikatów w czasie rzeczywistym
   - Komponenty UI dla ostrzeżeń o duplikatach

6. **Dokumentacja API** w OpenAPI/Swagger format
   - Przykłady żądań i odpowiedzi
   - Kody błędów i ich znaczenie

## 10. Szczegóły implementacji

### Database Query Strategy

```sql
-- Exact duplicate check
SELECT id, front_text, back_text, created_at
FROM flashcards
WHERE user_id = $1
  AND front_text_hash = $2
  AND is_deleted = false
LIMIT 1;

-- Similarity check (if no exact match)
SELECT id, front_text, back_text, back_text_hash
FROM flashcards
WHERE user_id = $1
  AND is_deleted = false
ORDER BY created_at DESC;
```

### Hash Generation

- Wykorzystanie Node.js `crypto.createHash('sha256')`
- Normalizacja tekstu przed hash-owaniem (trim, lowercase)
- Consistent encoding (UTF-8)

### Similarity Algorithm

- Levenshtein distance dla tekstów krótkich
- Jaccard similarity dla dłuższych tekstów
- Threshold 0.8+ dla "similar", 0.95+ dla "exact"
