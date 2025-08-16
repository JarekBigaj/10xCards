# Specyfikacja Techniczna Modułu Autentykacji - 10xCards

## 1. Przegląd i cel dokumentu

Niniejsza specyfikacja opisuje architekturę i implementację modułu autentykacji dla aplikacji 10xCards zgodnie z wymaganiami z PRD (US-016). Moduł zapewnia bezpieczne uwierzytelnianie użytkowników poprzez rejestrację, logowanie, wylogowywanie oraz odzyskiwanie hasła z wykorzystaniem Supabase Auth.

### 1.1 Wymagania funkcjonalne (z US-016)

- Rejestracja użytkownika z walidacją email/hasło
- Logowanie z poprawną obsługą błędów
- Wylogowywanie z kompletnym czyszczeniem sesji
- Odzyskiwanie hasła poprzez email
- Bezpieczna autoryzacja dostępu do fiszek użytkownika
- Możliwość usunięcia konta wraz z danymi
- Brak dostępu do funkcji zapisywania dla niezalogowanych użytkowników

### 1.2 Ograniczenia

- Brak integracji z zewnętrznymi dostawcami OAuth (Google, GitHub)
- Tylko email/hasło jako metoda uwierzytelniania
- Sesje oparte na JWT tokenach Supabase

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1 Struktura stron i komponentów

#### 2.1.1 Nowe strony Astro

```
src/pages/
├── auth/
│   ├── login.astro          # Strona logowania
│   ├── register.astro       # Strona rejestracji
│   ├── forgot-password.astro # Strona odzyskiwania hasła
│   └── reset-password.astro  # Strona resetowania hasła
├── dashboard.astro          # Pulpit użytkownika (po zalogowaniu)
└── profile.astro            # Strona profilu użytkownika
```

#### 2.1.2 Nowe komponenty React

```
src/components/auth/
├── AuthForm.tsx             # Uniwersalny formularz auth
├── AuthLayout.tsx           # Layout dla stron auth
├── LoginForm.tsx            # Dedykowany formularz logowania
├── RegisterForm.tsx         # Dedykowany formularz rejestracji
├── ForgotPasswordForm.tsx   # Formularz odzyskiwania hasła
├── ResetPasswordForm.tsx    # Formularz resetu hasła
├── UserProfile.tsx          # Komponent profilu użytkownika
├── DeleteAccountModal.tsx   # Modal usuwania konta
├── AuthGuard.tsx           # Komponent ochrony tras
└── SavePromptModal.tsx     # Modal "Zaloguj się aby zapisać"

src/components/navigation/
├── Navigation.tsx           # Główna nawigacja z auth status
├── AuthButton.tsx          # Przycisk login/logout (prawy górny róg)
└── UserMenu.tsx            # Menu użytkownika (dropdown)

src/components/dashboard/
├── Dashboard.tsx            # Komponent pulpitu użytkownika
├── WelcomeBanner.tsx       # Banner powitalny
└── QuickActions.tsx        # Szybkie akcje dla zalogowanych
```

#### 2.1.3 Rozszerzenie istniejących komponentów

**Layout.astro** - rozszerzenie o nawigację z autentykacją:

- Dodanie komponentu `Navigation.tsx`
- Przekazywanie stanu autentykacji do komponentów
- Obsługa przekierowań dla nieautoryzowanych użytkowników

**Welcome.astro** - modyfikacja strony głównej:

- Różne widoki dla zalogowanych/niezalogowanych użytkowników
- Linki do rejestracji/logowania dla niezalogowanych
- Przekierowanie do `/dashboard` dla zalogowanych użytkowników

**dashboard.astro** - nowa strona pulpitu użytkownika:

- Główna strona po zalogowaniu (zgodnie z US-001, US-002)
- Dashboard z szybkim dostępem do funkcji
- Statystyki użytkownika i ostatnie aktywności
- Szybkie linki do generowania i przeglądania fiszek

### 2.2 Szczegółowa specyfikacja komponentów

#### 2.2.1 AuthForm.tsx

**Odpowiedzialność:** Uniwersalny komponent formularza autentykacji obsługujący wszystkie tryby (login, register, forgot-password, reset-password).

**Właściwości (Props):**

```typescript
interface AuthFormProps {
  mode: "login" | "register" | "forgot-password" | "reset-password";
  onSuccess?: (user: User) => void;
  redirectTo?: string;
  resetToken?: string; // Dla reset-password
}
```

**Stan wewnętrzny:**

- `formData: { email: string; password: string; confirmPassword?: string }`
- `isLoading: boolean`
- `errors: Record<string, string>`
- `validationErrors: string[]`

**Walidacja:**

- Email: format RFC 5322, wymagany we wszystkich trybach
- Hasło: minimum 8 znaków, wymagane w login/register/reset
- Potwierdzenie hasła: zgodność z hasłem w register/reset
- Walidacja w czasie rzeczywistym (onChange) i przy submit

**Komunikaty błędów:**

- "Email jest wymagany"
- "Nieprawidłowy format email"
- "Hasło musi mieć co najmniej 8 znaków"
- "Hasła nie są zgodne"
- "Nieprawidłowy email lub hasło" (login)
- "Email już zarejestrowany" (register)
- "Użytkownik o podanym adresie nie istnieje" (forgot-password)

#### 2.2.2 AuthLayout.tsx

**Odpowiedzialność:** Layout specjalnie zaprojektowany dla stron autentykacji z centralnym pozycjonowaniem i minimalistycznym designem.

**Właściwości:**

```typescript
interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showBackToHome?: boolean;
}
```

**Struktura wizualna:**

- Gradient tło (consistent z resztą aplikacji)
- Centrowany kontener formularza
- Logo aplikacji na górze
- Link "Powrót do strony głównej" (opcjonalny)
- Responsywny design (mobile-first)

#### 2.2.3 Navigation.tsx

**Odpowiedzialność:** Główny komponent nawigacji z obsługą stanu autentykacji zgodnie z US-016.

**Właściwości:**

```typescript
interface NavigationProps {
  user: User | null;
  currentPath: string;
}
```

**Struktura nawigacji:**

**Dla niezalogowanych:**

- Logo/Link do strony głównej (lewy górny róg)
- "Generuj fiszki" (dostępne ale bez zapisywania)
- AuthButton "Zaloguj się" (prawy górny róg, zgodnie z US-016)
- Link "Zarejestruj się" (prawy górny róg, obok przycisku logowania)

**Dla zalogowanych:**

- Logo/Link do strony głównej (lewy górny róg)
- "Dashboard" (link do pulpitu)
- "Generuj fiszki"
- "Moje fiszki"
- "Sesja nauki"
- UserMenu (dropdown z profilem i wylogowaniem, prawy górny róg zgodnie z US-016)

#### 2.2.4 AuthGuard.tsx

**Odpowiedzialność:** HOC/komponent ochrony tras wymagających autentykacji.

**Właściwości:**

```typescript
interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}
```

**Logika:**

- Sprawdza stan autentykacji użytkownika
- Przekierowuje do `/auth/login` jeśli wymagana autentykacja
- Wyświetla fallback lub dzieci na podstawie stanu auth
- Obsługuje loading states podczas sprawdzania sesji

#### 2.2.5 SavePromptModal.tsx

**Odpowiedzialność:** Modal wyświetlany niezalogowanym użytkownikom próbującym zapisać fiszki (zgodnie z US-016).

**Właściwości:**

```typescript
interface SavePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateCount: number; // Liczba fiszek do zapisania
}
```

**Funkcjonalność:**

- Wyświetla komunikat "Zaloguj się aby zapisać [X] fiszek"
- Przyciski "Zaloguj się" i "Zarejestruj się"
- Opcja "Kontynuuj bez zapisywania" (closes modal)
- Przekierowanie do `/auth/login` z parametrem `redirectTo`

### 2.3 Scenariusze walidacji i błędów

#### 2.3.1 Walidacja po stronie klienta

**Rejestracja:**

- Email: sprawdzenie formatu przed wysłaniem
- Hasło: minimum 8 znaków, sprawdzanie w czasie rzeczywistym
- Potwierdzenie hasła: zgodność z głównym hasłem
- Wyświetlanie progress bar siły hasła

**Logowanie:**

- Email: sprawdzenie formatu
- Hasło: sprawdzenie obecności (bez wymagań długości)
- Podświetlanie błędnych pól

#### 2.3.2 Obsługa błędów serwera

**Błędy autentykacji Supabase:**

- `invalid_credentials` → "Nieprawidłowy email lub hasło"
- `email_already_exists` → "Konto z tym adresem już istnieje"
- `email_not_confirmed` → "Potwierdź swój adres email"
- `too_many_requests` → "Za dużo prób. Spróbuj ponownie za chwilę"
- `network_error` → "Błąd połączenia. Sprawdź internet"

**Wyświetlanie błędów:**

- Toast notifications dla błędów globalnych
- Inline messages przy polach formularza
- Loading states dla wszystkich akcji asynchronicznych

### 2.4 Responsywność i UX

#### 2.4.1 Breakpointy (Tailwind CSS)

- `sm` (640px): Podstawowe formularze
- `md` (768px): Rozszerzone layouty
- `lg` (1024px): Pełne desktop experience
- `xl` (1280px): Opcjonalne sidebar navigation

#### 2.4.2 Wzorce UX

- Wyraźne rozróżnienie między stanami auth/non-auth
- Consistent button styling (Shadcn/ui)
- Loading indicators dla wszystkich async operacji
- Auto-focus na pierwszym polu formularza
- Keyboard navigation support (Tab/Enter)
- Clear CTAs ("Zaloguj się", "Utwórz konto", "Wyślij link resetujący")

## 3. LOGIKA BACKENDOWA

### 3.1 Struktura endpointów API

#### 3.1.1 Endpointy autentykacji

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

#### 3.1.2 Endpointy profilu użytkownika

```
src/pages/api/user/
├── profile.ts            # GET, PUT, DELETE - zarządzanie profilem
├── change-password.ts    # POST - zmiana hasła
└── stats.ts             # GET - statystyki użytkownika
```

### 3.2 Szczegółowa specyfikacja endpointów

#### 3.2.1 POST /api/auth/register

**Cel:** Rejestracja nowego użytkownika w systemie.

**Request Body:**

```typescript
interface RegisterRequest {
  email: string; // Walidacja: format email
  password: string; // Walidacja: min 8 znaków
  confirmPassword: string; // Walidacja: zgodność z password
}
```

**Response Success (201):**

```typescript
interface RegisterResponse {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      email_confirmed: boolean;
    };
    message: string; // "Sprawdź email aby potwierdzić konto"
  };
}
```

**Response Error (400/409/500):**

```typescript
interface RegisterErrorResponse {
  success: false;
  error: string;
  details?: {
    field: string;
    code: "EMAIL_EXISTS" | "WEAK_PASSWORD" | "INVALID_EMAIL";
    message: string;
  }[];
}
```

**Logika walidacji:**

- Sprawdzenie formatu email (RFC 5322)
- Walidacja siły hasła (minimum 8 znaków, zgodnie z US-001)
- Sprawdzenie zgodności hasła i potwierdzenia (zgodnie z US-001)
- Próba utworzenia konta w Supabase Auth
- Wysłanie emaila weryfikacyjnego
- Po poprawnej rejestracji: przekierowanie do `/dashboard` (zgodnie z US-001)

#### 3.2.2 POST /api/auth/login

**Cel:** Logowanie istniejącego użytkownika.

**Request Body:**

```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response Success (200):**

```typescript
interface LoginResponse {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      email_confirmed: boolean;
    };
    session: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };
  };
}
```

**Response Error (401/400/500):**

```typescript
interface LoginErrorResponse {
  success: false;
  error: string;
  code: "INVALID_CREDENTIALS" | "EMAIL_NOT_CONFIRMED" | "ACCOUNT_LOCKED";
}
```

**Logika autoryzacji:**

- Walidacja danych wejściowych (email i hasło zgodnie z US-002)
- Próba logowania przez Supabase Auth
- Sprawdzenie statusu potwierdzenia emaila
- Ustawienie sesji w ciasteczkach (HttpOnly)
- Zwrócenie danych użytkownika i tokenu
- Po poprawnym logowaniu: przekierowanie do `/dashboard` (zgodnie z US-002)

#### 3.2.3 POST /api/auth/logout

**Cel:** Wylogowanie użytkownika i invalidacja sesji.

**Authorization:** Bearer token wymagany

**Response Success (200):**

```typescript
interface LogoutResponse {
  success: true;
  message: string; // "Wylogowano pomyślnie"
}
```

**Logika wylogowania:**

- Invalidacja tokenu w Supabase
- Usunięcie ciasteczek sesji
- Czyszczenie session storage w frontend
- Opcjonalne: logowanie zdarzenia wylogowania

#### 3.2.4 POST /api/auth/forgot-password

**Cel:** Wysłanie linku resetującego hasło.

**Request Body:**

```typescript
interface ForgotPasswordRequest {
  email: string;
}
```

**Response Success (200):**

```typescript
interface ForgotPasswordResponse {
  success: true;
  message: string; // "Jeśli konto istnieje, otrzymasz email z linkiem do resetu"
}
```

**Logika resetu:**

- Walidacja formatu emaila
- Wywołanie Supabase resetPasswordForEmail()
- Zwrócenie ogólnej wiadomości (security przez obscurity)
- Supabase automatycznie wysyła email z linkiem

#### 3.2.5 POST /api/auth/reset-password

**Cel:** Reset hasła za pomocą tokenu z emaila.

**Request Body:**

```typescript
interface ResetPasswordRequest {
  token: string; // Token z URL emaila
  password: string; // Nowe hasło
  confirmPassword: string;
}
```

**Response Success (200):**

```typescript
interface ResetPasswordResponse {
  success: true;
  message: string; // "Hasło zostało zmienione pomyślnie"
}
```

**Response Error (400/403/500):**

```typescript
interface ResetPasswordErrorResponse {
  success: false;
  error: string;
  code: "INVALID_TOKEN" | "EXPIRED_TOKEN" | "WEAK_PASSWORD";
}
```

### 3.3 Mechanizm walidacji danych wejściowych

#### 3.3.1 Schemat walidacji (Zod)

```typescript
// src/lib/validation/auth-schemas.ts
import { z } from "zod";

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

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token jest wymagany"),
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  });
```

#### 3.3.2 Obsługa walidacji w endpointach

```typescript
// Przykład użycia w /api/auth/register.ts
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Walidacja danych wejściowych
    const validatedData = RegisterSchema.parse(body);

    // Rejestracja użytkownika
    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      return handleAuthError(error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { user: data.user, message: "Sprawdź email aby potwierdzić konto" },
      }),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleValidationError(error);
    }
    return handleServerError(error);
  }
};
```

### 3.4 Obsługa wyjątków

#### 3.4.1 Centralne error handlers

```typescript
// src/lib/utils/auth-errors.ts
export function handleAuthError(error: AuthError): Response {
  const errorMap = {
    invalid_credentials: {
      status: 401,
      message: "Nieprawidłowy email lub hasło",
      code: "INVALID_CREDENTIALS",
    },
    email_already_exists: {
      status: 409,
      message: "Konto z tym adresem już istnieje",
      code: "EMAIL_EXISTS",
    },
    email_not_confirmed: {
      status: 400,
      message: "Potwierdź swój adres email",
      code: "EMAIL_NOT_CONFIRMED",
    },
    too_many_requests: {
      status: 429,
      message: "Za dużo prób. Spróbuj ponownie za chwilę",
      code: "RATE_LIMIT",
    },
  };

  const mappedError = errorMap[error.message] || {
    status: 500,
    message: "Wystąpił błąd serwera",
    code: "SERVER_ERROR",
  };

  return new Response(
    JSON.stringify({
      success: false,
      error: mappedError.message,
      code: mappedError.code,
    }),
    {
      status: mappedError.status,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

#### 3.4.2 Logging i monitoring

- Logowanie wszystkich błędów autentykacji
- Śledzenie nieudanych prób logowania
- Metryki czasów odpowiedzi endpointów auth
- Alert przy nietypowej aktywności (wielokrotne nieudane logowania)

### 3.5 Aktualizacja renderowania server-side

#### 3.5.1 Middleware rozszerzenie

```typescript
// src/middleware/index.ts - rozszerzenie istniejącego
export const onRequest = defineMiddleware(async (context, next) => {
  // Istniejąca logika
  context.locals.supabase = supabaseClient;

  // Nowa logika auth
  const session = await getSession(context.request);
  context.locals.user = session?.user || null;
  context.locals.session = session;

  return next();
});

async function getSession(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) return null;

  try {
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser(token);
    return error ? null : { user, token };
  } catch {
    return null;
  }
}
```

#### 3.5.2 Aktualizacja typów Astro locals

```typescript
// src/env.d.ts - rozszerzenie
declare namespace App {
  interface Locals {
    supabase: SupabaseClient;
    user: User | null; // Nowe
    session: Session | null; // Nowe
  }
}
```

#### 3.5.3 Server-side route protection

```typescript
// Przykład w src/pages/profile.astro
---
import Layout from '../layouts/Layout.astro';

// Server-side auth check
const { user } = Astro.locals;

if (!user) {
  return Astro.redirect('/auth/login');
}
---

<Layout title="Profil użytkownika">
  <UserProfile user={user} client:load />
</Layout>
```

## 4. SYSTEM AUTENTYKACJI

### 4.1 Wykorzystanie Supabase Auth

#### 4.1.1 Konfiguracja Supabase Auth

**Zmienne środowiskowe:**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Konfiguracja klienta:**

```typescript
// src/lib/supabase/auth-client.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAuth = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce", // Bezpieczniejszy flow
  },
});
```

#### 4.1.2 Konfiguracja email templates (Supabase Dashboard)

**Potwierdzenie emaila:**

- Subject: "Potwierdź swoje konto w 10xCards"
- Template: Custom HTML z logo i CTA button
- Redirect URL: `https://app.10xcards.com/auth/verify?token={{ .Token }}`

**Reset hasła:**

- Subject: "Resetowanie hasła - 10xCards"
- Template: Custom HTML z instrukcjami
- Redirect URL: `https://app.10xcards.com/auth/reset-password?token={{ .Token }}`

#### 4.1.3 Ustawienia bezpieczeństwa (Supabase Dashboard)

- **Session timeout:** 24 godziny
- **Password requirements:** Minimum 8 znaków
- **Rate limiting:** 10 prób logowania na 5 minut
- **Email confirmation:** Wymagane
- **Disable signup:** False (rejestracja włączona)

### 4.2 Zarządzanie sesją i tokenami

#### 4.2.1 Client-side session management

```typescript
// src/lib/auth/session-manager.ts
export class SessionManager {
  private static instance: SessionManager;
  private user: User | null = null;
  private session: Session | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  async initialize(): Promise<void> {
    const {
      data: { session },
    } = await supabaseAuth.auth.getSession();
    this.setSession(session);

    // Listen for auth changes
    supabaseAuth.auth.onAuthStateChange((event, session) => {
      this.setSession(session);
      this.notifyListeners();
    });
  }

  private setSession(session: Session | null): void {
    this.session = session;
    this.user = session?.user || null;
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.user));
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  async signOut(): Promise<void> {
    await supabaseAuth.auth.signOut();
    this.setSession(null);
    this.notifyListeners();
  }

  getUser(): User | null {
    return this.user;
  }

  getSession(): Session | null {
    return this.session;
  }

  isAuthenticated(): boolean {
    return !!this.user;
  }
}
```

#### 4.2.2 Token refresh handling

```typescript
// src/lib/auth/token-manager.ts
export class TokenManager {
  private refreshPromise: Promise<void> | null = null;

  async getValidToken(): Promise<string | null> {
    const session = SessionManager.getInstance().getSession();

    if (!session) return null;

    // Check if token is expired or will expire in next 5 minutes
    const expiresAt = session.expires_at * 1000;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (expiresAt - now < fiveMinutes) {
      return this.refreshToken();
    }

    return session.access_token;
  }

  private async refreshToken(): Promise<string | null> {
    // Prevent multiple concurrent refresh requests
    if (this.refreshPromise) {
      await this.refreshPromise;
      return SessionManager.getInstance().getSession()?.access_token || null;
    }

    this.refreshPromise = this.performRefresh();
    await this.refreshPromise;
    this.refreshPromise = null;

    return SessionManager.getInstance().getSession()?.access_token || null;
  }

  private async performRefresh(): Promise<void> {
    try {
      const { data, error } = await supabaseAuth.auth.refreshSession();
      if (error) throw error;

      // Session will be updated automatically via onAuthStateChange
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Force logout on refresh failure
      await SessionManager.getInstance().signOut();
    }
  }
}
```

### 4.3 Row Level Security (RLS) aktualizacja

#### 4.3.1 Polityki bezpieczeństwa dla fiszek

```sql
-- src/supabase/migrations/20250101000000_update_rls_auth.sql

-- Update flashcards policies dla real auth
DROP POLICY IF EXISTS "Users can view own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can insert own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can update own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can delete own flashcards" ON flashcards;

-- Real auth policies
CREATE POLICY "Authenticated users can view own flashcards" ON flashcards
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "Authenticated users can insert own flashcards" ON flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own flashcards" ON flashcards
  FOR UPDATE USING (auth.uid() = user_id AND is_deleted = false)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own flashcards" ON flashcards
  FOR UPDATE USING (auth.uid() = user_id AND is_deleted = false)
  WITH CHECK (auth.uid() = user_id AND is_deleted = true);
```

#### 4.3.2 Polityki dla review_records

```sql
CREATE POLICY "Authenticated users can view own reviews" ON review_records
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "Authenticated users can insert own reviews" ON review_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can soft delete own reviews" ON review_records
  FOR UPDATE USING (auth.uid() = user_id AND is_deleted = false)
  WITH CHECK (auth.uid() = user_id AND is_deleted = true);
```

### 4.4 Aktualizacja istniejących serwisów

#### 4.4.1 Modyfikacja auth.ts

```typescript
// src/lib/utils/auth.ts - aktualizacja
export const AUTH_ENABLED = true; // Zmiana z false na true

export async function getCurrentUserId(supabase: SupabaseClient): Promise<{
  userId: string | null;
  error?: string;
}> {
  if (!AUTH_ENABLED) {
    return { userId: DEFAULT_USER_ID };
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return { userId: null, error: authError.message };
    }

    if (!user) {
      return { userId: null, error: "User not authenticated" };
    }

    return { userId: user.id };
  } catch (error) {
    return {
      userId: null,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}

// Nowa funkcja do weryfikacji tokenu
export async function verifyAuthToken(token: string): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser(token);
    return error ? null : user;
  } catch {
    return null;
  }
}

// Nowa funkcja do wymagania autentykacji w API
export async function requireAuth(locals: App.Locals): Promise<
  | {
      user: User;
      userId: string;
    }
  | { error: Response }
> {
  const { userId, error } = await getCurrentUserId(locals.supabase);

  if (!userId || error) {
    return {
      error: new Response(
        JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  const user = locals.user;
  if (!user) {
    return {
      error: new Response(
        JSON.stringify({
          success: false,
          error: "User session not found",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  return { user, userId };
}
```

#### 4.4.2 Aktualizacja FlashcardService

```typescript
// src/lib/services/flashcard.service.ts - dodanie auth checks
export class FlashcardService {
  constructor(private supabase: SupabaseClient) {}

  async getFlashcards(userId: string, query: FlashcardListQuery) {
    // Dodatkowa weryfikacja userId z bieżącą sesją
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error("Unauthorized access");
    }

    // Reszta istniejącej logiki...
  }

  // Podobne aktualizacje w innych metodach...
}
```

### 4.5 Integracja z istniejącym API

#### 4.5.1 Aktualizacja istniejących endpointów

Wszystkie istniejące endpointy w `/api/flashcards/` wymagają modyfikacji:

```typescript
// Przykład aktualizacji src/pages/api/flashcards.ts
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Sprawdzenie autentykacji
    const authResult = await requireAuth(locals);
    if ("error" in authResult) {
      return authResult.error;
    }

    const { userId } = authResult;

    // Reszta istniejącej logiki...
    const result = await flashcardService.getFlashcards(userId, validatedQuery);

    // Reszta response handling...
  } catch (error) {
    // Error handling...
  }
};
```

#### 4.5.2 Frontend HTTP client aktualizacja

```typescript
// src/lib/http/api-client.ts
export class ApiClient {
  private tokenManager = new TokenManager();

  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = await this.tokenManager.getValidToken();

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token invalid/expired, trigger re-authentication
      await SessionManager.getInstance().signOut();
      window.location.href = "/auth/login";
      throw new Error("Authentication required");
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}
```

## 5. SCENARIUSZE INTEGRACJI I TESTOWANIA

### 5.1 Scenarios flow dla różnych stanów użytkownika

#### 5.1.1 Niezalogowany użytkownik

**Dostępne funkcje:**

- Przeglądanie strony głównej
- Generowanie kandydatów fiszek (bez zapisywania)
- Dostęp do stron auth (login/register)

**Blokowane funkcje:**

- Zapisywanie fiszek
- Dostęp do "Moje fiszki"
- Dostęp do "Sesja nauki"
- Dostęp do profilu

**Przekierowania:**

- Próba dostępu do chronionych tras → `/auth/login`
- Próba zapisu fiszek → modal "Zaloguj się aby zapisać"

#### 5.1.2 Zalogowany użytkownik - email niepotwierdzony

**Dostępne funkcje:**

- Wszystkie funkcje niezalogowanego
- Pełne zapisywanie fiszek (zgodnie z US-016: "Tylko zalogowany użytkownik MOŻĘ zapisać fiszki")
- Dostęp do dashboard
- Zmiana hasła
- Wylogowanie

**Komunikaty informacyjne:**

- Banner "Potwierdź swój adres email aby w pełni korzystać z aplikacji"
- Przycisk "Wyślij ponownie email" w bannerze
- Brak funkcjonalnych ograniczeń (PRD nie wspomina o ograniczeniach)

#### 5.1.3 Zalogowany użytkownik - email potwierdzony

**Dostępne funkcje:**

- Pełny dostęp do wszystkich funkcji
- Nieograniczone zapisywanie fiszek
- Wszystkie funkcje nauki i statystyk
- Zarządzanie kontem

### 5.2 Test scenarios dla UX

#### 5.2.1 Rejestracja - happy path (zgodnie z US-001)

1. Użytkownik wchodzi na `/auth/register`
2. Wypełnia formularz (email, hasło, potwierdź hasło zgodnie z US-001)
3. Walidacja: email w formacie, hasło min. 8 znaków, potwierdzenie zgodne (US-001)
4. Kliknięcie "Utwórz konto"
5. Loading state (2-3s)
6. Po poprawnym wypełnieniu: przekierowanie do `/dashboard` (US-001: "przekierowuje do pulpitu")
7. Banner "Sprawdź email aby potwierdzić konto"
8. Email przychodzi (do 5 min)
9. Kliknięcie linku w email → email potwierdzony
10. Usunięcie bannera informacyjnego z dashboard

#### 5.2.2 Logowanie - error handling (zgodnie z US-002)

1. Użytkownik wchodzi na `/auth/login`
2. Podaje błędny email/hasło
3. Error message "Nieprawidłowy email lub hasło" (zgodnie z US-002)
4. Podświetlenie błędnych pól
5. Link "Zapomniałeś hasła?" widoczny (zgodnie z US-016: "Odzyskanie hasła powinno być możliwe")
6. Retry z poprawnymi danymi (email i hasło zgodnie z US-002)
7. Successful login → przekierowanie do `/dashboard`

#### 5.2.3 Reset hasła - complete flow

1. Kliknięcie "Zapomniałeś hasła?" na login
2. Wprowadzenie emaila
3. Submit → generic message "Sprawdź email"
4. Email z linkiem (do 5 min)
5. Kliknięcie linku → `/auth/reset-password?token=xxx`
6. Formularz nowego hasła
7. Walidacja siły hasła w real-time
8. Submit → "Hasło zmienione" + auto-login
9. Przekierowanie do `/dashboard`

#### 5.2.4 Scenariusz niezalogowanego użytkownika próbującego zapisać fiszki (zgodnie z US-016)

1. Niezalogowany użytkownik generuje fiszki z tekstu (US-016: "Użytkownik MOŻE wygenerować fiszki z tekstu")
2. Klika "Zapisz wybrane fiszki"
3. Wyświetla się SavePromptModal: "Zaloguj się aby zapisać [X] fiszek"
4. Opcje: "Zaloguj się", "Zarejestruj się", "Kontynuuj bez zapisywania"
5. Wybór "Zaloguj się" → `/auth/login?redirectTo=/generate`
6. Po zalogowaniu → powrót do `/generate` z zachowanymi kandydatami
7. Ponowne kliknięcie "Zapisz" → fiszki zapisane (US-016: "Tylko zalogowany użytkownik MOŻĘ zapisać fiszki")

### 5.3 Bezpieczeństwo i testy penetracyjne

#### 5.3.1 Potencjalne wektory ataków

**CSRF Protection:**

- Wszystkie forms używają CSRF tokens
- SameSite cookies dla sesji
- Origin checking w API endpoints

**XSS Prevention:**

- Sanitization wszystkich user inputs
- CSP headers w HTML
- Escaped output w templates

**Brute Force Protection:**

- Rate limiting na login endpoint (Supabase built-in)
- Account lockout po 5 nieudanych próbach
- CAPTCHA po 3 nieudanych próbach (opcjonalne)

**Session Security:**

- HttpOnly cookies dla tokens
- Secure flag w production
- Token expiration (24h)
- Automatic refresh with rotation

#### 5.3.2 Audit trail i monitoring

**Logowane zdarzenia:**

- Successful/failed login attempts
- Password reset requests
- Account creation/deletion
- Suspicious activity patterns

**Metryki do śledzenia:**

- Login success rate
- Password reset completion rate
- Session duration average
- Failed authentication spikes

## 6. PLAN WDROŻENIA

### 6.1 Fazy implementacji

#### Faza 1: Fundament

- [ ] Aktualizacja Supabase konfiguracji
- [ ] Podstawowe komponenty auth (AuthForm, AuthLayout)
- [ ] Endpointy register/login/logout
- [ ] SessionManager i TokenManager
- [ ] Podstawowe testy jednostkowe

#### Faza 2: Core funkcjonalność

- [ ] Strony auth (login.astro, register.astro)
- [ ] Navigation z auth state
- [ ] Middleware aktualizacja
- [ ] AuthGuard component
- [ ] RLS policies update

#### Faza 3: UX i walidacja

- [ ] Forgot/reset password flow
- [ ] Error handling i messages
- [ ] Loading states i UX improvements
- [ ] Form validation (client + server)
- [ ] Responsive design

#### Faza 4: Integracja

- [ ] Aktualizacja istniejących API endpoints
- [ ] Frontend client update (auth headers)
- [ ] Profile management
- [ ] Account deletion flow
- [ ] Dashboard.astro implementacja
- [ ] SavePromptModal dla niezalogowanych

#### Faza 5: Finalne dopracowanie zgodności z PRD

- [ ] Weryfikacja wszystkich User Stories (US-001 do US-016)
- [ ] Testy E2E scenariuszy z PRD
- [ ] Pozycjonowanie przycisków auth w prawym górnym rogu
- [ ] Przekierowania do `/dashboard` zamiast strony głównej
- [ ] Walidacja komunikatów błędów zgodnie z PRD

### 6.2 Krytyczne punkty uwagi

#### 6.2.1 Breaking changes

- Zmiana `AUTH_ENABLED = true` - wpłynie na wszystkich
- RLS policies - mogą zablokować dostęp do danych
- API responses - nowe error codes
- Frontend routing - przekierowania auth

#### 6.2.2 Rollback plan

- Feature flag `AUTH_ENABLED` pozwala na szybki rollback
- Database migrations są backwards-compatible
- Frontend komponenty są additive (nie zastępują istniejących)
- Supabase Auth settings można szybko przywrócić

#### 6.2.3 Data migration

- Istniejące fiszki pozostają przypisane do DEFAULT_USER_ID
- Opcja migracji danych testowych do prawdziwych użytkowników
- Backup bazy przed włączeniem auth
- Monitoring po przełączeniu na production auth

## 7. WERYFIKACJA ZGODNOŚCI Z USER STORIES

### 7.1 Mapowanie User Stories na komponenty

#### US-001 (Rejestracja użytkownika)

**Kryteria akceptacji → Implementacja:**

- ✅ Formularz z polami email, hasło, potwierdź hasło → `RegisterForm.tsx`
- ✅ Walidacja: email w formacie, hasło min. 8 znaków → `RegisterSchema` (Zod)
- ✅ Przekierowanie do pulpitu → `/dashboard` po rejestracji
- ✅ Komunikaty walidacyjne → Error handling w `AuthForm.tsx`
- ✅ "Email już zarejestrowany" → `handleAuthError()` mapping

#### US-002 (Logowanie użytkownika)

**Kryteria akceptacji → Implementacja:**

- ✅ Pola email i hasło → `LoginForm.tsx`
- ✅ Przekierowanie do pulpitu → `/dashboard` po logowaniu
- ✅ "Nieprawidłowy email lub hasło" → Error mapping w `auth-errors.ts`
- ✅ Utrzymywanie sesji → `SessionManager` + JWT tokens

#### US-016 (Bezpieczny dostęp i autoryzacja)

**Kryteria akceptacji → Implementacja:**

- ✅ Tylko zalogowany może CRUD fiszki → RLS policies + `requireAuth()`
- ✅ Email + hasło → `LoginSchema` + `RegisterSchema`
- ✅ Brak dostępu do fiszek innych → RLS `auth.uid() = user_id`
- ✅ Generowanie bez zapisywania → `SavePromptModal.tsx`
- ✅ Tylko zalogowany zapisuje → Auth check w API endpoints
- ✅ Przycisk w prawym górnym rogu → `AuthButton.tsx` positioning
- ✅ Dedykowane strony → `/auth/login`, `/auth/register`
- ✅ Brak OAuth → Tylko email/password w konfiguracji
- ✅ Odzyskanie hasła → `/auth/forgot-password`, `/auth/reset-password`

### 7.2 Potencjalne luki w implementacji

#### ⚠️ WYMAGANA IMPLEMENTACJA:

1. **Dashboard.astro** - kluczowa strona "pulpitu" z US-001, US-002
2. **SavePromptModal.tsx** - modal dla niezalogowanych próbujących zapisać (US-016)
3. **AuthButton positioning** - prawy górny róg (US-016)
4. **Redirect logic** - wszystkie przekierowania do `/dashboard` nie strony głównej
5. **Session storage persistence** - zachowanie kandydatów po auth redirect

### 7.3 Zgodność z ograniczeniami MVP

#### ✅ ZACHOWANE OGRANICZENIA:

- Brak OAuth providers (Google, GitHub)
- Brak zaawansowanych funkcji autoryzacji
- Brak eksportu/importu fiszek
- Brak współdzielenia między użytkownikami

---
