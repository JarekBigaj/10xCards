# Plan Wdrożenia Pozostałych Funkcji Autentykacji - 10xCards

## ✅ Co zostało już zaimplementowane (Faza 1 - Podstawowa):

### Fundament techniczny:

- ✅ Konfiguracja Supabase SSR (@supabase/ssr)
- ✅ Middleware autentykacji z cookie handling
- ✅ Typy Astro.locals (User, Session)
- ✅ Validation schemas (Zod)
- ✅ Error handling utilities

### Podstawowe API endpoints:

- ✅ `/api/auth/login` - Logowanie użytkownika
- ✅ `/api/auth/register` - Rejestracja użytkownika
- ✅ `/api/auth/logout` - Wylogowanie użytkownika

### UI i integracja:

- ✅ AuthForm.tsx zintegrowany z API
- ✅ Prawdziwa autentykacja w profile.astro i dashboard.astro
- ✅ Przekierowania strony głównej do dashboard dla zalogowanych
- ✅ Middleware ochrony tras

---

## 🔄 Co należy zaimplementować w kolejnych krokach:

## Faza 2: Reset hasła i email verification

### API Endpoints (Priorytet: WYSOKI)

- [ ] `/api/auth/forgot-password` - Żądanie resetu hasła
- [ ] `/api/auth/reset-password` - Reset hasła z tokenem
- [ ] `/api/auth/verify-email` - Weryfikacja emaila

### Strony Astro (Priorytet: WYSOKI)

- [ ] `src/pages/auth/forgot-password.astro` - Strona odzyskiwania hasła
- [ ] `src/pages/auth/reset-password.astro` - Strona resetowania hasła

### Konfiguracja (Priorytet: ŚREDNI)

- [ ] Supabase email templates (Dashboard)
- [ ] Redirect URLs w konfiguracji Supabase

## Faza 3: Zaawansowane komponenty UI

### Navigation i Auth UI (Priorytet: WYSOKI)

- [ ] `src/components/navigation/AuthButton.tsx` - Przycisk auth w prawym górnym rogu
- [ ] `src/components/navigation/UserMenu.tsx` - Dropdown menu użytkownika
- [ ] Aktualizacja `Navigation.tsx` - różne widoki dla zalogowanych/niezalogowanych

### Modals i UX (Priorytet: ŚREDNI)

- [ ] `src/components/auth/SavePromptModal.tsx` - Modal "Zaloguj się aby zapisać"
- [ ] `src/components/auth/AuthGuard.tsx` - HOC ochrony komponentów
- [ ] `src/components/auth/DeleteAccountModal.tsx` - Modal usuwania konta

### Layout i styling (Priorytet: NISKI)

- [ ] `src/components/auth/AuthLayout.tsx` - Dedykowany layout stron auth
- [ ] Email confirmation banner na dashboard

## Faza 4: Funkcje zarządzania kontem

### User Profile (Priorytet: ŚREDNI)

- [ ] `/api/user/profile` - GET, PUT, DELETE profilu
- [ ] `/api/user/change-password` - POST zmiana hasła
- [ ] `/api/user/stats` - GET statystyki użytkownika
- [ ] Kompletny komponent UserProfile.tsx

### Account Management (Priorytet: NISKI)

- [ ] Delete account flow z potwierdzeniem
- [ ] Export danych użytkownika (RODO)
- [ ] Email preferences

## Faza 5: Integracja z istniejącymi funkcjami

### Flashcards API (Priorytet: WYSOKI)

- [ ] Aktualizacja auth helpers w `src/lib/utils/auth.ts`
- [ ] Funkcja `requireAuth()` dla API endpoints
- [ ] Aktualizacja wszystkich `/api/flashcards/*` endpoints
- [ ] Frontend HTTP client z automatycznym dodawaniem auth headers

### Generate View Integration (Priorytet: ŚREDNI)

- [ ] Integracja SavePromptModal w GenerateViewClient.tsx
- [ ] Session storage preservation podczas auth flow
- [ ] Auto-save po zalogowaniu się

### Session Management (Priorytet: ŚREDNI)

- [ ] `src/lib/auth/session-manager.ts` - Client-side session management
- [ ] `src/lib/auth/token-manager.ts` - Automatic token refresh
- [ ] `src/lib/http/api-client.ts` - HTTP client z auth

## Faza 6: Bezpieczeństwo i optymalizacja

### Security (Priorytet: WYSOKI)

- [ ] Rate limiting na auth endpoints
- [ ] CSRF protection
- [ ] Input sanitization
- [ ] Security headers

### Database (Priorytet: ŚREDNI)

- [ ] RLS policies update dla real auth
- [ ] Migration z DEFAULT_USER_ID na real user IDs
- [ ] Cleanup testowych danych

### Monitoring i Logging (Priorytet: NISKI)

- [ ] Auth events logging
- [ ] Failed attempts monitoring
- [ ] Performance metrics
- [ ] Error tracking

---

## 📋 Szczegółowe instrukcje implementacji:

### Krok 1: Forgot/Reset Password Flow

**A. API Endpoints:**

```typescript
// src/pages/api/auth/forgot-password.ts
export const POST: APIRoute = async ({ request, cookies }) => {
  const { email } = ForgotPasswordSchema.parse(await request.json());
  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${Astro.site}/auth/reset-password`,
  });

  // Zawsze zwracaj sukces (security przez obscurity)
  return new Response(
    JSON.stringify({
      success: true,
      message: "Jeśli konto istnieje, otrzymasz email z linkiem do resetu",
    }),
    { status: 200 }
  );
};
```

**B. Reset Password Page:**

```astro
---
// src/pages/auth/reset-password.astro
import Layout from "../../layouts/Layout.astro";
import { AuthForm } from "../../components/auth/AuthForm";

const token = Astro.url.searchParams.get("access_token");
if (!token) {
  return Astro.redirect("/auth/forgot-password");
}
---

<Layout title="Reset hasła - 10xCards">
  <AuthForm mode="reset-password" resetToken={token} client:load />
</Layout>
```

### Krok 2: AuthButton i UserMenu

**A. AuthButton dla niezalogowanych:**

```tsx
// src/components/navigation/AuthButton.tsx
export function AuthButton({ user }: { user: User | null }) {
  if (user) {
    return <UserMenu user={user} />;
  }

  return (
    <div className="flex items-center space-x-2">
      <a href="/auth/login" className="button-ghost">
        Zaloguj się
      </a>
      <a href="/auth/register" className="button-primary">
        Zarejestruj się
      </a>
    </div>
  );
}
```

**B. UserMenu dla zalogowanych:**

```tsx
// src/components/navigation/UserMenu.tsx
export function UserMenu({ user }: { user: User }) {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{user.email}</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <a href="/profile">Profil</a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>Wyloguj się</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Krok 3: SavePromptModal

```tsx
// src/components/auth/SavePromptModal.tsx
export function SavePromptModal({ isOpen, onClose, candidateCount }: SavePromptModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zaloguj się aby zapisać fiszki</DialogTitle>
          <DialogDescription>
            Masz {candidateCount} wygenerowanych fiszek. Zaloguj się aby je zapisać.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-3">
          <Button asChild>
            <a href="/auth/login?redirectTo=/generate">Zaloguj się</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/auth/register?redirectTo=/generate">Zarejestruj się</a>
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Kontynuuj bez zapisywania
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Krok 4: RequireAuth Utility

```typescript
// src/lib/utils/auth.ts - rozszerzenie
export async function requireAuth(locals: App.Locals): Promise<{ user: User; userId: string } | { error: Response }> {
  const { user } = locals;

  if (!user) {
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

  return { user, userId: user.id };
}
```

---

## 🎯 Priorytety wdrożenia:

### Natychmiastowe (kolejny krok):

1. **Forgot/Reset Password** - krytyczne dla UX
2. **AuthButton/UserMenu** - zgodność z US-016 (przycisk w prawym górnym rogu)
3. **SavePromptModal** - kluczowa funkcja dla niezalogowanych (US-016)

### W ciągu tygodnia:

4. **requireAuth w flashcards API** - zabezpieczenie istniejących funkcji
5. **Session management** - stabilność auth
6. **RLS policies update** - bezpieczeństwo danych

### Długoterminowe:

7. **Account management** - usuwanie konta, zmiana hasła
8. **Monitoring i security** - production readiness
9. **Performance optimization** - user experience

---

## 🚨 Uwagi i ostrzeżenia:

### Breaking Changes:

- Po włączeniu RLS policies istniejące dane mogą być niedostępne
- Zmiana auth.ts z mock na real może zepsuć istniejące fiszki
- Middleware redirects mogą wpłynąć na dev workflow

### Rollback Plan:

- Feature flag `AUTH_ENABLED = false` w auth.ts
- Backup bazy przed migracją RLS
- Revert commits dla middleware i api changes

### Testing Strategy:

- Testuj każdą fazę z prawdziwymi danymi Supabase
- Sprawdź przepływy auth w incognito mode
- Testuj redirect flows i session persistence

---

## 📝 Checklist implementacji:

Przed oznaczeniem fazy jako kompletnej, sprawdź:

- [ ] Wszystkie endpoints zwracają poprawne status codes
- [ ] Error messages są user-friendly po polsku
- [ ] Redirects działają poprawnie
- [ ] Session jest correctly persistowana
- [ ] UI jest responsive na mobile
- [ ] Loading states są wyświetlane
- [ ] Accessibility (aria-labels, focus management)
- [ ] Security headers i validation
- [ ] TypeScript types są kompletne
- [ ] Linter nie zgłasza błędów

**Status:** ✅ Faza 1 ukończona, gotowa do Fazy 2
