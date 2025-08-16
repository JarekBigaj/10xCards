# Instrukcje konfiguracji autentykacji

## Aktualny stan

Aplikacja obecnie działa w trybie testowym z mockowanym użytkownikiem (`DEFAULT_USER_ID`).

## Jak przełączyć na prawdziwą autentykację

### 1. Zmień konfigurację w `src/lib/utils/auth.ts`

```typescript
// Zmień z:
export const AUTH_ENABLED = false;

// Na:
export const AUTH_ENABLED = true;
```

### 2. Sprawdź konfigurację Supabase

Upewnij się, że:

- Zmienne środowiskowe `SUPABASE_URL` i `SUPABASE_ANON_KEY` są ustawione
- Klient Supabase w `src/db/supabase.client.ts` jest poprawnie skonfigurowany
- RLS (Row Level Security) jest odpowiednio skonfigurowane w bazie danych

### 3. Dodaj interfejs logowania

Stwórz komponenty do:

- Logowania użytkowników (`SignIn.tsx`)
- Rejestracji użytkowników (`SignUp.tsx`)
- Wylogowania (`SignOut.tsx`)
- Zarządzania stanem autentykacji

### 4. Zaktualizuj middleware (jeśli potrzebne)

W `src/middleware/index.ts` możesz dodać logikę:

- Sprawdzania sesji użytkownika
- Przekierowywania niezalogowanych użytkowników
- Odświeżania tokenów

### 5. Testowanie

Po włączeniu autentykacji przetestuj:

- Rejestrację nowych użytkowników
- Logowanie/wylogowanie
- Dostęp do API bez tokenu (powinien być odrzucony)
- Zapisywanie fiszek dla zalogowanego użytkownika

## Pliki które zostały przygotowane na autentykację

- `src/lib/utils/auth.ts` - centralna logika autentykacji
- `src/pages/api/flashcards.ts` - endpoint fiszek z obsługą auth
- `src/pages/api/flashcards/[id].ts` - endpoint pojedynczej fiszki
- `src/pages/api/flashcards/check-duplicate.ts` - endpoint sprawdzania duplikatów

## Domyślny użytkownik testowy

```
USER_ID: 7ce3aad3-1038-41bc-b901-5a225e52b2db
```

W bazie danych znajdują się już przykładowe fiszki dla tego użytkownika.
