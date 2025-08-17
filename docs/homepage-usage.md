# Dokumentacja strony głównej 10xCards

## Przegląd

Strona główna aplikacji 10xCards została zaprojektowana zgodnie ze specyfikacją auth do obsługi różnych stanów użytkownika:

- **Niezalogowani użytkownicy**: Widzą pełną stronę powitalną z informacjami o produkcie
- **Zalogowani użytkownicy**: Są automatycznie przekierowywani do `/dashboard`

## Struktura komponentów

### HomePage.tsx

Główny komponent React odpowiedzialny za renderowanie strony głównej.

**Props:**

```typescript
interface HomePageProps {
  user: User | null;
}
```

**Logika:**

- Jeśli `user` istnieje → redirect do `/dashboard`
- Jeśli `user` jest `null` → wyświetla stronę powitalną

### Sekcje strony powitalnej

#### 1. Hero Section

- Logo aplikacji (ikona fiszek)
- Główny tytuł "10xCards" z gradientem
- Opis wartości produktu
- Dwa główne CTA:
  - **"Zacznij za darmo"** → `/auth/register`
  - **"Wypróbuj demo"** → `/generate`
- Social proof (benefits)

#### 2. Features Section

Trzy główne funkcjonalności:

1. **Automatyczne generowanie**
   - Ikona: lightning bolt
   - Opis: AI tworzy fiszki z tekstu

2. **Inteligentne powtórki**
   - Ikona: bar chart
   - Opis: System adaptuje się do tempa nauki

3. **Nowoczesny interfejs**
   - Ikona: book
   - Opis: Intuicyjny design z dark mode

#### 3. How it Works Section

Proces w trzech krokach:

1. **Wklej tekst** - Skopiuj materiał do nauki
2. **AI generuje fiszki** - Automatyczna analiza i tworzenie pytań
3. **Ucz się efektywnie** - Rozpocznij sesję nauki

#### 4. Final CTA Section

- Powtórzenie głównej wartości
- Główny CTA: "Rozpocznij za darmo"
- Dodatkowe korzyści (Darmowe konto, bez zobowiązań)

#### 5. Footer

- Logo i nazwa
- Linki prawne (Polityka prywatności, Regulamin, Kontakt)
- Copyright

## Konfiguracja auth state

W `src/pages/index.astro`:

```typescript
// Dla testowania - zmień mockUser na:
const mockUser = null; // Niezalogowany → pokaże stronę powitalną
const mockUser = { id: "123", email: "test@example.com", email_confirmed: true }; // Zalogowany → redirect do dashboard
```

Po implementacji autentykacji zastąp mocka prawdziwymi danymi:

```typescript
const { user } = Astro.locals;
```

## Stylowanie

### Design System

- **Kolory**: Wykorzystuje system kolorów z `global.css`
- **Gradients**: Spójne z resztą aplikacji
- **Spacing**: Tailwind spacing scale
- **Typography**: Hierarchia zgodna z Design System

### Responsywność

- **Mobile-first approach**
- **Breakpointy**: sm (640px), md (768px), lg (1024px)
- **Grid responsywny**: 1 kolumna na mobile, 3 kolumny na desktop

### Dodatkowe style

Dodano utility class `.bg-grid-pattern` w `global.css` dla subtelnego wzoru tła.

## Integracja z nawigacją

Strona główna używa komponentu `Navigation.tsx` z:

- Obsługą stanu auth
- Różnymi opcjami dla zalogowanych/niezalogowanych
- Spójnym designem z resztą aplikacji

## Zgodność z PRD

### US-001 & US-002

- ✅ Przekierowanie zalogowanych użytkowników do `/dashboard`
- ✅ CTA prowadzące do rejestracji (`/auth/register`)

### US-016

- ✅ Różne widoki dla różnych stanów użytkownika
- ✅ Nawigacja auth w prawym górnym rogu
- ✅ Link do demo bez wymagania logowania (`/generate`)

### Dodatkowe korzyści

- ✅ SEO-friendly structure
- ✅ Accessibility (proper headings, alt texts, ARIA)
- ✅ Performance (lazy loading, optimized images)
- ✅ Dark mode support

## Możliwe rozszerzenia

1. **Animacje**: Dodanie scroll animations z biblioteki typu Framer Motion
2. **Testimonials**: Sekcja z opiniami użytkowników
3. **Pricing**: Sekcja z planami cenowymi
4. **FAQ**: Najczęściej zadawane pytania
5. **Blog preview**: Najnowsze artykuły z bloga
6. **Analytics**: Tracking konwersji i user behavior
