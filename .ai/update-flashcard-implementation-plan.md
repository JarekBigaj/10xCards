# API Endpoint Implementation Plan: Update Flashcard

## 1. Przegląd punktu końcowego

Endpoint służy do aktualizacji istniejącej fiszki użytkownika. Pozwala na modyfikację treści przedniej strony, tylnej strony oraz źródła pochodzenia fiszki. Endpoint implementuje mechanizm soft update z zachowaniem metadanych algorytmu powtarzania przestrzennego (ts-fsrs).

**Kluczowe funkcjonalności:**

- Aktualizacja treści fiszki (front_text, back_text)
- Zmiana źródła na "ai-edit" lub "manual"
- Walidacja unikalności front_text w obrębie użytkownika
- Automatyczne obliczanie hash'ów dla wykrywania duplikatów
- Zachowanie integralności danych spaced repetition

## 2. Szczegóły żądania

- **Metoda HTTP**: PUT
- **Struktura URL**: `/api/flashcards/{id}`
- **Content-Type**: `application/json`
- **Autoryzacja**: Bearer token (Supabase JWT)

### Parametry:

**Wymagane:**

- `id` (path parameter): UUID fiszki do aktualizacji
- `source`: "ai-edit" | "manual" (w request body)

**Opcjonalne:**

- `front_text`: string (max 200 znaków)
- `back_text`: string (max 500 znaków)

### Request Body:

```typescript
{
  front_text?: string;    // Max 200 chars, optional
  back_text?: string;     // Max 500 chars, optional
  source: "ai-edit" | "manual";  // Required
}
```

## 3. Wykorzystywane typy

### DTOs:

- `UpdateFlashcardRequest` - walidacja danych wejściowych
- `FlashcardDto` - dane odpowiedzi (bez internal fields)
- `FlashcardResponse` - wrapper odpowiedzi API

### Command Models:

- `UpdateFlashcardCommand` - model dla operacji bazy danych
- `ContentHash` - obliczanie hash'ów treści

### Validation Types:

- `ApiResponse<FlashcardDto>` - standardowa odpowiedź sukcesu
- `ErrorResponse` - standardowa odpowiedź błędu

## 4. Szczegóły odpowiedzi

### Sukces (200 OK):

```typescript
{
  success: true,
  data: {
    id: "uuid",
    front_text: "string",
    back_text: "string",
    source: "ai-edit" | "manual",
    due: "ISO timestamp",
    scheduled_days: number,
    difficulty: number,
    reps: number,
    created_at: "ISO timestamp",
    updated_at: "ISO timestamp"
  }
}
```

### Błędy:

- **400 Bad Request**: Walidacja danych, nieprawidłowy format
- **401 Unauthorized**: Brak lub nieprawidłowy token
- **404 Not Found**: Fiszka nie istnieje lub nie należy do użytkownika
- **409 Conflict**: Duplikat front_text dla użytkownika
- **500 Internal Server Error**: Błędy bazy danych

## 5. Przepływ danych

1. **Walidacja wstępna**:

   - Sprawdzenie formatu UUID w path parameter
   - Walidacja obecności wymaganych pól w request body
   - Sprawdzenie długości tekstu

2. **Autoryzacja**:

   - Weryfikacja JWT token z Supabase Auth
   - Pobranie user_id z context.locals.supabase

3. **Walidacja biznesowa**:

   - Sprawdzenie czy fiszka istnieje i należy do użytkownika
   - Kontrola unikalności front_text (jeśli został zmieniony)

4. **Aktualizacja danych**:

   - Obliczenie nowych hash'ów treści
   - Aktualizacja rekordu w tabeli flashcards
   - Automatyczne ustawienie updated_at via trigger

5. **Odpowiedź**:
   - Pobranie zaktualizowanej fiszki
   - Mapowanie na FlashcardDto
   - Zwrócenie odpowiedzi API

## 6. Względy bezpieczeństwa

### Uwierzytelnianie i autoryzacja:

- **JWT Validation**: Użycie Supabase Auth do weryfikacji tokenu
- **Row Level Security**: RLS na poziomie bazy danych zabezpiecza przed dostępem do cudzych fiszek
- **User Context**: Wszystkie operacje wykonywane w kontekście zalogowanego użytkownika

### Walidacja danych:

- **Input Sanitization**: Walidacja długości i formatu danych wejściowych
- **SQL Injection Prevention**: Użycie parametryzowanych zapytań przez Supabase
- **XSS Protection**: Walidacja treści tekstowych

### Ograniczenia:

- **Rate Limiting**: Implementacja na poziomie middleware (przyszłość)
- **Unique Constraints**: Zapewnienie unikalności front_text per user

## 7. Obsługa błędów

### Walidacja wejściowa (400):

```typescript
{
  success: false,
  error: "Validation failed",
  details: [
    {
      field: "front_text",
      code: "VALIDATION_ERROR",
      message: "Front text cannot exceed 200 characters"
    }
  ]
}
```

### Nie znaleziono fiszki (404):

```typescript
{
  success: false,
  error: "Flashcard not found or access denied"
}
```

### Duplikat treści (409):

```typescript
{
  success: false,
  error: "Flashcard with this front text already exists",
  details: [
    {
      field: "front_text",
      code: "DUPLICATE",
      message: "Another flashcard with identical front text exists"
    }
  ]
}
```

### Błąd bazy danych (500):

```typescript
{
  success: false,
  error: "Internal server error"
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje:

- **Indexing**: Wykorzystanie istniejących indeksów na user_id, front_text_hash
- **Hash Calculation**: Efektywne obliczanie SHA-256 hash'ów przez trigger bazodanowy
- **RLS Performance**: Optymalne zapytania dzięki indeksom wspierającym RLS

### Monitoring:

- **Response Time**: Monitoring czasów odpowiedzi endpoint'u
- **Error Rate**: Śledzenie częstotliwości błędów 400/409
- **Database Load**: Monitoring obciążenia zapytań UPDATE

### Caching:

- **No Caching**: Endpoint modyfikujący - nie nadaje się do cache'owania
- **Hash Validation**: Wykorzystanie hash'ów do szybkiej walidacji duplikatów

## 9. Etapy wdrożenia

### 1. Przygotowanie struktury plików

```bash
src/pages/api/flashcards/[id].ts          # Główny endpoint handler
src/lib/services/flashcard.service.ts     # Logika biznesowa
src/lib/validation/flashcard.validation.ts # Schematy walidacji
```

### 2. Implementacja walidacji Zod

- Stworzenie schematów dla UpdateFlashcardRequest
- Walidacja UUID path parameter
- Walidacja długości tekstu i enum source

### 3. Implementacja FlashcardService

- Metoda `updateFlashcard(id, command, userId)`
- Sprawdzanie istnienia i własności fiszki
- Walidacja unikalności front_text
- Operacje bazodanowe przez Supabase client

### 4. Implementacja endpoint handler

- Obsługa metody PUT w `[id].ts`
- Integracja z FlashcardService
- Mapowanie odpowiedzi i błędów
- Error handling z odpowiednimi kodami HTTP

### 5. Implementacja obsługi błędów

- Centralizowana obsługa ValidationError
- Mapowanie błędów bazy danych na kody HTTP
- Logowanie błędów dla debugging

### 6. Testy jednostkowe

- Testy walidacji danych wejściowych
- Testy scenariuszy błędów (404, 409)
- Testy integracyjne z bazą danych
- Testy autoryzacji i RLS

### 7. Testy integracyjne

- E2E testy całego flow'u aktualizacji
- Testy z różnymi scenariuszami użytkowników
- Walidacja czasów odpowiedzi

### 8. Dokumentacja i monitoring

- Aktualizacja dokumentacji API
- Konfiguracja monitoringu i alertów
- Przygotowanie do deploy'u na produkcję

## 10. Szczegóły techniczne implementacji

### Struktura handler'a:

```typescript
// src/pages/api/flashcards/[id].ts
export const PUT = async ({ request, params, locals }) => {
  // 1. Walidacja path parameter
  // 2. Parsowanie i walidacja request body
  // 3. Autoryzacja użytkownika
  // 4. Wywołanie FlashcardService
  // 5. Mapowanie odpowiedzi
};
```

### Service layer:

```typescript
// src/lib/services/flashcard.service.ts
export class FlashcardService {
  async updateFlashcard(id: string, command: UpdateFlashcardCommand, userId: string) {
    // 1. Sprawdzenie istnienia fiszki
    // 2. Walidacja unikalności (jeśli zmieniony front_text)
    // 3. Aktualizacja w bazie danych
    // 4. Zwrócenie zaktualizowanej fiszki
  }
}
```

### Integracja z Supabase:

- Użycie `locals.supabase` z context
- Wykorzystanie RLS dla autoryzacji
- Triggery bazodanowe dla hash'ów i updated_at
