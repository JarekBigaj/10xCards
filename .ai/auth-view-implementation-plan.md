# Plan implementacji widoku Autoryzacja (Login / Rejestracja)

## 1. Przegląd

Widok odpowiada za uwierzytelnianie użytkownika (logowanie, rejestrację, odzyskiwanie hasła) przy użyciu Supabase Auth zgodnie z wymaganiami z PRD (US-001, US-002, US-016). Zapewnia bezpieczne i dostępne formularze, walidację po stronie klienta oraz obsługę błędów zwracanych przez Supabase. Po pomyślnym logowaniu/rejestracji użytkownik zostaje przekierowany do `/dashboard` (zgodnie z US-001, US-002).

## 2. Routing widoku

- Logowanie: `/auth/login`
- Rejestracja: `/auth/register`
- Odzyskiwanie hasła: `/auth/forgot-password`
- Reset hasła: `/auth/reset-password`
- Dashboard użytkownika: `/dashboard` (nowa strona - cel przekierowań)
- Profil użytkownika: `/profile`

Wszystkie ścieżki auth wykorzystują `AuthLayout.tsx` z różnymi wariantami komponentu `AuthForm`. Dashboard i profil wymagają autentykacji (zgodnie z US-016).

## 3. Struktura komponentów

### 3.1 Komponenty autoryzacji

```
src/components/auth/
├── AuthLayout.tsx               # Layout dla stron auth (z spec)
├── AuthForm.tsx                 # Uniwersalny formularz auth (4 tryby)
├── LoginForm.tsx               # Dedykowany formularz logowania
├── RegisterForm.tsx            # Dedykowany formularz rejestracji
├── ForgotPasswordForm.tsx      # Formularz odzyskiwania hasła
├── ResetPasswordForm.tsx       # Formularz resetu hasła
├── AuthGuard.tsx              # Komponent ochrony tras
├── SavePromptModal.tsx        # Modal "Zaloguj się aby zapisać" (US-016)
├── UserProfile.tsx            # Komponent profilu użytkownika
└── DeleteAccountModal.tsx     # Modal usuwania konta (US-003)
```

### 3.2 Komponenty nawigacji i dashboard

```
src/components/navigation/
├── Navigation.tsx              # Główna nawigacja z auth status
├── AuthButton.tsx             # Przycisk login/logout (prawy górny róg - US-016)
└── UserMenu.tsx              # Menu użytkownika (dropdown)

src/components/dashboard/
├── Dashboard.tsx              # Komponent pulpitu użytkownika
├── WelcomeBanner.tsx         # Banner powitalny
└── QuickActions.tsx          # Szybkie akcje dla zalogowanych
```

### 3.3 Hierarchia komponentów auth

```
AuthLayout (dla stron auth)
 ├─ AuthForm (mode="login" | "register" | "forgot-password" | "reset-password")
 │   ├─ FormField (email)
 │   ├─ FormField (password)
 │   ├─ FormField (confirmPassword)   ← tylko register/reset
 │   ├─ PasswordStrength             ← tylko register/reset
 │   ├─ ErrorMessage                 ← komunikaty globalne
 │   └─ SubmitButton
 └─ Linki nawigacyjne między formami
```

## 4. Szczegóły komponentów

### 4.1 AuthLayout.tsx (zgodnie ze specyfikacją)

- **Opis**: Layout specjalnie zaprojektowany dla stron autoryzacji z centralnym pozycjonowaniem i minimalistycznym designem.
- **Główne elementy**: Gradient tło, centrowany kontener, logo aplikacji, opcjonalny link powrotu.
- **Obsługiwane interakcje**: Opcjonalny przycisk "Powrót do strony głównej".
- **Responsywność**: Mobile-first design (Tailwind breakpointy).
- **Propsy**:
  ```typescript
  interface AuthLayoutProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    showBackToHome?: boolean;
  }
  ```

### 4.2 AuthForm.tsx (uniwersalny komponent ze specyfikacji)

- **Opis**: Uniwersalny komponent formularza autentykacji obsługujący wszystkie tryby (login, register, forgot-password, reset-password).
- **Główne elementy**: Dynamiczne pola w zależności od trybu, PasswordStrength (register/reset), ErrorMessage, loading states.
- **Obsługiwane interakcje**:
  - `onSubmit` → wywołuje odpowiednie API endpointy (zgodnie ze specyfikacją).
  - `onInput` → walidacja w czasie rzeczywistym (React Hook Form + Zod).
- **Obsługiwana walidacja** (zgodnie z US-001):
  - `email`: format RFC 5322, wymagany we wszystkich trybach.
  - `password`: minimum 8 znaków (zgodnie z US-001, US-002).
  - `confirmPassword`: zgodność z hasłem w register/reset.
  - Walidacja w czasie rzeczywistym i przy submit.
- **Propsy** (ze specyfikacji):
  ```typescript
  interface AuthFormProps {
    mode: "login" | "register" | "forgot-password" | "reset-password";
    onSuccess?: (user: User) => void;
    redirectTo?: string;
    resetToken?: string; // Dla reset-password
  }
  ```
- **Stan wewnętrzny**:
  - `formData: { email: string; password: string; confirmPassword?: string }`
  - `isLoading: boolean`
  - `errors: Record<string, string>`
  - `validationErrors: string[]`

### 4.3 Navigation.tsx (zgodnie z US-016)

- **Opis**: Główny komponent nawigacji z obsługą stanu autentykacji (prawy górny róg zgodnie z US-016).
- **Struktura dla niezalogowanych**:
  - Logo/Link do strony głównej (lewy górny róg)
  - "Generuj fiszki" (dostępne ale bez zapisywania)
  - AuthButton "Zaloguj się" (prawy górny róg zgodnie z US-016)
  - Link "Zarejestruj się" (prawy górny róg)
- **Struktura dla zalogowanych**:
  - Logo/Link do strony głównej (lewy górny róg)
  - "Dashboard", "Generuj fiszki", "Moje fiszki", "Sesja nauki"
  - UserMenu (dropdown z profilem i wylogowaniem, prawy górny róg zgodnie z US-016)
- **Propsy** (ze specyfikacji):
  ```typescript
  interface NavigationProps {
    user: User | null;
    currentPath: string;
  }
  ```

### 4.4 AuthGuard.tsx (ochrona tras zgodnie z US-016)

- **Opis**: HOC/komponent ochrony tras wymagających autentykacji.
- **Logika**: Sprawdza stan autentykacji, przekierowuje do `/auth/login` jeśli wymagana, obsługuje loading states.
- **Propsy** (ze specyfikacji):
  ```typescript
  interface AuthGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    redirectTo?: string;
    requireAuth?: boolean;
  }
  ```

### 4.5 SavePromptModal.tsx (zgodnie z US-016)

- **Opis**: Modal wyświetlany niezalogowanym użytkownikom próbującym zapisać fiszki.
- **Funkcjonalność**:
  - Komunikat "Zaloguj się aby zapisać [X] fiszek"
  - Przyciski "Zaloguj się" i "Zarejestruj się"
  - Opcja "Kontynuuj bez zapisywania"
  - Przekierowanie do `/auth/login` z parametrem `redirectTo`
- **Propsy** (ze specyfikacji):
  ```typescript
  interface SavePromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidateCount: number;
  }
  ```

### 4.6 PasswordStrength i pomocnicze

- **PasswordStrength**: Wskaźnik siły hasła dla register/reset (`PasswordStrengthLevel = "weak" | "medium" | "strong"`).
- **ErrorMessage**: Globalne błędy formularza z `role="alert"`.
- **FormField**: Wrapper z labelką, inputem i komunikatem błędu (generyczne z RHF).

## 5. Typy (zgodnie ze specyfikacją)

```typescript
// Rozszerzone tryby autoryzacji
export type AuthFormMode = "login" | "register" | "forgot-password" | "reset-password";

export interface AuthFormValues {
  email: string;
  password: string;
  confirmPassword?: string; // obowiązkowe w register/reset
}

// Rozszerzone kody błędów ze specyfikacji
export interface AuthError {
  code:
    | "INVALID_CREDENTIALS"
    | "EMAIL_EXISTS"
    | "EMAIL_NOT_CONFIRMED"
    | "RATE_LIMIT"
    | "INVALID_TOKEN"
    | "EXPIRED_TOKEN"
    | "WEAK_PASSWORD"
    | "UNKNOWN";
  message: string;
  field?: string; // Dla błędów pól
}

export type PasswordStrengthLevel = "weak" | "medium" | "strong";

// Typy użytkownika (z Supabase Auth)
export interface User {
  id: string;
  email: string;
  email_confirmed: boolean;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

// Komunikaty błędów (zgodnie ze specyfikacją)
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Nieprawidłowy email lub hasło",
  EMAIL_EXISTS: "Konto z tym adresem już istnieje",
  EMAIL_NOT_CONFIRMED: "Potwierdź swój adres email",
  RATE_LIMIT: "Za dużo prób. Spróbuj ponownie za chwilę",
  INVALID_TOKEN: "Link resetujący jest nieprawidłowy",
  EXPIRED_TOKEN: "Link resetujący wygasł",
  WEAK_PASSWORD: "Hasło jest za słabe",
  NETWORK_ERROR: "Błąd połączenia. Sprawdź internet",
  UNKNOWN: "Wystąpił błąd serwera",
} as const;
```

## 6. Zarządzanie stanem (zgodnie ze specyfikacją)

### 6.1 SessionManager (Singleton ze specyfikacji)

```typescript
export class SessionManager {
  private static instance: SessionManager;
  private user: User | null = null;
  private session: Session | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  // Główne metody:
  async initialize(): Promise<void>; // Inicjalizacja sesji
  onAuthStateChange(callback): () => void; // Nasłuchiwanie zmian
  async signOut(): Promise<void>; // Wylogowanie
  getUser(): User | null; // Pobranie użytkownika
  isAuthenticated(): boolean; // Sprawdzenie auth
}
```

### 6.2 TokenManager (ze specyfikacji)

```typescript
export class TokenManager {
  async getValidToken(): Promise<string | null>; // Token z auto-refresh
  private async refreshToken(): Promise<string | null>; // Odświeżanie
}
```

### 6.3 Stan lokalny (React Hook Form)

- `formData: AuthFormValues` - wartości pól formularza
- `isLoading: boolean` - stan ładowania
- `errors: Record<string, string>` - błędy walidacji pól
- `globalError: string | null` - błędy globalne (np. z API)

## 7. Integracja API (zgodnie ze specyfikacją)

### 7.1 Konfiguracja Supabase Auth

```typescript
// src/lib/supabase/auth-client.ts
export const supabaseAuth = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce", // Bezpieczniejszy flow
  },
});
```

### 7.2 API Endpointy (ze specyfikacji)

```
src/pages/api/auth/
├── login.ts              # POST - logowanie użytkownika
├── register.ts           # POST - rejestracja użytkownika
├── logout.ts             # POST - wylogowanie użytkownika
├── forgot-password.ts    # POST - żądanie resetu hasła
├── reset-password.ts     # POST - reset hasła z tokenem
├── refresh.ts            # POST - odświeżenie tokenu
└── verify-email.ts       # GET - weryfikacja emaila
```

### 7.3 Walidacja danych (Zod schemas ze specyfikacji)

```typescript
// src/lib/validation/auth-schemas.ts
export const RegisterSchema = z
  .object({
    email: z.string().email("Nieprawidłowy format email").min(1, "Email jest wymagany"),
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Hasło musi zawierać małą literę, dużą literę i cyfrę"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});
```

### 7.4 Obsługa odpowiedzi API

- **Po sukcesie rejestracji/logowania**: Przekierowanie do `/dashboard` (zgodnie z US-001, US-002)
- **Po błędzie**: Mapowanie `SupabaseAuthError` → `AuthError` zgodnie ze specyfikacją
- **Aktualizacja SessionManager**: Automatyczne przez `onAuthStateChange` listener

## 8. Interakcje użytkownika (zgodnie z PRD i specyfikacją)

### 8.1 Scenariusze podstawowe (US-001, US-002)

| Interakcja                                   | Oczekiwany rezultat                              |
| -------------------------------------------- | ------------------------------------------------ |
| Wpisuje niepoprawny email                    | Komunikat walidacji pod polem email (real-time)  |
| Hasło < 8 znaków (US-001)                    | Komunikat walidacji, nieaktywny przycisk Submit  |
| Hasła się różnią (register)                  | Błąd przy `confirmPassword`                      |
| Kliknięcie "Zaloguj" z poprawnymi danymi     | Redirect do `/dashboard` (US-002)                |
| Kliknięcie "Zarejestruj" z poprawnymi danymi | Redirect do `/dashboard` (US-001)                |
| Email już zarejestrowany                     | Globalny błąd "Konto z tym adresem już istnieje" |
| Nieprawidłowy email/hasło (login)            | Błąd "Nieprawidłowy email lub hasło" (US-002)    |

### 8.2 Scenariusze zaawansowane

| Interakcja                          | Oczekiwany rezultat                           |
| ----------------------------------- | --------------------------------------------- |
| Zapomniałeś hasła? → email          | "Sprawdź email" + link resetujący             |
| Kliknięcie linku reset → nowe hasło | Formularz reset + auto-login po zmianie       |
| Próba zapisu fiszek (niezalogowany) | SavePromptModal "Zaloguj się aby zapisać [X]" |
| Rate limit (za dużo prób)           | "Za dużo prób. Spróbuj ponownie za chwilę"    |
| Brak internetu                      | "Błąd połączenia. Sprawdź internet"           |

### 8.3 Nawigacja (US-016)

| Stan użytkownika | Prawy górny róg                   | Dostępne funkcje                       |
| ---------------- | --------------------------------- | -------------------------------------- |
| Niezalogowany    | "Zaloguj się" + "Zarejestruj się" | Generowanie (bez zapisu), przeglądanie |
| Zalogowany       | UserMenu (email + wyloguj)        | Pełny dostęp + zapis fiszek            |

## 9. Walidacja (zgodnie z US-001 i specyfikacją)

### 9.1 Walidacja po stronie klienta

- **Email**: Format RFC 5322, sprawdzenie przed wysłaniem
- **Hasło (US-001)**: Minimum 8 znaków + regex siły (`/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/`)
- **Potwierdzenie hasła**: Zgodność z głównym hasłem (register/reset)
- **Real-time walidacja**: onChange + onBlur events
- **Progress bar siły hasła**: Wizualny feedback dla register/reset

### 9.2 Walidacja po stronie serwera

- **Zod schemas**: Identyczna walidacja w API endpoints
- **Sanitization**: Wszystkie user inputs przed zapisem
- **Rate limiting**: 10 prób na 5 minut (Supabase built-in)

### 9.3 Blokady UX

- Przycisk Submit nieaktywny podczas walidacji
- Loading states dla wszystkich async operacji
- Podświetlanie błędnych pól

## 10. Obsługa błędów (zgodnie ze specyfikacją)

### 10.1 Mapowanie błędów Supabase → UI

```typescript
// src/lib/utils/auth-errors.ts (ze specyfikacji)
const errorMap = {
  invalid_credentials: "Nieprawidłowy email lub hasło" (US-002),
  email_already_exists: "Konto z tym adresem już istnieje" (US-001),
  email_not_confirmed: "Potwierdź swój adres email",
  too_many_requests: "Za dużo prób. Spróbuj ponownie za chwilę",
  // ... inne błędy ze specyfikacji
};
```

### 10.2 Typy wyświetlania błędów

- **Toast notifications**: Błędy globalne i sieciowe
- **Inline messages**: Błędy walidacji pól
- **Banner offline**: `navigator.onLine === false`
- **Fallback**: Nieznane błędy → "Wystąpił błąd serwera"

### 10.3 Bezpieczeństwo i monitoring

- **CSRF Protection**: Tokens we wszystkich forms
- **XSS Prevention**: Sanitization + CSP headers
- **Audit trail**: Logowanie prób logowania i zmian
- **Metryki**: Śledzenie success rate, błędów, czasów odpowiedzi

## 11. Plan implementacji (zgodnie ze specyfikacją - 5 faz)

### 11.1 Faza 1: Fundament (zgodnie ze specyfikacją)

- [ ] **Aktualizacja Supabase konfiguracji** (`src/lib/supabase/auth-client.ts`)
- [ ] **SessionManager i TokenManager** (klasy Singleton ze specyfikacji)
- [ ] **Podstawowe komponenty auth** (`AuthLayout.tsx`, `AuthForm.tsx`)
- [ ] **API endpointy register/login/logout** (ze specyfikacji)
- [ ] **Podstawowe testy jednostkowe**

### 11.2 Faza 2: Core funkcjonalność

- [ ] **Strony auth** (`login.astro`, `register.astro`, `forgot-password.astro`, `reset-password.astro`)
- [ ] **Navigation z auth state** (prawy górny róg - US-016)
- [ ] **Middleware aktualizacja** (`src/middleware/index.ts` - user context)
- [ ] **AuthGuard component** (ochrona tras)
- [ ] **RLS policies update** (auth.uid() = user_id)

### 11.3 Faza 3: UX i walidacja (zgodnie z US-001, US-002)

- [ ] **Forgot/reset password flow** (pełny przepływ z emailem)
- [ ] **Error handling i messages** (mapowanie błędów ze specyfikacji)
- [ ] **Loading states i UX improvements**
- [ ] **Form validation** (Zod schemas, client + server)
- [ ] **Responsive design** (Mobile-first, Tailwind breakpointy)

### 11.4 Faza 4: Integracja z istniejącym systemem

- [ ] **Aktualizacja istniejących API endpoints** (auth headers, requireAuth())
- [ ] **Frontend client update** (TokenManager w ApiClient)
- [ ] **Dashboard.astro implementacja** (cel przekierowań US-001, US-002)
- [ ] **Profile management** (`UserProfile.tsx`, `DeleteAccountModal.tsx`)
- [ ] **SavePromptModal dla niezalogowanych** (US-016)

### 11.5 Faza 5: Finalne dopracowanie zgodności z PRD

- [ ] **Weryfikacja wszystkich User Stories** (US-001 do US-016)
- [ ] **Testy E2E scenariuszy z PRD** (happy paths + error handling)
- [ ] **AuthButton positioning** (prawy górny róg - US-016)
- [ ] **Przekierowania do `/dashboard`** (zamiast strony głównej)
- [ ] **Session storage persistence** (zachowanie kandydatów po auth redirect)

### 11.6 Krytyczne punkty uwagi (ze specyfikacji)

#### Breaking changes:

- Zmiana `AUTH_ENABLED = true` w `src/lib/utils/auth.ts`
- RLS policies activation - może zablokować dostęp do danych
- API responses - nowe error codes i auth requirements
- Frontend routing - przekierowania auth

#### Rollback plan:

- Feature flag `AUTH_ENABLED` pozwala na szybki rollback
- Database migrations są backwards-compatible
- Supabase Auth settings można szybko przywrócić

