# Plan Integracji dla funkcjonalności "Moje fiszki"

## 1. Przegląd integracji

Ten plan opisuje jak zintegrować funkcjonalność "Moje fiszki" z resztą aplikacji 10xCards, uwzględniając istniejącą architekturę, API endpoints, komponenty UI oraz przepływy użytkownika.

### 1.1 Zakres integracji
- **Integracja z istniejącymi API endpoints**
- **Integracja z systemem nawigacji**
- **Integracja z dashboard i innymi widokami**
- **Integracja z systemem uwierzytelniania**
- **Integracja z AI generation flow**
- **Shared state management**
- **Error handling i loading states**

## 2. Analiza istniejącej architektury

### 2.1 Aktualna struktura projektów
```
src/
├── pages/
│   ├── dashboard.astro ✅             - Dashboard z linkiem do /flashcards
│   ├── generate.astro ✅              - Generowanie AI z SaveSelected button
│   ├── profile.astro ✅               - Profil użytkownika
│   └── flashcards.astro ❌           - NOWA STRONA - do utworzenia
├── components/
│   ├── navigation/ ✅                 - Navigation już istnieje
│   ├── flashcards/ ❌                - NOWY FOLDER - do utworzenia
│   ├── GenerateViewClient.tsx ✅      - Integration point dla save flow
│   └── ResultsSection.tsx ✅          - SaveSelectedButton integration
├── lib/
│   ├── services/
│   │   └── flashcard.service.ts ✅   - API service już istnieje
│   └── hooks/
│       └── useGenerateFlashcards.ts ✅ - Hook z save functionality
└── types.ts ✅                       - Types już zdefiniowane
```

### 2.2 Istniejące endpoints API
```typescript
// ✅ Już zaimplementowane endpoints
GET    /api/flashcards              - Lista fiszek z filtrowaniem
POST   /api/flashcards              - Tworzenie fiszek (single/batch)
GET    /api/flashcards/{id}          - Pojedyncza fiszka
PUT    /api/flashcards/{id}          - Aktualizacja fiszki  
DELETE /api/flashcards/{id}          - Usuwanie fiszki
POST   /api/flashcards/check-duplicate - Sprawdzanie duplikatów

// ❌ Nowe endpoints do dodania
DELETE /api/flashcards/bulk          - Bulk delete
PUT    /api/flashcards/bulk          - Bulk update
GET    /api/flashcards/stats         - Statystyki
```

## 3. Integracja z nawigacją

### 3.1 Aktualizacja Navigation Component

**Plik**: `src/components/navigation/Navigation.tsx`

```tsx
// Rozszerzenie istniejącego komponentu Navigation
const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    current: currentPath === '/dashboard'
  },
  {
    name: 'Generuj fiszki', 
    href: '/generate',
    icon: Zap,
    current: currentPath === '/generate'
  },
  {
    name: 'Moje fiszki',           // ✅ NOWY ELEMENT
    href: '/flashcards',           // ✅ NOWY ROUTE  
    icon: BookOpen,                // ✅ NOWA IKONA
    current: currentPath === '/flashcards',
    badge: flashcardsCount         // ✅ Optional badge z liczbą fiszek
  },
  {
    name: 'Sesja nauki',
    href: '/study', 
    icon: GraduationCap,
    current: currentPath === '/study'
  },
  {
    name: 'Profil',
    href: '/profile',
    icon: User,
    current: currentPath === '/profile'
  }
];
```

**Implementacja badge counts**:
```tsx
// Hook dla liczby fiszek w navigation
function useFlashcardCounts() {
  const [counts, setCounts] = useState({
    total: 0,
    dueToday: 0
  });
  
  useEffect(() => {
    async function fetchCounts() {
      try {
        const response = await fetch('/api/flashcards/stats');
        const data = await response.json();
        setCounts({
          total: data.data.total_count,
          dueToday: data.data.due_today
        });
      } catch (error) {
        console.error('Failed to fetch flashcard counts:', error);
      }
    }
    
    fetchCounts();
    // Refresh counts every 5 minutes
    const interval = setInterval(fetchCounts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  return counts;
}

// Integration w Navigation.tsx
export function Navigation({ user, currentPath }: NavigationProps) {
  const { total: flashcardsCount, dueToday } = useFlashcardCounts();
  
  return (
    <nav>
      {/* Existing navigation */}
      <NavigationItem
        href="/flashcards"
        icon={BookOpen}
        current={currentPath === '/flashcards'}
        badge={flashcardsCount > 0 ? flashcardsCount : undefined}
      >
        Moje fiszki
      </NavigationItem>
      
      <NavigationItem
        href="/study"
        icon={GraduationCap} 
        current={currentPath === '/study'}
        badge={dueToday > 0 ? dueToday : undefined}
        variant="urgent" // Red badge for due flashcards
      >
        Sesja nauki
      </NavigationItem>
    </nav>
  );
}
```

### 3.2 Aktualizacja Dashboard

**Plik**: `src/pages/dashboard.astro`

```astro
<!-- Existing dashboard tile - update href -->
<a
  href="/flashcards"  <!-- ✅ ZMIANA z /cards na /flashcards -->
  class="group p-6 bg-card border border-border rounded-xl hover:border-primary/20 hover:shadow-md transition-all"
>
  <div class="flex items-start space-x-4">
    <!-- Existing content -->
    <div class="flex-1">
      <h3 class="font-semibold text-card-foreground group-hover:text-primary transition-colors">
        Moje fiszki
      </h3>
      <p class="mt-1 text-sm text-muted-foreground">Przeglądaj i zarządzaj swoimi fiszkami</p>
      
      <!-- ✅ NOWY - Dynamic stats -->
      <div class="mt-2 flex items-center text-xs text-muted-foreground" id="dashboard-flashcards-stats">
        <span class="loading">Ładowanie...</span>
      </div>
    </div>
  </div>
</a>

<script>
  // ✅ NOWY - Client-side stats loading
  async function loadFlashcardStats() {
    try {
      const response = await fetch('/api/flashcards/stats');
      const data = await response.json();
      
      const statsElement = document.getElementById('dashboard-flashcards-stats');
      if (statsElement && data.success) {
        const { total_count, due_today } = data.data;
        statsElement.innerHTML = `
          <span>${total_count} fiszek</span>
          ${due_today > 0 ? `<span class="ml-2 text-orange-600">• ${due_today} do powtórki</span>` : ''}
        `;
      }
    } catch (error) {
      console.error('Failed to load flashcard stats:', error);
      const statsElement = document.getElementById('dashboard-flashcards-stats');
      if (statsElement) {
        statsElement.innerHTML = '<span class="text-muted-foreground">-</span>';
      }
    }
  }
  
  // Load stats when page loads
  document.addEventListener('DOMContentLoaded', loadFlashcardStats);
</script>
```

## 4. Integracja z AI Generation Flow

### 4.1 SaveSelectedButton Integration

**Plik**: `src/components/SaveSelectedButton.tsx` (aktualizacja)

```tsx
// Rozszerzenie istniejącego SaveSelectedButton
interface SaveSelectedButtonProps {
  selectedCandidates: CandidateWithStatus[];
  onSave: () => Promise<void>;
  isSaving: boolean;
  isLoggedIn: boolean;
  onSaveSuccess?: (flashcards: FlashcardDto[]) => void; // ✅ NOWY callback
}

export function SaveSelectedButton({ 
  selectedCandidates, 
  onSave, 
  isSaving, 
  isLoggedIn,
  onSaveSuccess 
}: SaveSelectedButtonProps) {
  
  const handleSave = async () => {
    try {
      const result = await onSave();
      
      // ✅ NOWY - Post-save navigation options
      if (onSaveSuccess && result) {
        onSaveSuccess(result);
      }
      
      // Show success toast with navigation options
      toast.success(
        <div>
          <p>Zapisano {selectedCandidates.length} fiszek!</p>
          <div className="mt-2 flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.location.href = '/flashcards'}
            >
              Przejdź do Moich fiszek
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.location.href = '/study'}
            >
              Rozpocznij naukę
            </Button>
          </div>
        </div>,
        { duration: 5000 }
      );
      
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Nie udało się zapisać fiszek');
    }
  };

  // Existing implementation with updated handleSave
  return (
    <Button
      onClick={handleSave}
      disabled={selectedCandidates.length === 0 || isSaving || !isLoggedIn}
      className="flex items-center"
    >
      {/* Existing content */}
    </Button>
  );
}
```

### 4.2 Integration w useGenerateFlashcards Hook

**Plik**: `src/lib/hooks/useGenerateFlashcards.ts` (aktualizacja)

```tsx
// Rozszerzenie istniejącego hook'a
export function useGenerateFlashcards() {
  // Existing state...
  
  // ✅ NOWY - Post-save actions state
  const [postSaveAction, setPostSaveAction] = useState<'stay' | 'flashcards' | 'study'>('stay');
  
  const saveSelectedCandidates = async (): Promise<FlashcardDto[]> => {
    setIsSaving(true);
    
    try {
      const selectedCandidates = candidates.filter(c => c.status === 'accepted');
      
      // Existing save logic...
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flashcards: selectedCandidates.map(candidate => ({
            front_text: candidate.front_text,
            back_text: candidate.back_text,
            source: candidate.isEdited ? 'ai-edit' : 'ai-full',
            candidate_id: candidate.id
          }))
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Clear saved candidates from session storage
        sessionStorage.removeItem('ai_candidates');
        setCandidates([]);
        
        // ✅ NOWY - Return created flashcards for further actions
        return result.data.flashcards;
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('Error saving flashcards:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };
  
  // ✅ NOWY - Post-save navigation action
  const handlePostSaveNavigation = (action: 'flashcards' | 'study') => {
    switch (action) {
      case 'flashcards':
        window.location.href = '/flashcards';
        break;
      case 'study':
        window.location.href = '/study';
        break;
    }
  };
  
  return {
    state: {
      // Existing state...
      postSaveAction
    },
    actions: {
      // Existing actions...
      saveSelectedCandidates,
      setPostSaveAction,
      handlePostSaveNavigation
    }
  };
}
```

## 5. Shared State Management

### 5.1 Global Flashcard Context

**Plik**: `src/lib/contexts/FlashcardContext.tsx` (nowy)

```tsx
// Global context dla flashcard data across app
interface FlashcardContextValue {
  flashcards: FlashcardDto[];
  stats: FlashcardStats | null;
  refreshFlashcards: () => Promise<void>;
  refreshStats: () => Promise<void>;
  optimisticUpdate: (id: string, updates: Partial<FlashcardDto>) => void;
  optimisticDelete: (id: string) => void;
  optimisticCreate: (flashcard: FlashcardDto) => void;
}

const FlashcardContext = createContext<FlashcardContextValue | null>(null);

export function FlashcardProvider({ children }: { children: ReactNode }) {
  const [flashcards, setFlashcards] = useState<FlashcardDto[]>([]);
  const [stats, setStats] = useState<FlashcardStats | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  
  // Cache invalidation - refresh after 5 minutes
  const shouldRefresh = useMemo(() => {
    return Date.now() - lastFetch > 5 * 60 * 1000;
  }, [lastFetch]);
  
  const refreshFlashcards = useCallback(async () => {
    try {
      const response = await fetch('/api/flashcards');
      const data = await response.json();
      
      if (data.success) {
        setFlashcards(data.data.flashcards);
        setLastFetch(Date.now());
      }
    } catch (error) {
      console.error('Failed to refresh flashcards:', error);
    }
  }, []);
  
  const refreshStats = useCallback(async () => {
    try {
      const response = await fetch('/api/flashcards/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  }, []);
  
  // Optimistic updates for immediate UI feedback
  const optimisticUpdate = useCallback((id: string, updates: Partial<FlashcardDto>) => {
    setFlashcards(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);
  
  const optimisticDelete = useCallback((id: string) => {
    setFlashcards(prev => prev.filter(f => f.id !== id));
    setStats(prev => prev ? { ...prev, total_count: prev.total_count - 1 } : null);
  }, []);
  
  const optimisticCreate = useCallback((flashcard: FlashcardDto) => {
    setFlashcards(prev => [flashcard, ...prev]);
    setStats(prev => prev ? { ...prev, total_count: prev.total_count + 1 } : null);
  }, []);
  
  // Auto-refresh when needed
  useEffect(() => {
    if (shouldRefresh && flashcards.length > 0) {
      refreshFlashcards();
      refreshStats();
    }
  }, [shouldRefresh, flashcards.length, refreshFlashcards, refreshStats]);
  
  const value = {
    flashcards,
    stats,
    refreshFlashcards,
    refreshStats,
    optimisticUpdate,
    optimisticDelete,
    optimisticCreate
  };
  
  return (
    <FlashcardContext.Provider value={value}>
      {children}
    </FlashcardContext.Provider>
  );
}

export function useFlashcardContext() {
  const context = useContext(FlashcardContext);
  if (!context) {
    throw new Error('useFlashcardContext must be used within FlashcardProvider');
  }
  return context;
}
```

### 5.2 Integration Context w Layout

**Plik**: `src/layouts/Layout.astro` (aktualizacja)

```astro
---
// Existing imports...
import { FlashcardProvider } from "../lib/contexts/FlashcardContext";
---

<!DOCTYPE html>
<html lang="pl">
  <head>
    <!-- Existing head content -->
  </head>
  <body>
    <!-- ✅ NOWY - Global flashcard context wrapper -->
    <FlashcardProvider client:load>
      <slot />
    </FlashcardProvider>
    
    <!-- Existing body content -->
  </body>
</html>
```

## 6. API Service Integration

### 6.1 Rozszerzenie FlashcardService

**Plik**: `src/lib/services/flashcard.service.ts` (aktualizacja)

```typescript
// Rozszerzenie istniejącego FlashcardService
export class FlashcardService {
  // Existing methods...
  
  // ✅ NOWE - Bulk operations methods
  async bulkDeleteFlashcards(flashcardIds: string[], userId: string): Promise<BulkOperationResult> {
    try {
      const { data, error } = await this.supabase
        .from('flashcards')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .in('id', flashcardIds)
        .select('id');
      
      if (error) {
        console.error('Database error in bulkDeleteFlashcards:', error);
        throw new Error(`Failed to delete flashcards: ${error.message}`);
      }
      
      return {
        success_count: data?.length || 0,
        failed_count: flashcardIds.length - (data?.length || 0),
        errors: []
      };
      
    } catch (error) {
      console.error('Error in FlashcardService.bulkDeleteFlashcards:', error);
      throw new Error('Failed to delete flashcards');
    }
  }
  
  // ✅ NOWE - Stats method
  async getFlashcardStats(userId: string): Promise<FlashcardStats> {
    try {
      // Get basic counts
      const { data: flashcards, error } = await this.supabase
        .from('flashcards')
        .select('source, difficulty, reps, due, created_at')
        .eq('user_id', userId)
        .eq('is_deleted', false);
      
      if (error) {
        throw new Error(`Failed to fetch flashcard stats: ${error.message}`);
      }
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const stats: FlashcardStats = {
        total_count: flashcards.length,
        by_source: {
          'ai-full': flashcards.filter(f => f.source === 'ai-full').length,
          'ai-edit': flashcards.filter(f => f.source === 'ai-edit').length,
          'manual': flashcards.filter(f => f.source === 'manual').length
        },
        due_today: flashcards.filter(f => new Date(f.due) <= today).length,
        due_this_week: flashcards.filter(f => {
          const dueDate = new Date(f.due);
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          return dueDate >= today && dueDate <= weekFromNow;
        }).length,
        overdue: flashcards.filter(f => new Date(f.due) < today && f.reps > 0).length,
        never_reviewed: flashcards.filter(f => f.reps === 0).length,
        avg_difficulty: flashcards.length > 0 
          ? flashcards.reduce((sum, f) => sum + f.difficulty, 0) / flashcards.length 
          : 0,
        created_this_month: flashcards.filter(f => new Date(f.created_at) >= thisMonth).length
      };
      
      // Get review records for additional stats
      const { data: reviews, error: reviewError } = await this.supabase
        .from('review_records')
        .select('rating, created_at')
        .eq('user_id', userId)
        .eq('is_deleted', false);
      
      if (!reviewError && reviews) {
        stats.total_reviews = reviews.length;
        stats.avg_rating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;
      }
      
      return stats;
      
    } catch (error) {
      console.error('Error in FlashcardService.getFlashcardStats:', error);
      throw new Error('Failed to get flashcard statistics');
    }
  }
  
  // ✅ NOWE - Search method
  async searchFlashcards(
    userId: string, 
    query: string, 
    filters: ExtendedFlashcardFilters = {}
  ): Promise<FlashcardsListResponseData> {
    try {
      let supabaseQuery = this.supabase
        .from('flashcards')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_deleted', false);
      
      // Text search
      if (query.trim()) {
        supabaseQuery = supabaseQuery.or(
          `front_text.ilike.%${query}%,back_text.ilike.%${query}%`
        );
      }
      
      // Apply additional filters
      if (filters.source) {
        supabaseQuery = supabaseQuery.eq('source', filters.source);
      }
      
      if (filters.difficulty_min !== undefined) {
        supabaseQuery = supabaseQuery.gte('difficulty', filters.difficulty_min);
      }
      
      if (filters.difficulty_max !== undefined) {
        supabaseQuery = supabaseQuery.lte('difficulty', filters.difficulty_max);
      }
      
      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;
      
      supabaseQuery = supabaseQuery
        .range(offset, offset + limit - 1)
        .order(filters.sort || 'created_at', { 
          ascending: filters.order === 'asc' 
        });
      
      const { data, error, count } = await supabaseQuery;
      
      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }
      
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        flashcards: data?.map(this.transformToDto) || [],
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_count: totalCount,
          limit
        }
      };
      
    } catch (error) {
      console.error('Error in FlashcardService.searchFlashcards:', error);
      throw new Error('Search failed');
    }
  }
}
```

### 6.2 Client-side API Hook

**Plik**: `src/lib/hooks/useFlashcardsAPI.ts` (nowy)

```tsx
// Custom hook dla API operations w komponencie My Flashcards
export function useFlashcardsAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const apiCall = useCallback(async <T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Operacja nie powiodła się'
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : errorMessage;
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const createFlashcard = useCallback(async (data: CreateFlashcardRequest) => {
    return apiCall(async () => {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      toast.success('Fiszka została utworzona');
      return result.data;
    }, 'Nie udało się utworzyć fiszki');
  }, [apiCall]);
  
  const updateFlashcard = useCallback(async (id: string, data: UpdateFlashcardRequest) => {
    return apiCall(async () => {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      toast.success('Fiszka została zaktualizowana');
      return result.data;
    }, 'Nie udało się zaktualizować fiszki');
  }, [apiCall]);
  
  const deleteFlashcard = useCallback(async (id: string) => {
    return apiCall(async () => {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      toast.success('Fiszka została usunięta');
      return true;
    }, 'Nie udało się usunąć fiszki');
  }, [apiCall]);
  
  const bulkDeleteFlashcards = useCallback(async (ids: string[]) => {
    return apiCall(async () => {
      const response = await fetch('/api/flashcards/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcard_ids: ids })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      const { deleted_count, failed_count } = result.data;
      toast.success(`Usunięto ${deleted_count} fiszek`);
      
      if (failed_count > 0) {
        toast.warning(`${failed_count} fiszek nie udało się usunąć`);
      }
      
      return result.data;
    }, 'Nie udało się usunąć zaznaczonych fiszek');
  }, [apiCall]);
  
  return {
    isLoading,
    error,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    bulkDeleteFlashcards
  };
}
```

## 7. Error Handling Integration

### 7.1 Global Error Handler

**Plik**: `src/lib/utils/error-handler.ts` (nowy)

```typescript
// Centralized error handling dla flashcard operations
export class FlashcardError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'FlashcardError';
  }
}

export function handleFlashcardApiError(error: unknown): FlashcardError {
  if (error instanceof FlashcardError) {
    return error;
  }
  
  if (error instanceof Error) {
    // Parse API error responses
    if (error.message.includes('404')) {
      return new FlashcardError('Fiszka nie została znaleziona', 'NOT_FOUND', 404);
    }
    
    if (error.message.includes('duplicate')) {
      return new FlashcardError('Fiszka o tej treści już istnieje', 'DUPLICATE', 409);
    }
    
    if (error.message.includes('validation')) {
      return new FlashcardError('Nieprawidłowe dane wejściowe', 'VALIDATION_ERROR', 400);
    }
    
    if (error.message.includes('permission')) {
      return new FlashcardError('Brak uprawnień do tej operacji', 'PERMISSION_DENIED', 403);
    }
  }
  
  // Generic error
  return new FlashcardError(
    'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.',
    'UNKNOWN_ERROR',
    500
  );
}

// Error toast helper
export function showFlashcardError(error: unknown) {
  const flashcardError = handleFlashcardApiError(error);
  
  toast.error(flashcardError.message, {
    description: flashcardError.code,
    action: flashcardError.statusCode >= 500 ? {
      label: 'Spróbuj ponownie',
      onClick: () => window.location.reload()
    } : undefined
  });
}
```

### 7.2 Error Boundary dla Flashcards

**Plik**: `src/components/flashcards/FlashcardsErrorBoundary.tsx` (nowy)

```tsx
// Specialized error boundary dla flashcards view
interface FlashcardsErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class FlashcardsErrorBoundary extends Component<
  { children: ReactNode },
  FlashcardsErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  
  static getDerivedStateFromError(error: Error): FlashcardsErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to monitoring service
    console.error('FlashcardsErrorBoundary caught an error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Ups! Coś poszło nie tak
          </h2>
          
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Wystąpił błąd podczas ładowania Twoich fiszek. Spróbuj odświeżyć stronę 
            lub skontaktuj się z pomocą techniczną.
          </p>
          
          <div className="flex space-x-4">
            <Button
              onClick={() => window.location.reload()}
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Odśwież stronę
            </Button>
            
            <Button
              onClick={() => window.location.href = '/dashboard'}
              variant="outline"
            >
              Wróć do Dashboard
            </Button>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-6 p-4 bg-muted rounded-lg max-w-2xl overflow-auto">
              <summary className="cursor-pointer font-medium">
                Szczegóły błędu (tylko w trybie deweloperskim)
              </summary>
              <pre className="mt-2 text-sm whitespace-pre-wrap">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## 8. Loading States Integration

### 8.1 Global Loading Provider

**Plik**: `src/lib/contexts/LoadingContext.tsx` (nowy)

```tsx
// Global loading state management
interface LoadingContextValue {
  isLoading: (key: string) => boolean;
  setLoading: (key: string, loading: boolean) => void;
  loadingStates: Record<string, boolean>;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);
  
  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);
  
  return (
    <LoadingContext.Provider value={{ isLoading, setLoading, loadingStates }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}
```

### 8.2 Skeleton Components

**Plik**: `src/components/flashcards/FlashcardsSkeleton.tsx` (nowy)

```tsx
// Skeleton loading components for flashcards
export function FlashcardsTableSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-12 px-4 py-3">
                <Skeleton className="h-4 w-4" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-16" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-4" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-full max-w-xs" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-full max-w-sm" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-1">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FlashcardsHeaderSkeleton() {
  return (
    <div className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
```

## 9. Progressive Enhancement

### 9.1 SSR Integration

**Plik**: `src/pages/flashcards.astro` (nowy)

```astro
---
// Server-side rendering with progressive enhancement
import Layout from "../layouts/Layout.astro";
import { Navigation } from "../components/navigation/Navigation";
import { FlashcardsView } from "../components/flashcards/FlashcardsView";
import { FlashcardsErrorBoundary } from "../components/flashcards/FlashcardsErrorBoundary";

// Auth check
const { user } = Astro.locals;
if (!user) {
  return Astro.redirect("/auth/login");
}

const currentPath = Astro.url.pathname;

// Server-side data pre-loading for performance
let initialFlashcards = null;
let initialStats = null;
let hasError = false;

try {
  // Pre-load first page of flashcards
  const supabase = Astro.locals.supabase;
  
  // Get flashcards with basic pagination
  const { data: flashcardsData, error: flashcardsError } = await supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (flashcardsError) {
    console.error('SSR: Failed to load flashcards:', flashcardsError);
  } else {
    initialFlashcards = flashcardsData;
  }
  
  // Get basic stats
  const { data: statsData, error: statsError } = await supabase
    .from('flashcards')
    .select('source, difficulty, reps, due, created_at')
    .eq('user_id', user.id)
    .eq('is_deleted', false);
  
  if (statsError) {
    console.error('SSR: Failed to load stats:', statsError);
  } else if (statsData) {
    // Calculate basic stats server-side
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    initialStats = {
      total_count: statsData.length,
      by_source: {
        'ai-full': statsData.filter(f => f.source === 'ai-full').length,
        'ai-edit': statsData.filter(f => f.source === 'ai-edit').length,
        'manual': statsData.filter(f => f.source === 'manual').length,
      },
      due_today: statsData.filter(f => new Date(f.due) <= today).length,
      never_reviewed: statsData.filter(f => f.reps === 0).length,
      avg_difficulty: statsData.length > 0 
        ? statsData.reduce((sum, f) => sum + f.difficulty, 0) / statsData.length 
        : 0,
    };
  }
  
} catch (error) {
  console.error('SSR: General error loading flashcard data:', error);
  hasError = true;
}

// Format user data
const userData = {
  id: user.id,
  email: user.email || "",
  email_confirmed: !!user.email_confirmed_at,
  created_at: user.created_at ? new Date(user.created_at) : new Date(),
};
---

<Layout title="Moje fiszki - 10xCards">
  <Navigation user={userData} currentPath={currentPath} client:load />
  
  {hasError ? (
    <!-- Server-side error fallback -->
    <div class="min-h-screen bg-background flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-foreground mb-4">Wystąpił błąd</h1>
        <p class="text-muted-foreground mb-4">
          Nie udało się załadować fiszek. Spróbuj odświeżyć stronę.
        </p>
        <a 
          href="/dashboard" 
          class="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Wróć do Dashboard
        </a>
      </div>
    </div>
  ) : (
    <FlashcardsErrorBoundary client:load>
      <FlashcardsView 
        user={userData}
        initialFlashcards={initialFlashcards}
        initialStats={initialStats}
        client:load 
      />
    </FlashcardsErrorBoundary>
  )}
</Layout>

<script>
  // Progressive enhancement for better UX
  document.addEventListener('DOMContentLoaded', () => {
    // Add loading indicator during hydration
    const mainContent = document.querySelector('[data-flashcards-view]');
    if (mainContent) {
      mainContent.classList.add('opacity-50');
      
      // Remove loading state after hydration
      setTimeout(() => {
        mainContent.classList.remove('opacity-50');
      }, 100);
    }
  });
</script>
</Layout>
```
