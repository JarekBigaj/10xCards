# Dane testowe dla endpointa /api/flashcards/check-duplicate

## Endpoint URL

```
POST http://localhost:4321/api/flashcards/check-duplicate
```

## Headers

```
Content-Type: application/json
Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN
```

## Przykładowe żądania do testowania

### 1. Podstawowe sprawdzenie duplikatu (tylko front_text)

```json
{
  "front_text": "What is the capital of France?"
}
```

### 2. Sprawdzenie duplikatu z back_text

```json
{
  "front_text": "What is the capital of France?",
  "back_text": "Paris is the capital and most populous city of France."
}
```

### 3. Sprawdzenie z user_id (opcjonalne - używa DEFAULT_USER_ID)

```json
{
  "front_text": "What is JavaScript?",
  "back_text": "JavaScript is a programming language",
  "user_id": "7ce3aad3-1038-41bc-b901-5a225e52b2db"
}
```

### 4. Test walidacji - front_text za długi (powinien zwrócić błąd 400)

```json
{
  "front_text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
}
```

### 5. Test walidacji - brak front_text (powinien zwrócić błąd 400)

```json
{
  "back_text": "Some back text without front text"
}
```

### 6. Test walidacji - nieprawidłowy user_id (powinien zwrócić błąd 400)

```json
{
  "front_text": "Test question",
  "user_id": "invalid-uuid-format"
}
```

## Oczekiwane odpowiedzi

### Sukces - brak duplikatu

```json
{
  "success": true,
  "data": {
    "is_duplicate": false,
    "similarity_score": 0,
    "duplicate_type": "none"
  }
}
```

### Sukces - znaleziono dokładny duplikat

```json
{
  "success": true,
  "data": {
    "is_duplicate": true,
    "existing_flashcard_id": "uuid-of-existing-flashcard",
    "similarity_score": 1.0,
    "duplicate_type": "exact"
  }
}
```

### Sukces - znaleziono podobny duplikat

```json
{
  "success": true,
  "data": {
    "is_duplicate": true,
    "existing_flashcard_id": "uuid-of-similar-flashcard",
    "similarity_score": 0.85,
    "duplicate_type": "similar"
  }
}
```

### Błąd walidacji (400)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "front_text",
      "code": "VALIDATION_ERROR",
      "message": "Front text must not exceed 200 characters"
    }
  ]
}
```

### Błąd autoryzacji (401)

```json
{
  "success": false,
  "error": "Unauthorized - Authentication required"
}
```

## Instrukcje testowania

1. **Uruchom serwer Astro**: `npm run dev`
2. **Uzyskaj token JWT**: Zaloguj się do aplikacji i skopiuj token z localStorage lub cookies
   - Alternatywnie: Użyj DEFAULT_USER_ID (`7ce3aad3-1038-41bc-b901-5a225e52b2db`) z `src/db/supabase.client.ts`
3. **Testuj w Postmanie**:
   - Ustaw metodę na POST
   - Dodaj URL endpointa
   - Dodaj header `Content-Type: application/json`
   - Dodaj header `Authorization: Bearer YOUR_TOKEN` (jeśli wymagane)
   - Wklej przykładowe JSON-y do body
   - Wyślij żądania i sprawdź odpowiedzi

## Uwagi

- Endpoint wymaga uwierzytelnienia przez Supabase Auth
- DEFAULT_USER_ID z `src/db/supabase.client.ts`: `7ce3aad3-1038-41bc-b901-5a225e52b2db`
- Wszystkie teksty są normalizowane przed porównaniem (lowercase, bez interpunkcji)
- Próg podobieństwa dla "similar" duplikatów to 0.8
- Hash-e są generowane za pomocą SHA-256 z znormalizowanego tekstu
- Jeśli testujesz z user_id, upewnij się że używasz tego samego ID co w tokenie JWT
