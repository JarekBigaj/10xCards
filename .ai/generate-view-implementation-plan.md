# Plan implementacji widoku Generowanie fiszek AI

## 1. Przegląd

Widok "Generowanie fiszek AI" umożliwia użytkownikom wklejenie tekstu (1000-10000 znaków) i automatyczne wygenerowanie kandydatów na fiszki przy użyciu sztucznej inteligencji. Widok obsługuje wieloetapowy przepływ: wprowadzenie tekstu, generowanie z progress indicator, przegląd i edycję kandydatów, oraz zapis zaakceptowanych fiszek. Kluczowe funkcje to real-time walidacja, mechanizm retry z exponential backoff, inline editing kandydatów, modal dla długich treści, bulk actions oraz persistence w session storage.

## 2. Routing widoku

**Ścieżka**: `/generate`  
**Typ**: Chroniona strona wymagająca uwierzytelnienia  
**Layout**: Główny layout aplikacji z nawigacją

## 3. Struktura komponentów

```
GenerateView (główny kontener)
├── TextInputSection
│   ├── TextAreaInput
│   ├── CharacterCounter
│   ├── ValidationMessage
│   └── GenerateButton
├── LoadingSection
│   ├── ProgressIndicator
│   └── CancelButton (opcjonalny)
├── ResultsSection
│   ├── ResultsHeader
│   ├── BulkActionsBar
│   ├── CandidatesTable
│   │   └── CandidateRow[] (dla każdego kandydata)
│   └── SaveSelectedButton
├── EditCandidateModal
└── ErrorBoundary
    └── ErrorDisplay
```

## 4. Szczegóły komponentów

### GenerateView

- **Opis**: Główny kontener widoku zarządzający całym przepływem generowania fiszek
- **Główne elementy**: Sekcje dla input, loading, results oraz modali
- **Obsługiwane interakcje**: Zarządzanie przejściami między etapami, obsługa błędów globalnych
- **Obsługiwana walidacja**: Koordynacja walidacji między komponentami
- **Typy**: `GenerateViewState`, `GenerationPhase`
- **Propsy**: Brak (główny widok)

### TextInputSection

- **Opis**: Sekcja zawierająca pole tekstowe z walidacją i przycisk generowania
- **Główne elementy**: Textarea, licznik znaków, komunikaty walidacji, przycisk generuj
- **Obsługiwane interakcje**: Wpisywanie tekstu, walidacja real-time, trigger generowania
- **Obsługiwana walidacja**: Długość tekstu (1000-10000 znaków), debounced validation
- **Typy**: `TextInputProps`, `ValidationState`
- **Propsy**: `value`, `onChange`, `onGenerate`, `isGenerating`, `validationErrors`

### TextAreaInput

- **Opis**: Pole tekstowe z auto-resize i licznikiem znaków
- **Główne elementy**: Textarea HTML element z Tailwind styling
- **Obsługiwane interakcje**: Wpisywanie tekstu, paste, focus/blur
- **Obsługiwana walidacja**: Min/max długość znaków, real-time feedback
- **Typy**: `TextAreaInputProps`
- **Propsy**: `value`, `onChange`, `placeholder`, `minLength`, `maxLength`, `disabled`

### CharacterCounter

- **Opis**: Wyświetla aktualną liczbę znaków z kolorową sygnalizacją
- **Główne elementy**: Span z dynamicznym kolorem (red/yellow/green)
- **Obsługiwane interakcje**: Wizualna sygnalizacja statusu
- **Obsługiwana walidacja**: Kolorowanie based on thresholds
- **Typy**: `CharacterCounterProps`
- **Propsy**: `current`, `min`, `max`

### GenerateButton

- **Opis**: Przycisk uruchamiający generowanie z loading state
- **Główne elementy**: Button z ikoną loading spinner
- **Obsługiwane interakcje**: Click to generate, disabled podczas loading
- **Obsługiwana walidacja**: Disabled jeśli tekst nie spełnia wymagań
- **Typy**: `GenerateButtonProps`
- **Propsy**: `onClick`, `isLoading`, `disabled`, `text`

### LoadingSection

- **Opis**: Sekcja wyświetlana podczas generowania z progress indicator
- **Główne elementy**: Progress bar, spinner, retry counter, status text
- **Obsługiwane interakcje**: Wyświetlanie postępu, opcjonalne anulowanie
- **Obsługiwana walidacja**: Brak
- **Typy**: `LoadingSectionProps`, `GenerationProgress`
- **Propsy**: `progress`, `retryCount`, `onCancel?`

### ProgressIndicator

- **Opis**: Wizualny wskaźnik postępu generowania
- **Główne elementy**: Progress bar, pulsing animation, status tekst
- **Obsługiwane interakcje**: Wyświetlanie progress i retry count
- **Obsługiwana walidacja**: Brak
- **Typy**: `ProgressIndicatorProps`
- **Propsy**: `progress`, `retryCount`, `status`

### ResultsSection

- **Opis**: Sekcja wyświetlająca wygenerowane kandydatów z actions
- **Główne elementy**: Header z statystykami, bulk actions, tabela kandydatów, save button
- **Obsługiwane interakcje**: Bulk operations, individual candidate actions
- **Obsługiwana walidacja**: Walidacja przed zapisem (min 1 zaakceptowany)
- **Typy**: `ResultsSectionProps`, `CandidateWithStatus[]`
- **Propsy**: `candidates`, `onCandidateUpdate`, `onBulkAction`, `onSave`

### CandidatesTable

- **Opis**: Responsywna tabela z listą kandydatów i inline editing
- **Główne elementy**: Table HTML z responsive design, sortowanie opcjonalne
- **Obsługiwane interakcje**: Inline editing, row actions, responsive collapse
- **Obsługiwana walidacja**: Real-time validation podczas edycji
- **Typy**: `CandidatesTableProps`, `CandidateWithStatus[]`
- **Propsy**: `candidates`, `onCandidateUpdate`, `onEdit`, `onToggleStatus`

### CandidateRow

- **Opis**: Wiersz tabeli reprezentujący pojedynczego kandydata
- **Główne elementy**: Cells z front/back text, confidence score, actions (edit, accept, reject)
- **Obsługiwane interakcje**: Inline editing, accept/reject toggle, open modal
- **Obsługiwana walidacja**: Front text max 200 chars, back text max 500 chars
- **Typy**: `CandidateRowProps`, `CandidateWithStatus`
- **Propsy**: `candidate`, `onUpdate`, `onEdit`, `onToggleStatus`

### BulkActionsBar

- **Opis**: Pasek z akcjami grupowymi dla kandydatów
- **Główne elementy**: Buttons dla Accept All, Reject All, Clear Selection
- **Obsługiwane interakcje**: Bulk accept/reject/clear operations
- **Obsługiwana walidacja**: Disable jeśli brak kandydatów
- **Typy**: `BulkActionsBarProps`
- **Propsy**: `candidatesCount`, `selectedCount`, `onAcceptAll`, `onRejectAll`, `onClearSelection`

### EditCandidateModal

- **Opis**: Modal do edycji kandydatów z długą zawartością
- **Główne elementy**: Modal dialog z form fields, save/cancel buttons
- **Obsługiwane interakcje**: Form editing, save/cancel actions, keyboard shortcuts
- **Obsługiwana walidacja**: Real-time validation z error display
- **Typy**: `EditCandidateModalProps`, `CandidateEditForm`
- **Propsy**: `isOpen`, `candidate`, `onSave`, `onCancel`

### SaveSelectedButton

- **Opis**: Przycisk zapisujący zaakceptowane kandydatów jako fiszki
- **Główne elementy**: Primary button z loading state i count indicator
- **Obsługiwane interakcje**: Click to save, loading state podczas API call
- **Obsługiwana walidacja**: Disabled jeśli brak zaakceptowanych kandydatów
- **Typy**: `SaveSelectedButtonProps`
- **Propsy**: `selectedCount`, `onSave`, `isLoading`, `disabled`

### ErrorDisplay

- **Opis**: Komponent wyświetlający błędy z opcją retry
- **Główne elementy**: Alert/notice UI z error message i retry button
- **Obsługiwane interakcje**: Retry action, dismiss error
- **Obsługiwana walidacja**: Brak
- **Typy**: `ErrorDisplayProps`, `AiServiceError`
- **Propsy**: `error`, `onRetry`, `onDismiss`

## 5. Typy

```typescript
// Stan główny widoku
interface GenerateViewState {
  phase: GenerationPhase;
  inputText: string;
  candidates: CandidateWithStatus[];
  selectedCandidates: string[];
  isLoading: boolean;
  error: AiServiceError | null;
  validationErrors: ValidationErrors;
  generationMetadata: GenerationMetadata | null;
}

// Fazy generowania
type GenerationPhase = "input" | "loading" | "results" | "error";

// Kandydat z dodatkowym statusem UI
interface CandidateWithStatus extends AiCandidate {
  status: CandidateStatus;
  isEdited: boolean;
  validationErrors?: ValidationErrors;
}

type CandidateStatus = "pending" | "accepted" | "rejected";

// Stany walidacji
interface ValidationErrors {
  inputText?: string;
  frontText?: string;
  backText?: string;
}

interface ValidationState {
  isValid: boolean;
  errors: ValidationErrors;
}

// Props komponentów
interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  validationErrors: ValidationErrors;
}

interface CandidateRowProps {
  candidate: CandidateWithStatus;
  onUpdate: (id: string, updates: Partial<CandidateWithStatus>) => void;
  onEdit: (candidate: CandidateWithStatus) => void;
  onToggleStatus: (id: string, status: CandidateStatus) => void;
}

interface EditCandidateModalProps {
  isOpen: boolean;
  candidate: CandidateWithStatus | null;
  onSave: (candidate: CandidateWithStatus) => void;
  onCancel: () => void;
}

// Form dla edycji kandydata
interface CandidateEditForm {
  frontText: string;
  backText: string;
  confidence: number;
}

// Progress dla generowania
interface GenerationProgress {
  phase: "preparing" | "generating" | "processing" | "complete";
  retryCount: number;
  estimatedTimeMs?: number;
}
```

## 6. Zarządzanie stanem

**Custom Hook**: `useGenerateFlashcards`

Zarządza kompleksowym stanem widoku:

```typescript
const useGenerateFlashcards = () => {
  // Stan lokalny
  const [state, setState] = useState<GenerateViewState>(initialState);

  // Session storage persistence
  const persistToSession = useCallback((candidates: CandidateWithStatus[]) => {
    sessionStorage.setItem("ai-candidates", JSON.stringify(candidates));
  }, []);

  const loadFromSession = useCallback(() => {
    const stored = sessionStorage.getItem("ai-candidates");
    return stored ? JSON.parse(stored) : [];
  }, []);

  // Walidacja input text
  const validateInputText = useMemo(
    () =>
      debounce((text: string) => {
        const errors: ValidationErrors = {};
        if (text.length < 1000) errors.inputText = "Tekst jest za krótki, minimalnie 1000 znaków";
        if (text.length > 10000) errors.inputText = "Tekst jest za długi, maksymalnie 10000 znaków";
        setState((prev) => ({ ...prev, validationErrors: errors }));
      }, 300),
    []
  );

  // Funkcje akcji
  const generateCandidates = async (text: string) => {
    /* API call z retry logic */
  };
  const updateCandidate = (id: string, updates: Partial<CandidateWithStatus>) => {
    /* update logic */
  };
  const saveSelectedCandidates = async () => {
    /* save to flashcards API */
  };

  return {
    state,
    actions: {
      generateCandidates,
      updateCandidate,
      saveSelectedCandidates,
      bulkAccept: () => {},
      bulkReject: () => {},
      retryGeneration: () => {},
    },
  };
};
```

**Kluczowe elementy stanu**:

- Input text z walidacją
- Lista kandydatów z statusami
- Faza generowania (input/loading/results/error)
- Błędy i loading states
- Session storage persistence
- Metadata generowania

## 7. Integracja API

### Generowanie kandydatów

**Endpoint**: `POST /api/ai/generate-candidates`  
**Request Type**: `AiGenerateCandidatesRequest`

```typescript
{
  text: string; // 1000-10000 characters
  retry_count?: number;
}
```

**Response Type**: `AiGenerateCandidatesResponse`

```typescript
{
  success: true;
  data: {
    candidates: AiCandidate[];
    generation_metadata: GenerationMetadata;
  };
}
```

### Zapisywanie fiszek

**Endpoint**: `POST /api/flashcards`  
**Request Type**: `CreateFlashcardsRequest`

```typescript
{
  flashcards: CreateFlashcardRequest[]; // batch create
}
```

**Response Type**: `CreateFlashcardsResponse`  
**Error Handling**: Obsługa częściowych błędów w batch operations

## 8. Interakcje użytkownika

1. **Wpisywanie tekstu**:
   - Real-time validation z debouncing (300ms)
   - Licznik znaków z kolorową sygnalizacją
   - Disable przycisku Generate przy nieprawidłowej długości

2. **Generowanie**:
   - Click Generate → przejście do fazy loading
   - Progress indicator z retry counter
   - Automatyczne retry (maks. 2) z exponential backoff
   - Manual retry przy błędach

3. **Przegląd kandydatów**:
   - Inline editing w tabeli (short content)
   - Modal editing (long content >200 chars)
   - Accept/Reject toggle per kandydata
   - Bulk actions (Accept All, Reject All)

4. **Zapisywanie**:
   - Save Selected button (enabled tylko z zaakceptowanymi)
   - Loading state podczas API call
   - Success feedback i przekierowanie

## 9. Warunki i walidacja

### Walidacja input text (TextInputSection):

- **Minimalna długość**: 1000 znaków
- **Maksymalna długość**: 10000 znaków
- **Real-time**: Walidacja z debouncing podczas wpisywania
- **UI feedback**: Komunikat błędu + disabled Generate button

### Walidacja kandydatów (CandidateRow, EditModal):

- **Front text**: Maksymalnie 200 znaków
- **Back text**: Maksymalnie 500 znaków
- **Wymagalność**: Oba pola wymagane, nie mogą być puste
- **UI feedback**: Inline error messages, red borders

### Walidacja przed zapisem (SaveButton):

- **Minimalny wybór**: Minimum 1 zaakceptowany kandydat
- **Walidacja zawartości**: Wszystkie zaakceptowane kandydaci muszą być valid
- **UI feedback**: Disabled button z tooltip explanation

### Walidacja session storage:

- **Persistence**: Kandydaci zachowani po refresh
- **Validation**: Sprawdzenie integrity przy load
- **Cleanup**: Usunięcie po successful save

## 10. Obsługa błędów

### Błędy AI Service:

- **Rate limiting**: Wyświetl komunikat z retry_after timer
- **Timeout**: Automatyczny retry z exponential backoff
- **Model errors**: Komunikat o błędzie z manual retry
- **Network errors**: Generic error z retry option

### Błędy walidacji:

- **Input text**: Real-time feedback z jasnym komunikatem
- **Candidate editing**: Inline validation messages
- **Save validation**: Prevent save z error explanation

### Błędy API:

- **Duplicate flashcards**: Komunikat o duplikacji z opcją skip
- **Network errors**: Retry mechanism z user feedback
- **Server errors**: Generic error handling z support contact

### Error Recovery:

- **Session restore**: Przywracanie stanu po błędzie
- **Retry mechanisms**: Automatic + manual retry options
- **Graceful degradation**: Fallback do podstawowej funkcjonalności

## 11. Kroki implementacji

1. **Struktura podstawowa**:
   - Utworzenie głównego komponentu `GenerateView.astro`
   - Setup routing w `src/pages/generate.astro`
   - Konfiguracja layoutu i nawigacji

2. **Komponenty core**:
   - Implementacja `TextInputSection` z walidacją
   - Implementacja `LoadingSection` z progress indicator
   - Setup custom hook `useGenerateFlashcards`

3. **Integracja AI**:
   - Integracja z endpoint `/api/ai/generate-candidates`
   - Implementacja retry logic z exponential backoff
   - Error handling dla AI service errors

4. **Komponenty rezultatów**:
   - Implementacja `CandidatesTable` z `CandidateRow`
   - Inline editing functionality
   - `EditCandidateModal` dla długiej zawartości

5. **Bulk actions i persistence**:
   - Implementacja `BulkActionsBar`
   - Session storage persistence
   - `SaveSelectedButton` z integracji flashcards API

6. **Walidacja i error handling**:
   - Real-time validation dla wszystkich form fields
   - Comprehensive error handling
   - User feedback dla wszystkich operacji

7. **Styling i responsywność**:
   - Tailwind CSS styling zgodny z design system
   - Responsywny design dla mobile/tablet
   - Accessibility improvements (ARIA labels, keyboard navigation)

8. **Testing i polish**:
   - Unit testy dla custom hook i komponentów
   - Integration testy dla API calls
   - UX polish (loading states, transitions, micro-interactions)

9. **Performance optimization**:
   - Lazy loading dla dużych list kandydatów
   - Debouncing dla input validation
   - Optimization session storage operations

10. **Documentation i code review**:
    - Code documentation
    - Component props documentation
    - Code review i refactoring
