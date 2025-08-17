# Przewodnik Implementacji Usługi OpenRouter

## Opis usługi

Usługa OpenRouter jest dedykowanym serwisem do komunikacji z interfejsem API OpenRouter, umożliwiającym generowanie treści opartych na Large Language Models (LLM). Usługa została zaprojektowana z myślą o integracji z systemem generowania fiszek edukacyjnych, zapewniając niezawodną komunikację z różnymi modelami AI poprzez ujednolicony interfejs.

### Główne funkcjonalności:

- **Komunikacja z OpenRouter API** - wysyłanie żądań do różnych modeli LLM
- **Strukturyzowane odpowiedzi** - obsługa response_format z JSON schema
- **Inteligentne retry** - exponential backoff z jitter dla retryable errors
- **Circuit breaker** - automatyczne wyłączanie przy krytycznych błędach
- **Cache'owanie** - hash-based caching dla optymalizacji wydajności
- **Mock mode** - tryb testowy bez rzeczywistych API calls

## Opis konstruktora

```typescript
constructor(
  apiKey?: string,
  useMockData = true,
  config?: OpenRouterServiceConfig
)
```

### Parametry:

- **apiKey** (opcjonalny): Klucz API OpenRouter. Jeśli nie podany, pobierany z `OPENROUTER_API_KEY`
- **useMockData** (domyślnie true): Włącza tryb testowy z mock data
- **config** (opcjonalny): Konfiguracja usługi (timeout, retry settings, circuit breaker)

### Konfiguracja domyślna:

```typescript
const DEFAULT_CONFIG: OpenRouterServiceConfig = {
  baseUrl: "https://openrouter.ai/api/v1",
  timeout: 30000, // 30 sekund
  maxRetries: 3,
  baseDelay: 1000, // 1 sekunda
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000, // 1 minuta
};
```

## Publiczne metody i pola

### 1. `generateFlashcards(request: FlashcardGenerationRequest)`

Główna metoda generująca fiszki edukacyjne.

```typescript
async generateFlashcards(
  request: FlashcardGenerationRequest
): Promise<FlashcardGenerationResponse>
```

**Parametry:**

- `topic`: Główny temat generowania
- `difficulty_level`: Poziom trudności (easy/medium/hard)
- `count`: Liczba fiszek do wygenerowania (1-10)
- `category`: Opcjonalna kategoria
- `additional_context`: Dodatkowy kontekst

**Zwraca:**

- `flashcards`: Tablica wygenerowanych fiszek
- `metadata`: Metadane procesu generowania
- `processing_time`: Czas przetwarzania w ms

### 2. `setModel(model: string)`

Zmiana modelu AI używane do generowania.

```typescript
setModel(model: string): void
```

**Dostępne modele:**

- `anthropic/claude-3-haiku` (domyślny)
- `anthropic/claude-3-sonnet`
- `openai/gpt-4o`
- `openai/gpt-4o-mini`
- `meta-llama/llama-3.1-8b-instruct`

### 3. `updateConfig(config: Partial<OpenRouterServiceConfig>)`

Aktualizacja konfiguracji usługi.

```typescript
updateConfig(config: Partial<OpenRouterServiceConfig>): void
```

### 4. `getServiceStatus()`

Sprawdzenie statusu usługi i circuit breaker.

```typescript
getServiceStatus(): ServiceStatus
```

**Zwraca:**

- `isHealthy`: Czy usługa działa poprawnie
- `circuitBreakerState`: Stan circuit breaker (CLOSED/OPEN/HALF_OPEN)
- `lastError`: Ostatni błąd
- `requestCount`: Liczba wykonanych żądań

## Prywatne metody i pola

### 1. `callOpenRouter(request: OpenRouterRequest)`

Wysyłanie żądania do OpenRouter API.

```typescript
private async callOpenRouter(
  request: OpenRouterRequest
): Promise<OpenRouterResponse>
```

**Implementacja:**

- Dodawanie nagłówków autoryzacji
- Obsługa timeout
- Walidacja odpowiedzi
- Logowanie metryk

### 2. `parseStructuredResponse(response: string, schema: JSONSchema)`

Parsowanie strukturyzowanej odpowiedzi zgodnie z JSON schema.

```typescript
private parseStructuredResponse(
  response: string,
  schema: JSONSchema
): unknown
```

**Funkcjonalność:**

- Ekstrakcja JSON z markdown
- Walidacja zgodności ze schematem
- Fallback na standardowe parsowanie

### 3. `executeWithRetry<T>(operation: () => Promise<T>)`

Wykonanie operacji z inteligentnym retry.

```typescript
private async executeWithRetry<T>(
  operation: () => Promise<T>
): Promise<T>
```

**Strategia retry:**

- Exponential backoff z jitter
- Maksymalnie 3 próby
- Circuit breaker integration

### 4. `updateCircuitBreaker(success: boolean)`

Aktualizacja stanu circuit breaker.

```typescript
private updateCircuitBreaker(success: boolean): void
```

**Logika:**

- Zliczanie błędów
- Automatyczne otwieranie/zamykanie
- Timeout dla reset

## Obsługa błędów

### 1. Scenariusze błędów

#### Błędy sieciowe

- **Brak połączenia internetowego**
- **Timeout połączenia**
- **DNS resolution failure**

#### Błędy API OpenRouter

- **401 Unauthorized** - nieprawidłowy API key
- **429 Too Many Requests** - przekroczenie rate limit
- **500 Internal Server Error** - błąd serwera OpenRouter
- **503 Service Unavailable** - serwis niedostępny

#### Błędy odpowiedzi

- **Nieprawidłowy format JSON**
- **Brak wymaganych pól**
- **Odpowiedź niezgodna ze schematem**

### 2. Klasyfikacja błędów

```typescript
export interface OpenRouterError {
  code: ErrorCode;
  message: string;
  isRetryable: boolean;
  retryAfter?: number;
  details?: unknown;
}

export type ErrorCode =
  | "NETWORK_ERROR"
  | "AUTHENTICATION_ERROR"
  | "RATE_LIMIT_ERROR"
  | "VALIDATION_ERROR"
  | "MODEL_ERROR"
  | "TIMEOUT_ERROR"
  | "UNKNOWN_ERROR";
```

### 3. Strategie obsługi

#### Retryable errors (automatyczne retry):

- Rate limiting (429)
- Timeout (408)
- Server errors (5xx)
- Network timeouts

#### Non-retryable errors (bez retry):

- Authentication errors (401)
- Validation errors (4xx)
- Model-specific errors

### 4. Circuit Breaker Pattern

```typescript
enum CircuitBreakerState {
  CLOSED = "CLOSED", // Normal operation
  OPEN = "OPEN", // Service blocked
  HALF_OPEN = "HALF_OPEN", // Testing recovery
}
```

**Logika:**

- Po 5 błędach z rzędu → OPEN
- Po 60 sekundach → HALF_OPEN
- Po udanym żądaniu → CLOSED

## Kwestie bezpieczeństwa

### 1. API Key Management

```typescript
// ✅ DOBRZE - Environment variables
const apiKey = import.meta.env.OPENROUTER_API_KEY;

// ❌ ŹLE - Hardcoded w kodzie
const apiKey = "sk-or-v1-abc123...";
```

**Zasady:**

- Używaj environment variables
- Nigdy nie commit'uj API keys do repo
- Rotuj klucze regularnie
- Używaj najmniejszych wymaganych uprawnień

### 2. Rate Limiting

```typescript
// Implementacja rate limitera
const rateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000, // 1 minuta
  keyGenerator: (req) => req.ip,
});
```

### 3. Input Validation

```typescript
// Walidacja input przed wysłaniem do API
function validateFlashcardRequest(request: FlashcardGenerationRequest): void {
  if (request.count < 1 || request.count > 10) {
    throw new ValidationError("Count must be between 1 and 10");
  }

  if (request.topic.length < 3 || request.topic.length > 200) {
    throw new ValidationError("Topic must be 3-200 characters");
  }
}
```

### 4. Response Sanitization

```typescript
// Sanityzacja odpowiedzi AI
function sanitizeFlashcardContent(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}
```

## Plan wdrożenia krok po kroku

### Krok 1: Przygotowanie środowiska

#### 1.1 Konfiguracja environment variables

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3-haiku
```

#### 1.2 Instalacja zależności

```bash
npm install zod # dla walidacji schematów
npm install --save-dev @types/node # dla typów Node.js
```

### Krok 2: Implementacja typów i interfejsów

#### 2.1 Rozszerzenie typów w `src/types.ts`

```typescript
// Dodaj nowe typy dla OpenRouter
export interface OpenRouterServiceConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  baseDelay: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

export interface JSONSchema {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: boolean;
}

export interface FlashcardGenerationRequest {
  topic: string;
  difficulty_level: "easy" | "medium" | "hard";
  count: number;
  category?: string;
  additional_context?: string;
}
```

#### 2.2 Definicja schematu JSON dla fiszek

```typescript
export const FLASHCARD_SCHEMA: JSONSchema = {
  type: "object",
  properties: {
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          front_text: { type: "string", maxLength: 200 },
          back_text: { type: "string", maxLength: 500 },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          category: { type: "string" },
        },
        required: ["front_text", "back_text"],
      },
    },
  },
  required: ["flashcards"],
  additionalProperties: false,
};
```

### Krok 3: Implementacja głównej usługi

#### 3.1 Utworzenie pliku `src/lib/services/openrouter.service.ts`

```typescript
import { OpenRouterServiceConfig, FlashcardGenerationRequest, JSONSchema } from "../../types";

export class OpenRouterService {
  private readonly config: OpenRouterServiceConfig;
  private readonly apiKey: string;
  private circuitBreakerState: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private errorCount: number = 0;
  private lastErrorTime: number = 0;
  private currentModel: string;

  constructor(apiKey?: string, config?: Partial<OpenRouterServiceConfig>) {
    this.apiKey = apiKey || import.meta.env.OPENROUTER_API_KEY;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentModel = import.meta.env.OPENROUTER_DEFAULT_MODEL || "anthropic/claude-3-haiku";

    if (!this.apiKey) {
      throw new Error("OpenRouter API key is required");
    }
  }

  // Implementacja metod...
}
```

#### 3.2 Implementacja metody generowania fiszek

```typescript
async generateFlashcards(
  request: FlashcardGenerationRequest
): Promise<FlashcardGenerationResponse> {
  const startTime = Date.now();

  try {
    // Walidacja input
    this.validateFlashcardRequest(request);

    // Sprawdzenie circuit breaker
    if (this.circuitBreakerState === CircuitBreakerState.OPEN) {
      throw new CircuitBreakerError("Service temporarily unavailable");
    }

    // Przygotowanie promptu
    const systemPrompt = this.buildSystemPrompt(request);
    const userPrompt = this.buildUserPrompt(request);

    // Wywołanie API z retry
    const response = await this.executeWithRetry(() =>
      this.callOpenRouter({
        model: this.currentModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "flashcard_schema",
            strict: true,
            schema: FLASHCARD_SCHEMA
          }
        }
      })
    );

    // Parsowanie odpowiedzi
    const flashcards = this.parseStructuredResponse(response, FLASHCARD_SCHEMA);

    // Aktualizacja circuit breaker
    this.updateCircuitBreaker(true);

    return {
      flashcards,
      metadata: {
        model_used: this.currentModel,
        processing_time_ms: Date.now() - startTime,
        retry_count: 0
      }
    };

  } catch (error) {
    this.updateCircuitBreaker(false);
    throw this.convertToOpenRouterError(error);
  }
}
```

### Krok 4: Implementacja obsługi błędów

#### 4.1 Utworzenie klasy `OpenRouterError`

```typescript
export class OpenRouterError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public isRetryable: boolean = false,
    public retryAfter?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export class CircuitBreakerError extends OpenRouterError {
  constructor(message: string) {
    super("CIRCUIT_BREAKER_OPEN", message, false);
  }
}
```

#### 4.2 Implementacja error converter

```typescript
private convertToOpenRouterError(error: unknown): OpenRouterError {
  if (error instanceof OpenRouterError) {
    return error;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  // Mapowanie błędów HTTP na OpenRouterError
  if (errorMessage.includes("401")) {
    return new OpenRouterError("AUTHENTICATION_ERROR", "Invalid API key", false);
  }

  if (errorMessage.includes("429")) {
    return new OpenRouterError("RATE_LIMIT_ERROR", "Rate limit exceeded", true, 60);
  }

  if (errorMessage.includes("timeout")) {
    return new OpenRouterError("TIMEOUT_ERROR", "Request timed out", true);
  }

  return new OpenRouterError("UNKNOWN_ERROR", errorMessage, false);
}
```

### Krok 5: Implementacja circuit breaker

#### 5.1 Logika circuit breaker

```typescript
private updateCircuitBreaker(success: boolean): void {
  if (success) {
    if (this.circuitBreakerState === CircuitBreakerState.HALF_OPEN) {
      this.circuitBreakerState = CircuitBreakerState.CLOSED;
      this.errorCount = 0;
    }
  } else {
    this.errorCount++;
    this.lastErrorTime = Date.now();

    if (this.errorCount >= this.config.circuitBreakerThreshold) {
      this.circuitBreakerState = CircuitBreakerState.OPEN;
    }
  }
}

private checkCircuitBreaker(): void {
  if (this.circuitBreakerState === CircuitBreakerState.OPEN) {
    const timeSinceLastError = Date.now() - this.lastErrorTime;

    if (timeSinceLastError >= this.config.circuitBreakerTimeout) {
      this.circuitBreakerState = CircuitBreakerState.HALF_OPEN;
    }
  }
}
```

### Krok 6: Implementacja retry mechanism

#### 6.1 Exponential backoff z jitter

```typescript
private async executeWithRetry<T>(
  operation: () => Promise<T>
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === this.config.maxRetries) {
        break;
      }

      if (!this.isRetryableError(lastError)) {
        throw lastError;
      }

      const delay = this.calculateRetryDelay(attempt);
      await this.sleep(delay);
    }
  }

  throw lastError!;
}

private calculateRetryDelay(attempt: number): number {
  const baseDelay = this.config.baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.4 - 0.2; // ±20% jitter
  return Math.floor(baseDelay * (1 + jitter));
}
```

### Krok 7: Implementacja response parsing

#### 7.1 Parsowanie strukturyzowanych odpowiedzi

````typescript
private parseStructuredResponse(
  response: string,
  schema: JSONSchema
): unknown {
  try {
    // Ekstrakcja JSON z markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                     response.match(/(\{[\s\S]*?\})/);

    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const parsedData = JSON.parse(jsonMatch[1]);

    // Walidacja zgodności ze schematem
    this.validateAgainstSchema(parsedData, schema);

    return parsedData;

  } catch (error) {
    throw new OpenRouterError(
      "VALIDATION_ERROR",
      `Failed to parse structured response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      false
    );
  }
}

private validateAgainstSchema(data: unknown, schema: JSONSchema): void {
  // Implementacja walidacji JSON schema
  // Można użyć biblioteki zod lub ajv
}
````


### Krok 8: Integracja z istniejącym systemem

#### 8.1 Aktualizacja `src/lib/services/ai.service.ts`

```typescript
import { OpenRouterService } from "./openrouter.service";

export class AiService {
  private openRouterService: OpenRouterService;

  constructor(apiKey?: string, useMockData = true) {
    this.openRouterService = new OpenRouterService(apiKey, { useMockData });
  }

  async generateCandidates(text: string): Promise<{ candidates: AiCandidate[]; metadata: GenerationMetadata }> {
    const request = {
      topic: text,
      difficulty_level: "medium" as const,
      count: 5,
    };

    const response = await this.openRouterService.generateFlashcards(request);

    // Konwersja na AiCandidate format
    const candidates = response.flashcards.map((flashcard) => ({
      id: crypto.randomUUID(),
      front_text: flashcard.front_text,
      back_text: flashcard.back_text,
      confidence: 0.9, // Default confidence
    }));

    return {
      candidates,
      metadata: {
        model_used: response.metadata.model_used,
        processing_time_ms: response.metadata.processing_time_ms,
        retry_count: response.metadata.retry_count,
      },
    };
  }
}
```

## Podsumowanie

Ten przewodnik implementacji zapewnia kompleksowe podejście do wdrożenia usługi OpenRouter w projekcie 10xCards. Kluczowe elementy obejmują:

1. **Solidną architekturę** z circuit breaker pattern
2. **Inteligentne retry** z exponential backoff
3. **Bezpieczne zarządzanie** API keys
4. **Strukturyzowane odpowiedzi** z JSON schema validation
5. **Obsługę błędów** z precyzyjną klasyfikacją

Implementacja jest dostosowana do stacku technologicznego projektu (Astro 5 + React 19 + TypeScript 5) i przestrzega zasad clean code z early returns i guard clauses.
