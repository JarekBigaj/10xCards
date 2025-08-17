# Architektura UI dla 10xCards

## 1. Przegląd struktury UI

Aplikacja 10xCards wykorzystuje architekturę opartą na komponentach z Astro 5 jako główną platformą i React 19 do interaktywnych elementów. Struktura UI została zaprojektowana z podejściem mobile-first, wykorzystując top navigation jako główny element nawigacyjny i dashboard jako centrum kontroli użytkownika.

Kluczowe założenia architektoniczne:

- **Responsive Design**: Mobile-first z breakpointami 640px (sm), 768px (md), 1024px (lg)
- **Nawigacja**: Top navigation bar z collapse menu na urządzeniach mobilnych
- **Layout Pattern**: Dashboard-centric z kafelkami nawigacyjnymi
- **State Management**: Zustand dla globalnego stanu + session storage dla kandydatów AI
- **Routing**: REST-like URLs dla intuicyjnej nawigacji
- **UI Framework**: Shadcn/ui z Tailwind 4 dla spójnego design systemu

## 2. Lista widoków

### 2.1 Widok Uwierzytelniania

- **Ścieżka**: `/auth/login`, `/auth/register`
- **Główny cel**: Bezpieczne uwierzytelnianie użytkowników
- **Kluczowe informacje**: Formularz logowania/rejestracji, walidacja danych
- **Kluczowe komponenty**:
  - AuthForm z React Hook Form + Zod validation
  - PasswordStrength indicator
  - SocialLogin buttons (przyszły rozwój)
  - ErrorMessage component
- **UX/Dostępność/Bezpieczeństwo**:
  - ARIA labels dla screen readers
  - Focus management i keyboard navigation
  - Secure password requirements
  - Rate limiting feedback
  - Clear error messaging

### 2.2 Dashboard (Centrum nawigacji)

- **Ścieżka**: `/dashboard`
- **Główny cel**: Centralne miejsce nawigacji i przegląd statusu
- **Kluczowe informacje**: Podsumowanie aktywności, szybki dostęp do funkcji
- **Kluczowe komponenty**:
  - NavigationTiles grid (responsive)
  - UserStats summary cards
  - QuickActions buttons
  - RecentActivity feed
- **UX/Dostępność/Bezpieczeństwo**:
  - Keyboard navigation między kafelkami
  - Focus indicators
  - Loading states dla statystyk
  - Touch-friendly spacing na mobile

### 2.3 Generowanie AI (Wieloetapowy przepływ)

- **Ścieżka**: `/generate`
- **Główny cel**: Generowanie fiszek z tekstu użytkownika przy użyciu AI
- **Kluczowe informacje**: Input text, progress, wyniki generowania, akcje
- **Kluczowe komponenty**:
  - **Etap 1 - Input**:
    - TextInput z licznikiem znaków (1000-10000)
    - RealTimeValidation
    - GenerateButton z loading state
  - **Etap 2 - Loading**:
    - ProgressIndicator z retry counter
    - SkeletonLoader dla wyników
    - CancelButton (opcjonalny)
  - **Etap 3 - Results**:
    - CandidatesTable z inline editing
    - BulkActions (Accept All, Reject All)
    - UnsavedBadge indicators
  - **Etap 4 - Actions**:
    - SaveSelected button
    - BackToDashboard navigation
- **UX/Dostępność/Bezpieczeństwo**:
  - Validation w real-time z debouncing
  - Error recovery z retry mechanism
  - Session storage persistence
  - Progress feedback dla długotrwałych operacji
  - Accessible table z proper headers

### 2.4 Moje fiszki

- **Ścieżka**: `/cards`
- **Główny cel**: Przeglądanie, edycja i zarządzanie wszystkimi fiszkami
- **Kluczowe informacje**: Lista fiszek, filtry, opcje zarządzania
- **Kluczowe komponenty**:
  - FlashcardsTable z paginacją
  - FilterBar (source, due date, difficulty)
  - SearchInput (przyszły rozwój)
  - BulkActions dla zaznaczonych elementów
  - EditModal (responsive - fullscreen na mobile)
  - DeleteConfirmation dialog
  - CreateManualCard button + form
- **UX/Dostępność/Bezpieczeństwo**:
  - Classic pagination z Previous/Next
  - Sortowanie kolumn
  - Confirmation dialogs dla destructive actions
  - Inline editing z validation
  - Modal accessibility (focus trap, escape handling)

### 2.5 Sesja nauki

- **Ścieżka**: `/study`
- **Główny cel**: Interaktywne uczenie się z algorytmem spaced repetition
- **Kluczowe informacje**: Aktualna fiszka, progress, rating options
- **Kluczowe komponenty**:
  - StudyCard (front/back flip animation)
  - ProgressBar (current/total format)
  - RatingButtons (Again, Hard, Good, Easy) z color coding
  - SessionStats (time spent, cards reviewed)
  - ShowAnswer button
  - EndSession dialog
- **UX/Dostępność/Bezpieczeństwo**:
  - Keyboard shortcuts (Space = flip, 1-4 = rating)
  - Clear visual hierarchy
  - Progress feedback
  - Session persistence
  - Accessible card flipping

### 2.6 Harmonogram powtórek

- **Ścieżka**: `/schedule`
- **Główny cel**: Przegląd nadchodzących powtórek w formacie kalendarza
- **Kluczowe informacje**: Kalendarz z oznaczonymi datami, liczba fiszek do powtórek
- **Kluczowe komponenty**:
  - CalendarView z highlighted dates
  - DayTooltips z liczbą fiszek
  - MonthNavigation
  - UpcomingReviews list
  - StartStudySession button
- **UX/Dostępność/Bezpieczeństwo**:
  - Keyboard navigation w kalendarzu
  - Screen reader support dla dat
  - Color coding z tekstowymi alternatywami
  - Touch-friendly na mobile

### 2.7 Profil użytkownika

- **Ścieżka**: `/profile`
- **Główny cel**: Zarządzanie kontem i przegląd statystyk
- **Kluczowe informacje**: Dane konta, statystyki użytkowania, opcje zarządzania
- **Kluczowe komponenty**:
  - UserInfo display (email, join date)
  - UserStats dashboard (total cards, sources breakdown)
  - AccountActions (change password, delete account)
  - DataExport options (RODO compliance)
  - DeleteAccount confirmation flow
- **UX/Dostępność/Bezpieczeństwo**:
  - Strong confirmation dla account deletion
  - Clear data export process
  - Privacy-focused design
  - Secure password update flow

### 2.8 Tworzenie fiszki (Modal/Page)

- **Ścieżka**: `/cards/new` lub modal overlay
- **Główny cel**: Ręczne tworzenie nowej fiszki
- **Kluczowe informacje**: Formularz z polami front/back, walidacja
- **Kluczowe komponenty**:
  - CreateFlashcardForm
  - CharacterCount indicators
  - PreviewMode toggle
  - SourceTracker (manual)
- **UX/Dostępność/Bezpieczeństwo**:
  - Real-time validation
  - Character limits enforcement
  - Form accessibility
  - Auto-save draft (opcjonalny)

## 3. Mapa podróży użytkownika

### 3.1 Główny przepływ - Generowanie fiszek AI

**Nowy użytkownik:**

1. **Landing** → `/auth/register` → `/auth/login`
2. **Dashboard** (`/dashboard`) - pierwszy kontakt z aplikacją
3. **Wybór "Generuj fiszki"** → `/generate`
4. **Input tekstu** (1000-10000 znaków) + walidacja
5. **Kliknięcie "Generuj"** → Loading state z progress
6. **Przegląd kandydatów** → Tabela z inline editing
7. **Akceptacja/Edycja** → Unsaved badges, bulk actions
8. **Zapis fiszek** → Success toast, redirect options
9. **Opcje dalsze**:
   - Powrót do Dashboard
   - Przejście do Study Session
   - Przeglądanie Moich fiszek

**Powracający użytkownik:**

1. **Login** (`/auth/login`) → **Dashboard** (`/dashboard`)
2. **Szybki dostęp**:
   - Study Session (`/study`) - kontynuacja nauki
   - Schedule (`/schedule`) - sprawdzenie nadchodzących powtórek
   - My Cards (`/cards`) - zarządzanie kolekcją

### 3.2 Przepływ sesji nauki

1. **Start sesji** z Dashboard lub Schedule
2. **Study Session** (`/study`):
   - Prezentacja front karty
   - "Show Answer" → back karty
   - Rating (Again/Hard/Good/Easy)
   - Progress update + next card
3. **Zakończenie sesji** → Stats summary + return options

### 3.3 Przepływ zarządzania fiszkami

1. **My Cards** (`/cards`) → Lista wszystkich fiszek
2. **Akcje na fiszce**:
   - **Edit** → Modal z formularzem
   - **Delete** → Confirmation dialog
   - **Study** → Redirect to study session
3. **Bulk operations** → Multiple selection + actions
4. **Manual creation** → `/cards/new` lub modal

## 4. Układ i struktura nawigacji

### 4.1 Top Navigation (Desktop)

```
[Logo] [Dashboard] [Generate] [My Cards] [Study] [Schedule] | [User Menu▼]
```

**Elementy nawigacji:**

- **Logo** (po lewej) - link do Dashboard
- **Primary Menu** (centrum): Dashboard, Generate, My Cards, Study, Schedule
- **User Menu** (po prawej): Profile, Logout

### 4.2 Mobile Navigation (Hamburger Menu)

```
[☰] [Logo] [User Avatar]
```

**Collapse Menu Overlay:**

- Dashboard
- Generate AI Cards
- My Cards (with counter badge)
- Study Session (with due count)
- Schedule
- ***
- Profile
- Settings
- Logout

### 4.3 Navigation States i Indicators

- **Active State**: Wyróżnienie aktualnej strony
- **Badge Counters**: Due cards, unsaved candidates
- **Loading States**: Skeleton UI dla menu items z dynamic content
- **Breadcrumbs**: Dla głębszych widoków (np. Edit Card)

### 4.4 Responsive Behavior

- **Desktop (≥1024px)**: Full horizontal menu
- **Tablet (768-1023px)**: Condensed menu z ikonami
- **Mobile (≤767px)**: Hamburger menu z full overlay

## 5. Kluczowe komponenty

### 5.1 Layout Components

- **AppShell**: Główny wrapper z navigation
- **TopNavigation**: Sticky header z responsive menu
- **MobileMenu**: Hamburger overlay z transition animations
- **PageContainer**: Consistent padding i max-width
- **Dashboard**: Grid layout z responsive tiles

### 5.2 Form Components

- **FormField**: Wrapper z label, input, error message
- **TextInput**: Z character counting i validation
- **TextArea**: Dla długich tekstów z auto-resize
- **ValidationMessage**: Consistent error display
- **SubmitButton**: Z loading states

### 5.3 Data Display Components

- **FlashcardsTable**: Sortable, paginated z inline editing
- **CandidatesTable**: Specialized dla AI results
- **StudyCard**: Flip animation z front/back views
- **StatsCard**: Dashboard statistics display
- **CalendarView**: Schedule z highlighted dates
- **ProgressBar**: Dla study sessions i długotrwałych operacji

### 5.4 Interactive Components

- **Modal**: Responsive (dialog/fullscreen) z accessibility
- **Toast**: Bottom-right notifications z stacking
- **ConfirmationDialog**: Dla destructive actions
- **DropdownMenu**: User menu i context actions
- **RatingButtons**: Color-coded dla spaced repetition
- **BulkActions**: Multi-select operations

### 5.5 Utility Components

- **LoadingSpinner**: Dla async operations
- **SkeletonLoader**: Graceful loading states
- **ErrorBoundary**: Graceful error handling
- **EmptyState**: Dla pustych list z call-to-action
- **Badge**: Status indicators (unsaved, due count)

### 5.6 Accessibility Components

- **FocusTrap**: Dla modali i dropdown menus
- **SkipLink**: Navigation bypass dla screen readers
- **VisuallyHidden**: Screen reader only content
- **LiveRegion**: Dynamic content announcements

### 5.7 State Management Patterns

- **Global State (Zustand)**:
  - User authentication status
  - UI preferences (theme, language)
  - Current study session state
  - Navigation state (mobile menu open/closed)

- **Local State (React)**:
  - Form inputs i validation
  - Table sorting i filtering
  - Modal open/closed states
  - Loading i error states

- **Session Storage**:
  - AI candidates persistence
  - Form drafts
  - Study session progress backup

### 5.8 Error Handling Strategy

- **Network Errors**: Toast notifications z retry options
- **Validation Errors**: Inline form feedback
- **API Errors**: Contextual error messages z error codes
- **Boundary Errors**: Graceful fallback UI z report options
- **Loading Timeouts**: Circuit breaker feedback z manual retry
