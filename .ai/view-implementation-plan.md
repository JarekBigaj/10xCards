# API Endpoint Implementation Plan: Get User's Flashcards

## 1. Przegląd punktu końcowego

Endpoint służy do pobierania fiszek użytkownika z możliwością paginacji, filtrowania i sortowania. Umożliwia użytkownikom przeglądanie swoich fiszek z różnymi opcjami wyświetlania, co jest kluczowe dla zarządzania kolekcją fiszek w aplikacji 10xCards.

## 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/flashcards`
- **Parametry**:
  - **Opcjonalne**:
    - `page`: number (domyślnie: 1, minimum: 1)
    - `limit`: number (domyślnie: 20, maksimum: 100, minimum: 1)
    - `source`: string (ai-full|ai-edit|manual)
    - `due_before`: string (ISO timestamp)
    - `sort`: string (created_at|due|difficulty)
    - `order`: string (asc|desc, domyślnie: desc)
- **Request Body**: Brak (GET request)
- **Headers**: Authorization wymagany (session cookie lub Bearer token)

## 3. Wykorzystywane typy

```typescript
// DTO Types (z src/types.ts)
- FlashcardDto: Dane fiszki bez wrażliwych pól
- FlashcardsListResponseData: Dane odpowiedzi z paginacją
- FlashcardsListResponse: Kompletna odpowiedź API
- PaginationDto: Metadane paginacji
- FlashcardListQuery: Parametry zapytania
- FlashcardSource: Typ źródła fiszki

// Command Models
- Brak (tylko odczyt danych)
```

## 4. Szczegóły odpowiedzi

**Sukces (200 OK)**:

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

**Błąd (400/401/500)**:

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

## 5. Przepływ danych

1. **Walidacja żądania**:

   - Sprawdzenie sesji użytkownika (context.locals.supabase)
   - Walidacja parametrów zapytania za pomocą Zod schema

2. **Przetwarzanie zapytania**:

   - Wywołanie FlashcardService.getFlashcards()
   - Zastosowanie filtrów (source, due_before)
   - Zastosowanie sortowania (sort, order)
   - Zastosowanie paginacji (page, limit)

3. **Zapytanie do bazy danych**:

   - Wykorzystanie Supabase client z RLS
   - Zapytanie do tabeli `flashcards` z warunkami WHERE
   - Zliczenie całkowitej liczby rekordów dla paginacji

4. **Formatowanie odpowiedzi**:
   - Mapowanie danych z bazy na FlashcardDto
   - Tworzenie metadanych paginacji
   - Zwrócenie FlashcardsListResponse

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagana ważna sesja użytkownika
- **Autoryzacja**: Row Level Security (RLS) zapewnia dostęp tylko do własnych fiszek
- **Walidacja danych wejściowych**: Wszystkie parametry zapytania walidowane przez Zod
- **Sanityzacja**: Parametry tekstowe sanityzowane przed użyciem w zapytaniach
- **Rate limiting**: Rozważyć implementację w przyszłości dla ochrony przed nadużyciami
- **CORS**: Konfiguracja dla dozwolonych domen

## 7. Obsługa błędów

| Kod | Scenariusz                        | Odpowiedź                       |
| --- | --------------------------------- | ------------------------------- |
| 200 | Sukces                            | Lista fiszek z paginacją        |
| 400 | Nieprawidłowe parametry zapytania | Szczegóły błędów walidacji      |
| 401 | Brak autoryzacji                  | Komunikat o wymaganym logowaniu |
| 500 | Błąd bazy danych/serwera          | Ogólny komunikat błędu          |

**Szczegółowe scenariusze błędów**:

- Nieprawidłowy format `due_before` (nie ISO timestamp)
- `limit` przekracza maksimum (100)
- Nieprawidłowa wartość `source` (nie z dozwolonych)
- Nieprawidłowa wartość `sort` lub `order`
- Błąd połączenia z bazą danych
- Błąd sesji użytkownika

## 8. Rozważania dotyczące wydajności

- **Indeksy bazy danych**:
  - `idx_flashcards_user_due` dla filtrowania po due
  - `idx_flashcards_user_created_at` dla sortowania
- **Paginacja**: Limit maksymalny 100 rekordów na stronę
- **Lazy loading**: Rozważyć dla dużych kolekcji
- **Caching**: Możliwość cache'owania dla często używanych filtrów
- **Query optimization**: Unikanie N+1 queries

## 9. Etapy wdrożenia

1. **Utworzenie Zod schema dla walidacji**:

   - Schemat dla FlashcardListQuery
   - Walidacja wszystkich parametrów zapytania

2. **Implementacja FlashcardService**:

   - Metoda `getFlashcards(userId, query)`
   - Logika filtrowania i sortowania
   - Implementacja paginacji

3. **Utworzenie API route**:

   - Plik `src/pages/api/flashcards.ts`
   - Handler GET z walidacją
   - Integracja z FlashcardService

4. **Implementacja obsługi błędów**:

   - Try-catch dla błędów bazy danych
   - Formatowanie błędów walidacji
   - Logowanie błędów

5. **Testy jednostkowe**:

   - Testy FlashcardService
   - Testy walidacji parametrów
   - Testy scenariuszy błędów

6. **Testy integracyjne**:

   - Testy end-to-end API endpoint
   - Testy z różnymi kombinacjami parametrów
   - Testy bezpieczeństwa (RLS)

7. **Dokumentacja**:

   - Aktualizacja API documentation
   - Przykłady użycia
   - Opis parametrów i odpowiedzi

8. **Optymalizacja wydajności**:
   - Analiza zapytań SQL
   - Optymalizacja indeksów
   - Monitoring wydajności
