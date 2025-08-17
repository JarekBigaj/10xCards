# API Endpoint Implementation Plan: Generate Flashcard Candidates

## 1. Przegląd punktu końcowego

Endpoint `/api/ai/generate-candidates` umożliwia generowanie kandydatów na fiszki na podstawie podanego tekstu przy użyciu sztucznej inteligencji. Służy jako pierwszy krok w procesie tworzenia fiszek - użytkownik podaje tekst źródłowy, a system zwraca propozycje fiszek, które mogą zostać następnie zaakceptowane lub zmodyfikowane przed zapisaniem do bazy danych.

**Kluczowe funkcjonalności:**

- Przetwarzanie tekstu źródłowego (1000-10000 znaków)
- Generowanie wielu kandydatów na fiszki z jednego źródła
- Ocena pewności dla każdego kandydata
- Obsługa mechanizmu retry z exponential backoff
- Śledzenie metadanych generacji dla celów analitycznych

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/ai/generate-candidates`
- **Content-Type**: `application/json`

### Parametry:

- **Wymagane**:
  - `text`: string (1000-10000 znaków) - tekst źródłowy do przetworzenia
- **Opcjonalne**:
  - `retry_count`: number - licznik ponownych prób (używany wewnętrznie przez logikę retry)

### Request Body:

```json
{
  "text": "string (1000-10000 characters)",
  "retry_count": "number (optional, default: 0)"
}
```

## 3. Wykorzystywane typy

### Istniejące DTOs (z src/types.ts):

- `AiGenerateCandidatesRequest` - struktura żądania
- `AiGenerateCandidatesResponse` - struktura odpowiedzi
- `AiCandidate` - pojedynczy kandydat na fiszkę
- `GenerationMetadata` - metadane procesu generacji
- `ApiResponse<T>` - standardowa obwija odpowiedzi API
- `ErrorResponse` - standardowa struktura błędów

### Nowe typy do utworzenia:

```typescript
// Konfiguracja modelu AI
interface AiModelConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
}

// Szczegóły błędu AI
interface AiServiceError {
  code: "RATE_LIMIT" | "INVALID_REQUEST" | "MODEL_ERROR" | "TIMEOUT" | "UNKNOWN";
  message: string;
  is_retryable: boolean;
  retry_after?: number;
}

// Obiekt żądania do OpenRouter
interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: "system" | "user";
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
  top_p: number;
}
```

## 4. Szczegóły odpowiedzi

### Pomyślna odpowiedź (200):

```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "id": "uuid-v4",
        "front_text": "string (max 200 chars)",
        "back_text": "string (max 500 chars)",
        "confidence": 0.85
      }
    ],
    "generation_metadata": {
      "model_used": "anthropic/claude-3-sonnet",
      "processing_time_ms": 1250,
      "retry_count": 0
    }
  }
}
```

### Odpowiedzi błędów:

- **400 Bad Request**: Nieprawidłowe dane wejściowe
- **401 Unauthorized**: Brak autoryzacji
- **429 Too Many Requests**: Przekroczenie limitu żądań
- **500 Internal Server Error**: Błąd wewnętrzny serwera
- **503 Service Unavailable**: Niedostępność usługi AI

## 5. Przepływ danych

1. **Walidacja żądania**:
   - Sprawdzenie autoryzacji użytkownika (middleware Astro)
   - Walidacja struktury i zawartości żądania (Zod)
   - Sprawdzenie limitów rate-limiting

2. **Przygotowanie żądania AI**:
   - Konstrukcja promptu systemowego dla generacji fiszek
   - Konfiguracja parametrów modelu AI
   - Przygotowanie struktury żądania do OpenRouter

3. **Wywołanie usługi AI**:
   - Wysłanie żądania do OpenRouter API
   - Obsługa mechanizmu retry z exponential backoff
   - Parsowanie i walidacja odpowiedzi AI

4. **Przetwarzanie odpowiedzi**:
   - Parsowanie JSON z wygenerowanymi kandydatami
   - Walidacja struktury każdego kandydata
   - Przypisanie tymczasowych UUID oraz ocen pewności

5. **Przygotowanie odpowiedzi**:
   - Konstrukcja obiektu odpowiedzi zgodnie ze specyfikacją
   - Dodanie metadanych generacji
   - Zwrócenie struktury ApiResponse

## 6. Względy bezpieczeństwa

### Uwierzytelnianie i autoryzacja:

- **Wymagana autoryzacja**: Użytkownik musi być zalogowany
- **Sprawdzenie sesji**: Walidacja przez middleware Astro z wykorzystaniem Supabase Auth
- **Izolacja danych**: Każdy użytkownik ma dostęp tylko do własnych generacji

### Walidacja danych:

- **Sanityzacja wejścia**: Oczyszczanie tekstu z potencjalnie niebezpiecznych znaków
- **Limity długości**: Ścisłe przestrzeganie limitów 1000-10000 znaków
- **Rate limiting**: Ograniczenie częstotliwości żądań (np. 10/minutę na użytkownika)

### Ochrona kluczy API:

- **Bezpieczne przechowywanie**: Klucz OpenRouter w zmiennych środowiskowych
- **Brak ekspozycji**: Klucz nigdy nie jest zwracany w odpowiedziach API
- **Rotacja kluczy**: Możliwość łatwej zmiany klucza bez zmian kodu

### Kontrola dostępu:

- **CORS**: Konfiguracja dla dozwolonych domen
- **Headers zabezpieczających**: Implementacja security headers
- **Logging bezpieczeństwa**: Rejestrowanie podejrzanych aktivności

## 7. Obsługa błędów

### Kategorie błędów:

#### Błędy walidacji (400 Bad Request):

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "text",
      "code": "TOO_SHORT",
      "message": "Text must be at least 1000 characters long"
    }
  ]
}
```

#### Błędy autoryzacji (401 Unauthorized):

```json
{
  "success": false,
  "error": "Authentication required",
  "details": [
    {
      "code": "NO_SESSION",
      "message": "Valid user session required"
    }
  ]
}
```

#### Błędy rate limiting (429 Too Many Requests):

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "details": [
    {
      "code": "RATE_LIMIT",
      "message": "Too many requests. Try again in 60 seconds"
    }
  ]
}
```

#### Błędy usługi AI (503 Service Unavailable):

```json
{
  "success": false,
  "error": "AI service temporarily unavailable",
  "details": [
    {
      "code": "AI_SERVICE_ERROR",
      "message": "External AI service is currently unavailable"
    }
  ]
}
```

### Strategia retry:

- **Maksymalnie 3 próby** z exponential backoff (1s, 2s, 4s)
- **Jitter**: Dodanie losowego opóźnienia (±20%) aby uniknąć thundering herd
- **Circuit breaker**: Tymczasowe wyłączenie po 5 kolejnych błędach
- **Graceful degradation**: Informowanie użytkownika o problemach z usługą

## 8. Rozważania dotyczące wydajności

### Optymalizacje:

- **Streaming odpowiedzi**: Dla dużych tekstów rozważenie streaming API
- **Input text caching**: Cache dla identycznych tekstów wejściowych (hash SHA-256 jako klucz)
- **Duplicate detection before AI**: Sprawdzanie czy kandydaci nie są duplikatami istniejących fiszek
- **Content similarity matching**: Wykorzystanie hashów do znajdowania podobnych treści
- **Kompresja**: Gzip dla odpowiedzi API
- **Connection pooling**: Ponowne użycie połączeń HTTP

### Cache implementation:

- **Cache key**: SHA-256 hash of input text (normalized - lowercase, trimmed)
- **Cache storage**: Redis lub in-memory cache z TTL (np. 24h)
- **Cache invalidation**: Time-based expiration
- **Cache hit optimization**: Zwrócenie cached results bez wywołania AI API

### Duplicate detection workflow:

1. **Pre-generation check**: Przed wywołaniem AI sprawdź czy input text już był przetwarzany
2. **Post-generation check**: Po wygenerowaniu kandydatów sprawdź duplikaty z istniejącymi fiszkami
3. **User notification**: Informuj użytkownika o znalezionych duplikatach z opcją "skip" lub "modify"

### Monitoring wydajności:

- **Metryki czasowe**: Śledzenie czasu odpowiedzi AI
- **Throughput**: Liczba żądań na sekundę
- **Error rate**: Procent błędnych żądań
- **Latencja**: Percentyle P50, P95, P99

### Skalowanie:

- **Rate limiting**: Ochrona przed przeciążeniem
- **Horizontal scaling**: Możliwość uruchomienia wielu instancji
- **Database connection pooling**: Efektywne zarządzanie połączeniami DB

## 9. Etapy wdrożenia

### Etap 1: Struktura projektu i podstawowe typy

1. Utworzenie katalogu `src/pages/api/ai/`
2. Utworzenie podstawowej struktury pliku `generate-candidates.ts`
3. Import i konfiguracja niezbędnych typów z `src/types.ts`

### Etap 2: Walidacja żądań z Zod

1. Utworzenie schematów walidacji w `src/lib/validation/ai-schemas.ts`
2. Implementacja walidacji parametrów żądania
3. Konfiguracja błędów walidacji zgodnie z ApiError interface

### Etap 3: Usługa AI (OpenRouter)

1. Utworzenie `src/lib/services/ai-service.ts`
2. Implementacja klienta OpenRouter z retry logiką
3. Konfiguracja promptów i parametrów modelu
4. Obsługa błędów i timeoutów

### Etap 4: Middleware autoryzacji

1. Sprawdzenie czy `src/middleware/index.ts` obsługuje autoryzację
2. Jeśli nie - implementacja sprawdzania sesji Supabase
3. Konfiguracja przekazywania user_id do endpointu

### Etap 5: Rate limiting

1. Utworzenie `src/lib/services/rate-limiter.ts`
2. Implementacja prostego rate limiting w pamięci
3. Konfiguracja limitów dla różnych typów użytkowników

### Etap 6: Główna logika endpointu

1. Implementacja głównej funkcji POST w `generate-candidates.ts`
2. Integracja wszystkich serwisów i walidacji
3. Konstrukcja odpowiedzi zgodnie ze specyfikacją API

### Etap 7: Obsługa błędów i logging

1. Implementacja centralized error handling
2. Dodanie logowania dla celów debugowania i monitoringu
3. Konfiguracja różnych poziomów logów (dev vs prod)

### Etap 8: Dokumentacja i deployment

1. Utworzenie dokumentacji API
2. Konfiguracja environment variables
