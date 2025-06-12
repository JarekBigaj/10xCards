# API Endpoint Implementation Plan: Create Flashcard(s)

## 1. Przegląd punktu końcowego

Endpoint służy do tworzenia jednej lub wielu fiszek jednocześnie. Obsługuje zarówno fiszki tworzone ręcznie przez użytkownika, jak i te pochodzące z akceptowanych kandydatów wygenerowanych przez AI. Implementuje mechanizm wykrywania duplikatów oparty na hash-ach oraz obsługuje operacje wsadowe z częściowym sukcesem.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/flashcards`
- **Content-Type**: `application/json`
- **Uwierzytelnianie**: Wymagane (Supabase Auth session)

### Parametry Request Body:

**Pojedyncza fiszka**:

```typescript
{
  front_text: string;     // Wymagane, max 200 znaków
  back_text: string;      // Wymagane, max 500 znaków
  source: FlashcardSource; // Wymagane: "ai-full" | "ai-edit" | "manual"
  candidate_id?: string;   // Opcjonalne, UUID dla śledzenia kandydatów AI
}
```

**Wiele fiszek**:

```typescript
{
  flashcards: CreateFlashcardRequest[]; // Wymagane, min 1, max 50 elementów
}
```

## 3. Wykorzystywane typy

### DTO Types:

- `CreateFlashcardRequest` - struktura pojedynczego żądania
- `CreateFlashcardsRequest` - struktura żądania wsadowego
- `FlashcardDto` - odpowiedź z danymi fiszki
- `CreateFlashcardsResponseData` - odpowiedź wsadowa z metadanymi
- `FlashcardCreationError` - szczegóły błędów w operacjach wsadowych

### Command Models:

- `CreateFlashcardCommand` - model komend dla warstwy serwisu
- `ContentHash` - dla mechanizmu wykrywania duplikatów

### Response Types:

- `CreateFlashcardResponse` - odpowiedź dla pojedynczej fiszki
- `CreateFlashcardsResponse` - odpowiedź dla operacji wsadowych

## 4. Szczegóły odpowiedzi

### Pojedyncza fiszka (201 Created):

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

### Wiele fiszek (201 Created / 207 Multi-Status):

```json
{
  "success": true,
  "data": {
    "created_count": "number",
    "failed_count": "number",
    "flashcards": [
      /* FlashcardDto[] */
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

## 5. Przepływ danych

1. **Walidacja żądania**:

   - Sprawdzenie sesji użytkownika (Supabase Auth)
   - Walidacja struktury JSON (Zod schema)
   - Walidacja długości tekstów i dozwolonych wartości

2. **Przetwarzanie danych**:

   - Generowanie hash-ów dla `front_text` i `back_text`
   - Sprawdzenie duplikatów w bazie danych
   - Przygotowanie komend dla warstwy serwisu

3. **Operacje bazodanowe**:

   - Wstawienie nowych fiszek do tabeli `flashcards`
   - Wykorzystanie RLS dla bezpieczeństwa na poziomie wiersza
   - Obsługa błędów duplikatów i ograniczeń

4. **Formatowanie odpowiedzi**:
   - Mapowanie danych z bazy na DTO
   - Agregacja wyników dla operacji wsadowych
   - Zwrócenie odpowiedniego kodu statusu

## 6. Względy bezpieczeństwa

### Uwierzytelnianie i autoryzacja:

- **Supabase Auth**: Weryfikacja ważnej sesji użytkownika
- **RLS Policies**: Automatyczne filtrowanie na poziomie bazy danych
- **User Context**: Użycie `context.locals.supabase` zamiast bezpośredniego importu

### Walidacja danych:

- **Zod Schemas**: Ścisła walidacja wszystkich pól wejściowych
- **Sanityzacja**: Oczyszczanie tekstów z potencjalnie szkodliwych znaków
- **Limity długości**: Wymuszenie maksymalnych długości tekstów

### Ochrona przed atakami:

- **Rate Limiting**: Ograniczenie liczby żądań na użytkownika
- **Input Validation**: Zapobieganie SQL injection i XSS
- **Hash-based Deduplication**: Bezpieczne wykrywanie duplikatów

## 7. Obsługa błędów

### Kody statusu i scenariusze:

- **400 Bad Request**:

  - Nieprawidłowa struktura JSON
  - Błędy walidacji (za długie teksty, nieprawidłowe wartości)
  - Brak wymaganych pól

- **401 Unauthorized**:

  - Brak sesji użytkownika
  - Nieprawidłowy lub wygasły token

- **409 Conflict**:

  - Duplikat `front_text` dla użytkownika (tylko pojedyncza fiszka)

- **413 Payload Too Large**:

  - Przekroczenie limitu 50 fiszek w żądaniu wsadowym

- **207 Multi-Status**:

  - Częściowy sukces w operacjach wsadowych
  - Niektóre fiszki utworzone, inne odrzucone

- **500 Internal Server Error**:
  - Błędy bazy danych
  - Problemy z generowaniem hash-ów
  - Nieoczekiwane błędy serwera

### Struktura błędów:

```typescript
{
  "success": false,
  "error": "string",
  "details": [
    {
      "field": "string",
      "code": "ApiErrorCode",
      "message": "string"
    }
  ]
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje:

- **Batch Inserts**: Wykorzystanie transakcji dla operacji wsadowych
- **Hash Indexing**: Szybkie wykrywanie duplikatów przez indeksy na hash-ach
- **Connection Pooling**: Efektywne zarządzanie połączeniami z bazą

### Potencjalne wąskie gardła:

- **Duże operacje wsadowe**: Limit 50 fiszek na żądanie
- **Hash Generation**: CPU-intensive dla dużych tekstów
- **Database Constraints**: Sprawdzanie unikalności może być kosztowne

### Strategie skalowania:

- **Asynchroniczne przetwarzanie**: Dla bardzo dużych operacji wsadowych
- **Caching**: Cache'owanie często używanych hash-ów
- **Database Partitioning**: Partycjonowanie tabeli według user_id

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury plików

- Utworzenie `/src/pages/api/flashcards.ts`
- Dodanie Zod schemas do walidacji
- Przygotowanie typów i interfejsów

### Krok 2: Implementacja warstwy serwisu

- Utworzenie `/src/lib/services/flashcard.service.ts`
- Implementacja funkcji `createFlashcard()` i `createFlashcards()`
- Dodanie funkcji hash-owania i wykrywania duplikatów

### Krok 3: Implementacja endpointu API

- Handler dla metody POST
- Walidacja żądań z użyciem Zod
- Integracja z warstwą serwisu

### Krok 4: Obsługa błędów i logowanie

- Implementacja comprehensive error handling
- Dodanie logowania błędów i metryk

## 10. Szczegóły implementacji

### Struktura pliku API:

```typescript
// /src/pages/api/flashcards.ts
export const prerender = false;

export async function POST(context: APIContext) {
  // 1. Walidacja sesji użytkownika
  // 2. Parsowanie i walidacja żądania
  // 3. Wywołanie warstwy serwisu
  // 4. Formatowanie i zwrócenie odpowiedzi
}
```

### Kluczowe funkcje serwisu:

- `validateFlashcardData()` - walidacja pojedynczej fiszki
- `checkDuplicates()` - wykrywanie duplikatów przez hash-e
- `createSingleFlashcard()` - tworzenie pojedynczej fiszki
- `createMultipleFlashcards()` - operacje wsadowe z obsługą błędów
- `generateContentHashes()` - generowanie SHA-256 hash-ów

### Integracja z bazą danych:

- Wykorzystanie Supabase Client z context.locals
- Transakcje dla operacji wsadowych
- Proper error handling dla constraint violations
- Wykorzystanie RLS policies dla bezpieczeństwa
