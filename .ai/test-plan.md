# Plan Testów dla Projektu 10xCards

## 1. Wprowadzenie i Cele Testowania

### 1.1 Przegląd Projektu

10xCards to aplikacja webowa do generowania i zarządzania fiszkami edukacyjnymi wykorzystująca sztuczną inteligencję i algorytmy powtórzeń rozłożonych w czasie. Aplikacja umożliwia użytkownikom automatyczne tworzenie fiszek na podstawie wprowadzonego tekstu, ich edycję, oraz systematyczną naukę z wykorzystaniem algorytmu spaced repetition.

### 1.2 Cele Testowania

- **Zapewnienie jakości** wszystkich kluczowych funkcjonalności aplikacji
- **Weryfikacja bezpieczeństwa** systemu autentykacji i autoryzacji
- **Walidacja integracji** z zewnętrznymi usługami (Supabase, OpenRouter.ai)
- **Potwierdzenie wydajności** podczas generowania fiszek przez AI
- **Sprawdzenie użyteczności** interfejsu użytkownika na różnych urządzeniach
- **Zapewnienie niezawodności** mechanizmów retry i circuit-breaker

## 2. Zakres Testów

### 2.1 Funkcjonalności w Zakresie Testów

- System autentykacji i autoryzacji użytkowników
- Generowanie fiszek przez AI z obsługą błędów
- Operacje CRUD na fiszkach (tworzenie, odczytywanie, aktualizacja, usuwanie)
- Operacje grupowe (bulk operations)
- System filtrowania i wyszukiwania fiszek
- Statystyki użytkownika i analityka
- Interfejs użytkownika i responsywność
- Integracja z bazą danych Supabase
- Mechanizmy resilience (retry, circuit-breaker)

### 2.2 Funkcjonalności Poza Zakresem Testów

- Testy wydajnościowe pod ekstremalnymi obciążeniami
- Testy bezpieczeństwa penetracyjne
- Testy kompatybilności z starszymi przeglądarkami (< 2 lata)
- Testy algorytmu spaced repetition (zakładamy poprawność biblioteki ts-fsrs)

## 3. Typy Testów do Przeprowadzenia

### 3.1 Testy Jednostkowe (Unit Tests)

**Priorytet: WYSOKI**

**Obszary testowania:**

- Walidacja schematów Zod w `src/lib/validation/`
- Logika biznesowa w serwisach (`FlashcardService`, `AiService`)
- Funkcje utilities w `src/lib/utils/`
- Komponenty React w izolacji
- Circuit breaker i retry manager

**Narzędzia:** Vitest, React Testing Library
**Pokrycie:** Min. 80% dla logiki biznesowej

### 3.2 Testy Integracyjne (Integration Tests)

**Priorytet: WYSOKI**

**Obszary testowania:**

- Integracja z bazą danych Supabase
- API endpoints (`/api/flashcards/*`, `/api/auth/*`)
- Przepływ autentykacji z Supabase Auth
- Integracja z OpenRouter.ai
- Komunikacja między komponentami React

**Scenariusze kluczowe:**

- Pełny cykl tworzenia i zapisu fiszek
- Generowanie fiszek przez AI z retry
- Operacje bulk na fiszkach
- Flow logowania i rejestracji

### 3.3 Testy End-to-End (E2E)

**Priorytet: ŚREDNI**

**Scenariusze użytkownika:**

- Rejestracja → Logowanie → Generowanie fiszek → Zapis
- Zarządzanie istniejącymi fiszkami (edycja, usuwanie)
- Wykonywanie operacji grupowych
- Filtrowanie i wyszukiwanie fiszek
- Sesja nauki z fiszkami

**Narzędzia:** Playwright lub Cypress

### 3.4 Testy Wydajnościowe (Performance Tests)

**Priorytet: ŚREDNI**

**Obszary testowania:**

- Czas odpowiedzi API endpoints
- Wydajność generowania fiszek przez AI
- Czas ładowania strony
- Responsywność interfejsu podczas operacji bulk
- Optimistic updates w UI

**Kryteria akceptacji:**

- API response time < 500ms (bez AI)
- AI generation time < 30s
- Page load time < 3s
- UI response time < 100ms

### 3.5 Testy Bezpieczeństwa (Security Tests)

**Priorytet: WYSOKI**

**Obszary testowania:**

- Row Level Security (RLS) w Supabase
- Walidacja danych wejściowych
- Autoryzacja dostępu do zasobów
- Ochrona przed atakami XSS/CSRF
- Bezpieczeństwo API endpoints

### 3.6 Testy Kompatybilności (Compatibility Tests)

**Priorytet: NISKI**

**Przeglądarki:**

- Chrome (latest, latest-1)
- Firefox (latest, latest-1)
- Safari (latest, latest-1)
- Edge (latest, latest-1)

**Urządzenia:**

- Desktop (1920x1080, 1366x768)
- Tablet (768x1024)
- Mobile (375x667, 414x896)

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1 System Autentykacji

#### Test Case: AUTH-001 - Rejestracja Użytkownika

**Warunki wstępne:** Użytkownik nie ma konta
**Kroki:**

1. Przejdź do `/auth/register`
2. Wprowadź prawidłowy email i hasło (min. 8 znaków)
3. Potwierdź hasło
4. Kliknij "Zarejestruj się"
   **Oczekiwany rezultat:**

- Konto zostaje utworzone
- Użytkownik zostaje przekierowany do `/dashboard`
- Session cookie zostaje ustawiony

#### Test Case: AUTH-002 - Logowanie

**Warunki wstępne:** Użytkownik ma aktywne konto
**Kroki:**

1. Przejdź do `/auth/login`
2. Wprowadź prawidłowy email i hasło
3. Kliknij "Zaloguj się"
   **Oczekiwany rezultat:**

- Użytkownik zostaje zalogowany
- Przekierowanie do `/dashboard`
- Middleware ustawia `locals.user`

#### Test Case: AUTH-003 - Autoryzacja API

**Warunki wstępne:** Endpoint wymaga autoryzacji
**Kroki:**

1. Wykonaj request do `/api/flashcards` bez tokenu
2. Wykonaj request z nieprawidłowym tokenem
3. Wykonaj request z prawidłowym tokenem
   **Oczekiwany rezultat:**

- 401 Unauthorized dla kroków 1-2
- 200 OK z danymi dla kroku 3

### 4.2 Generowanie Fiszek przez AI

#### Test Case: AI-001 - Pomyślne Generowanie

**Warunki wstępne:** OpenRouter.ai jest dostępny
**Kroki:**

1. Przejdź do `/generate`
2. Wprowadź tekst (1000-10000 znaków)
3. Kliknij "Generuj fiszki"
4. Poczekaj na rezultat
   **Oczekiwany rezultat:**

- Loading state jest wyświetlany
- Kandydaci fiszek są wygenerowani
- Metadata zawiera informacje o procesie

#### Test Case: AI-002 - Obsługa Błędów z Retry

**Warunki wstępne:** OpenRouter.ai zwraca błąd 429 (rate limit)
**Kroki:**

1. Symuluj rate limit error
2. Sprawdź mechanizm retry
   **Oczekiwany rezultat:**

- Mechanizm retry aktywuje się
- Exponential backoff jest stosowany
- Po wyczerpaniu prób, błąd jest zwracany

#### Test Case: AI-003 - Circuit Breaker

**Warunki wstępne:** Wysokie wskaźniki błędów
**Kroki:**

1. Symuluj serię błędów przekraczającą threshold
2. Wykonaj kolejne żądanie
   **Oczekiwany rezultat:**

- Circuit breaker otwiera się
- Kolejne żądania są odrzucane
- Po timeout circuit breaker przechodzi w half-open

### 4.3 Zarządzanie Fiszkami

#### Test Case: FLASH-001 - Tworzenie Fiszki

**Warunki wstępne:** Użytkownik jest zalogowany
**Kroki:**

1. Przejdź do `/flashcards`
2. Kliknij "Utwórz fiszkę"
3. Wprowadź front_text i back_text
4. Wybierz source jako "manual"
5. Zapisz fiszkę
   **Oczekiwany rezultat:**

- Fiszka zostaje zapisana w bazie
- Appears w liście użytkownika
- Hash'e treści są wygenerowane

#### Test Case: FLASH-002 - Operacje Bulk

**Warunki wstępne:** Użytkownik ma ≥5 fiszek
**Kroki:**

1. Zaznacz kilka fiszek
2. Wybierz "Usuń zaznaczone"
3. Potwierdź akcję
   **Oczekiwany rezultat:**

- Soft delete wykonany na zaznaczonych fiszkach
- Fiszki znikają z listy
- Partial success handling w przypadku błędów

#### Test Case: FLASH-003 - Filtrowanie i Wyszukiwanie

**Warunki wstępne:** Baza zawiera fiszki z różnymi źródłami
**Kroki:**

1. Zastosuj filtr `source=ai-full`
2. Wprowadź tekst w wyszukiwarkę
3. Ustaw zakres dat
   **Oczekiwany rezultat:**

- Lista jest filtrowana według kryteriów
- Full-text search działa poprawnie
- Paginacja jest zachowana

### 4.4 Interfejs Użytkownika

#### Test Case: UI-001 - Responsywność

**Warunki wstępne:** Aplikacja uruchomiona w przeglądarce
**Kroki:**

1. Testuj na rozdzielczościach: 320px, 768px, 1024px, 1920px
2. Sprawdź nawigację mobilną
3. Testuj modali na małych ekranach
   **Oczekiwany rezultat:**

- Layout adaptuje się do rozmiaru ekranu
- Wszystkie elementy są dostępne
- Navigation collapse działa poprawnie

#### Test Case: UI-002 - Dostępność (a11y)

**Warunki wstępne:** Screen reader symulator
**Kroki:**

1. Nawiguj używając tylko klawiatury
2. Sprawdź kontrast kolorów
3. Testuj z screen readerem
   **Oczekiwany rezultat:**

- Focus order jest logiczny
- ARIA labels są obecne
- Kontrast spełnia WCAG 2.1 AA

## 5. Środowisko Testowe

### 5.1 Środowiska

- **Development:** Lokalne środowisko developerskie
- **Staging:** Środowisko podobne do produkcyjnego
- **Testing:** Dedykowane środowisko dla automatycznych testów

### 5.2 Konfiguracja Bazy Danych

- **Test Database:** Oddzielna instancja Supabase dla testów
- **Migration Scripts:** Automatyczne setup/teardown
- **Test Data:** Deterministyczne dane testowe

### 5.3 Mock'i i Stub'y

- **OpenRouter.ai:** Mock service dla testów offline
- **Supabase Auth:** Test user credentials
- **External APIs:** Stub responses dla konsystentnych testów

## 6. Narzędzia do Testowania

### 6.1 Narzędzia Framework'owe

- **Vitest:** Test runner dla unit/integration tests
- **React Testing Library:** Testowanie komponentów React
- **Playwright:** E2E testing automation
- **MSW (Mock Service Worker):** API mocking

### 6.2 Narzędzia Wspomagające

- **ESLint + Prettier:** Code quality
- **TypeScript:** Type safety
- **Husky:** Pre-commit hooks z testami
- **Github Actions:** CI/CD pipeline

### 6.3 Narzędzia Monitoringu

- **Console logging:** OpenRouter service metrics
- **Performance Observer:** Client-side performance
- **Sentry (opcjonalnie):** Error tracking

## 7. Harmonogram Testów

### 7.1 Faza 1: Przygotowanie (1 tydzień)

- Setup narzędzi testowych
- Konfiguracja środowisk testowych
- Przygotowanie danych testowych
- Implementacja podstawowych unit testów

### 7.2 Faza 2: Testy Funkcjonalne (2 tygodnie)

- **Tydzień 1:** Unit tests + Integration tests
- **Tydzień 2:** E2E scenarios + API testing

### 7.3 Faza 3: Testy Niefunkcjonalne (1 tydzień)

- Performance testing
- Security testing
- Compatibility testing
- Accessibility testing

### 7.4 Faza 4: Regresja i Finalizacja (0.5 tygodnia)

- Regression test suite
- Bug fixes verification
- Test documentation update

## 8. Kryteria Akceptacji Testów

### 8.1 Kryteria Ilościowe

- **Unit Tests:** ≥80% code coverage
- **Integration Tests:** Wszystkie krytyczne scenariusze pokryte
- **E2E Tests:** Główne user journeys zautomatyzowane
- **Bug Rate:** ≤2 critical bugs w produkcie finalnym

### 8.2 Kryteria Jakościowe

- Wszystkie testy są deterministyczne (no flaky tests)
- Testy wykonują się w <5 minut (CI pipeline)
- Documentation testów jest complete i aktualna
- Error messages są jasne i actionable

### 8.3 Kryteria Bezpieczeństwa

- Brak exposed secrets w kodzie
- RLS policies działają poprawnie
- Input validation zabezpiecza przed atakami
- Authentication flows są secure

### 8.4 Kryteria Wydajnościowe

- API endpoints: <500ms response time
- Page loads: <3s initial load
- AI generation: <30s completion time
- Mobile performance: >90 Lighthouse score

## 9. Role i Odpowiedzialności w Procesie Testowania

### 9.1 QA Engineer

- **Odpowiedzialności:**
  - Planowanie strategii testów
  - Implementacja test automation
  - Wykonywanie manual testing
  - Bug reporting i tracking
  - Test environment maintenance

### 9.2 Frontend Developer

- **Odpowiedzialności:**
  - Unit tests dla komponentów React
  - Integration tests dla UI flows
  - Accessibility testing
  - Performance optimization

### 9.3 Backend Developer

- **Odpowiedzialności:**
  - API endpoint testing
  - Database integration tests
  - Security testing współpraca
  - Service layer unit tests

### 9.4 DevOps Engineer

- **Odpowiedzialności:**
  - CI/CD pipeline setup
  - Test environment provisioning
  - Monitoring i metrics setup
  - Deployment testing automation

### 9.5 Product Owner

- **Odpowiedzialności:**
  - User acceptance criteria definition
  - Business logic validation
  - End-user testing coordination
  - Release decision making

## 10. Procedury Raportowania Błędów

### 10.1 Kategoryzacja Błędów

#### Krytyczne (Critical)

- Aplikacja nie startuje
- Security vulnerabilities
- Data corruption/loss
- Complete feature breakdown

#### Wysokie (High)

- Major funkcjonalność nie działa
- Performance issues (>2x slower)
- UI completely broken
- API returns wrong data

#### Średnie (Medium)

- Minor funkcjonalność nie działa
- UI display issues
- Inconvenient user experience
- Non-critical performance issues

#### Niskie (Low)

- Cosmetic issues
- Minor typos
- Enhancement suggestions
- Non-essential feature glitches

### 10.2 Format Raportu Błędu

```markdown
## Bug Report: [CATEGORY-ID] Brief Description

**Severity:** Critical/High/Medium/Low
**Environment:** Development/Staging/Production
**Browser:** Chrome 120.0 / Firefox 121.0 / etc.
**User Type:** Anonymous/Authenticated

### Steps to Reproduce:

1. Navigate to...
2. Click on...
3. Enter data...
4. Observe...

### Expected Result:

What should happen...

### Actual Result:

What actually happens...

### Additional Information:

- Screenshots/videos
- Console errors
- Network requests
- Environment details

### Workaround:

If any temporary solution exists...
```

### 10.3 Workflow Raportowania

1. **Bug Discovery** → Reproduce i verify
2. **Initial Report** → Create ticket w appropriate severity
3. **Triage** → Product Owner/Tech Lead assignment
4. **Investigation** → Developer analysis
5. **Fix Implementation** → Code changes
6. **Verification** → QA re-testing
7. **Closure** → Stakeholder approval

### 10.4 Komunikacja i Tracking

- **Bug Tracking Tool:** GitHub Issues z labels
- **Communication:** Slack channel #10xcards-bugs
- **SLA:** Critical bugs ≤24h, High ≤72h, Medium ≤1 week
- **Reporting:** Weekly bug status w team meetings

---

## Podsumowanie

Ten plan testów został zaprojektowany specjalnie dla aplikacji 10xCards, uwzględniając jej hybrydową architekturę Astro/React, integrację z zewnętrznymi serwisami AI, oraz krytyczne aspekty bezpieczeństwa i wydajności. Plan kładzie nacisk na automatyzację testów przy zachowaniu równowagi między pokryciem testami a efektywnością czasową wykonania.

Kluczowe aspekty planu to szczególna uwaga na:

- **Resilience testing** mechanizmów retry i circuit-breaker
- **Security testing** systemu RLS i autoryzacji
- **Integration testing** z krytycznymi zewnętrznymi serwisami
- **Performance testing** generowania AI i responsywności UI
- **Accessibility compliance** zgodnie z najlepszymi praktykami

Plan będzie ewoluować wraz z rozwojem aplikacji i może być dostosowywany w oparciu o feedback z pierwszych iteracji testowania.
