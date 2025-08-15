# Plan implementacji widoku Autoryzacja (Login / Rejestracja)

## 1. Przegląd

Widok odpowiada za uwierzytelnianie użytkownika (logowanie oraz rejestrację) przy użyciu Supabase Auth. Zapewnia bezpieczne i dostępne formularze, walidację po stronie klienta oraz obsługę błędów zwracanych przez Supabase. Po pomyślnym logowaniu/rejestracji użytkownik zostaje przekierowany do `/dashboard`.

## 2. Routing widoku

- Logowanie: `/auth/login`
- Rejestracja: `/auth/register`

Obie ścieżki wykorzystują ten sam szablon strony (`AuthPageLayout`) z różnymi wariantami komponentu `AuthForm`.

## 3. Struktura komponentów

```
AuthPageLayout
 ├─ AuthForm (mode="login" | "register")
 │   ├─ FormField (email)
 │   ├─ FormField (password)
 │   ├─ FormField (confirmPassword)   ← tylko w trybie „register”
 │   ├─ PasswordStrength             ← tylko w trybie „register”
 │   ├─ ErrorMessage                 ← komunikaty globalne
 │   └─ SubmitButton
 ├─ DividerWithText "lub"
 └─ SocialLoginButtons (provider list) – placeholder na przyszłość
```

## 4. Szczegóły komponentów

### AuthPageLayout

- **Opis**: Minimalistyczny layout strony auth z logo, nagłówkiem, kontenerem formularza i tłem.
- **Główne elementy**: `<header>`, `<main class="flex items-center justify-center">`, `<footer>` (opc.).
- **Obsługiwane interakcje**: brak (czysto prezentacyjny).
- **Obsługiwana walidacja**: brak.
- **Typy**: brak niestandardowych.
- **Propsy**: `children: React.ReactNode`.

### AuthForm

- **Opis**: Pojedynczy komponent obsługujący zarówno logowanie, jak i rejestrację – kontrolowany przez prop `mode`.
- **Główne elementy**: Pola formularza (`email`, `password`, `confirmPassword`), komponenty pomocnicze (`PasswordStrength`, `ErrorMessage`), przycisk Submit.
- **Obsługiwane interakcje**:
  - `onSubmit` → wywołuje Supabase Auth (`signInWithPassword` lub `signUp`).
  - `onInput` → walidacja w locie (React Hook Form + Zod).
- **Obsługiwana walidacja**:
  - `email`: poprawny format (RFC 5322).
  - `password`: min. 8 znaków.
  - `confirmPassword`: musi być identyczne z `password` (tylko tryb register).
- **Typy**: `AuthFormMode`, `AuthFormValues`, `AuthError`.
- **Propsy**:
  - `mode: AuthFormMode` ("login" | "register").
  - `onSuccess?: () => void` (opcjonalny callback).

### FormField

- **Opis**: Wrapper z labelką, inputem i komunikatem o błędzie.
- **Główne elementy**: `<label>`, `<input|password>`, `<p role="alert">`.
- **Obsługiwane interakcje**: `onChange`, `onBlur` przekazane z RHF.
- **Obsługiwana walidacja**: delegowana z React Hook Form.
- **Typy**: generyczne z RHF.
- **Propsy**: `name`, `label`, `type`, `placeholder` itd.

### PasswordStrength

- **Opis**: Wskaźnik siły hasła oparty na długości i złożoności.
- **Główne elementy**: Pasek postępu lub ikonki.
- **Obsługiwane interakcje**: aktualizacja w czasie rzeczywistym przy zmianie pola hasła.
- **Obsługiwana walidacja**: brak (wizualny feedback).
- **Typy**: `PasswordStrengthLevel = "weak" | "medium" | "strong"`.
- **Propsy**: `password: string`.

### ErrorMessage

- **Opis**: Komponent wyświetlający globalne błędy formularza (np. "Email już zarejestrowany").
- **Główne elementy**: `<div role="alert">`.
- **Obsługiwane interakcje**: brak.
- **Obsługiwana walidacja**: —
- **Typy**: `AuthError`.
- **Propsy**: `message: string`.

### SocialLoginButtons (future-proof)

- **Opis**: Przycisk/i do logowania społecznościowego (Google, GitHub ...). Na razie placeholder.
- **Główne elementy**: `<button>` z ikonami.
- **Obsługiwane interakcje**: `onClick` → Supabase OAuth.
- **Obsługiwana walidacja**: —
- **Typy**: `OAuthProvider = "google" | "github" | ...`.
- **Propsy**: `provider: OAuthProvider`.

## 5. Typy

```ts
export type AuthFormMode = "login" | "register";

export interface AuthFormValues {
  email: string;
  password: string;
  confirmPassword?: string; // obowiązkowe w trybie register
}

export interface AuthError {
  code: "INVALID_CREDENTIALS" | "EMAIL_EXISTS" | "UNKNOWN";
  message: string;
}

export type PasswordStrengthLevel = "weak" | "medium" | "strong";
```

## 6. Zarządzanie stanem

- **Lokalny (React Hook Form)**: wartości pól, błędy walidacji, `isSubmitting`.
- **Globalny (Zustand → `useAuthStore`)**:
  - `user: SessionUser | null` (dostarczany przez Supabase).
  - `signIn`, `signUp`, `signOut` – wrapery na metody Supabase.
  - `isAuthenticated` – afordancja do ochrony tras.

## 7. Integracja API

1. Instalacja i konfiguracja klienta Supabase (`src/lib/supabaseClient.ts`).
2. `AuthForm`:

```ts
if (mode === "login") {
  const { error } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  });
} else {
  const { error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
  });
}
```

3. Po sukcesie → aktualizacja `useAuthStore` i `navigate('/dashboard')`.
4. Mapowanie błędów `SupabaseAuthError` → `AuthError` (np. `EMAIL_EXISTS`).

## 8. Interakcje użytkownika

| Interakcja                                     | Oczekiwany rezultat                             |
| ---------------------------------------------- | ----------------------------------------------- |
| Wpisuje niepoprawny email                      | Komunikat walidacji pod polem email             |
| Hasło < 8 znaków                               | Komunikat walidacji, nieaktywny przycisk Submit |
| Hasła się różnią (register)                    | Błąd przy `confirmPassword`                     |
| Kliknięcie "Zaloguj" z poprawnymi danymi       | Redirect do `/dashboard`                        |
| Kliknięcie "Zarejestruj" z istniejącym emailem | Globalny błąd "Email już zarejestrowany"        |
| Kliknięcie przycisku Social Login              | Wywołanie `supabase.auth.signInWithOAuth`       |

## 9. Warunki i walidacja

- `email` – regex RFC 5322.
- `password` – min 8 znaków.
- `confirmPassword` – równe `password`.
- Blokada przycisku Submit, dopóki walidacja nie przejdzie.
- Globalny `loading` podczas wysyłki.

## 10. Obsługa błędów

- **Supabase**:
  - `AuthApiError` → mapowane do przyjaznych komunikatów.
  - `rate-limit` → toast "Spróbuj ponownie później".
- **Sieć offline**: `navigator.onLine === false` → Banner offline.
- **Nieznany błąd**: Fallback toast + log do Sentry.

## 11. Kroki implementacji

1. **Utwórz** klienta Supabase w `src/lib/supabaseClient.ts`.
2. **Zaimplementuj** `useAuthStore` (Zustand) do przechowywania sesji.
3. **Zabezpiecz** trasy prywatne middlewarem Astro (`src/middleware/index.ts`).
4. **Stwórz** `AuthPageLayout.astro` w `src/layouts` z podziałem slotów.
5. **Zaimplementuj** `AuthForm.tsx` (React Hook Form + Zod).
6. **Dodaj** walidację oraz komponent `PasswordStrength`.
7. **Obsłuż** błędy Supabase i mapuj je do `ErrorMessage`.
8. **Dodaj** routing w `src/pages/auth/login.astro` oraz `src/pages/auth/register.astro`.
9. **Podłącz** SocialLoginButtons (na razie disable lub feature-flag).
10. **Dodaj** testy jednostkowe dla walidacji i integracyjne (cypress) dla pełnego przepływu.
11. **Przegląd UX/a11y**: focus trap, role="alert", aria-labels.
12. **Code review** + deploy na staging.
