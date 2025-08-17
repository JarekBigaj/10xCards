# Plan UI dla funkcjonalności "Moje fiszki"

## 1. Przegląd widoku "Moje fiszki"

### 1.1 Główny cel

Widok "Moje fiszki" (`/flashcards`) to centralne miejsce zarządzania wszystkimi fiszkami użytkownika z intuicyjnym interfejsem umożliwiającym łatwe przeglądanie, edytowanie, filtrowanie i organizowanie kolekcji.

### 1.2 User Journey

```
Dashboard → Moje fiszki → [Filtrowanie/Wyszukiwanie] → [Operacje na fiszkach]
                      ↓
                   [Tworzenie nowej fiszki]
                      ↓
                   [Edycja istniejących]
                      ↓
                   [Bulk operations]
```

## 2. Architektura komponentów

### 2.1 Struktura plików

```
src/pages/flashcards.astro              - Główna strona
src/components/flashcards/
├── FlashcardsView.tsx                  - Główny kontener widoku
├── FlashcardsHeader.tsx                - Header z tytułem i akcjami
├── FlashcardsToolbar.tsx               - Toolbar z filtrami i wyszukiwaniem
├── FlashcardsTable.tsx                 - Tabela z fiszkami
├── FlashcardRow.tsx                    - Pojedynczy wiersz tabeli
├── FlashcardFilters.tsx                - Panel filtrów
├── SearchBar.tsx                       - Pasek wyszukiwania
├── BulkActionsPanel.tsx                - Panel operacji grupowych
├── CreateFlashcardModal.tsx            - Modal tworzenia nowej fiszki
├── EditFlashcardModal.tsx              - Modal edycji fiszki
├── DeleteConfirmationModal.tsx         - Modal potwierdzenia usunięcia
├── FlashcardsPagination.tsx            - Paginacja
├── FlashcardsStats.tsx                 - Statystyki (sidebar)
└── EmptyState.tsx                      - Stan pusty (brak fiszek)
```

### 2.2 Komponenty pomocnicze (do użycia/rozszerzenia)

```
src/components/ui/
├── data-table.tsx                      - (do dodania) Generyczna tabela danych
├── checkbox.tsx                        - (do dodania) Dla bulk selection
├── badge.tsx                          - (do dodania) Dla source/status indicators
├── input.tsx                          - (do dodania) Dla search i form inputs
├── select.tsx                         - (do dodania) Dla filtrów
└── pagination.tsx                     - (do dodania) Komponent paginacji
```

## 3. Layout i responsive design

### 3.1 Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────────────────┐
│ Navigation Bar                                                   │
├─────────────────────────────────────────────────────────────────┤
│ Page Header: "Moje fiszki" + [Dodaj fiszkę] + Stats Summary     │
├─────────────────────────────────────────────────────────────────┤
│ Toolbar: [Search] [Filters] [Sort] [View Options]              │
├─────────────────────────────────────────────────────────────────┤
│ Bulk Actions (when selected): [Delete] [Export] [Edit]         │
├─────────────────────────────────────────────────────────────────┤
│                                                │ Filters Panel  │
│                Table View                      │ (expandable)   │
│  □ Front Text    | Back Text | Source | Due   │ - Source       │
│  □ Pytanie 1     | Odpow... | AI     | 2d     │ - Date range   │
│  □ Pytanie 2     | Odpow... | Manual | 1w     │ - Difficulty   │
│                                                │ - Never reviewd│
├─────────────────────────────────────────────────────────────────┤
│ Pagination: [Previous] [1] [2] [3] ... [Next] | 50 z 150       │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Mobile Layout (≤768px)

```
┌─────────────────────────────────┐
│ ☰ Navigation                   │
├─────────────────────────────────┤
│ Moje fiszki               [+]   │
├─────────────────────────────────┤
│ [🔍 Search]    [Filters ▼]     │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ □ React Components          │ │
│ │   Komponenty React to...    │ │
│ │   AI • 2 dni                │ │
│ │   [Edit] [Delete]           │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ □ Python Lists              │ │
│ │   Lista w Python to...      │ │
│ │   Manual • 1 tydzień        │ │
│ │   [Edit] [Delete]           │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ [Previous] 1 z 3 [Next]         │
└─────────────────────────────────┘
```

## 4. Szczegółowy design komponentów

### 4.1 FlashcardsView.tsx (Main Container)

```tsx
interface FlashcardsViewProps {
  user: User;
  initialFlashcards?: FlashcardDto[];
  initialStats?: FlashcardStats;
}

export function FlashcardsView({ user, initialFlashcards, initialStats }: FlashcardsViewProps) {
  // State management
  const [flashcards, setFlashcards] = useState<FlashcardDto[]>(initialFlashcards || []);
  const [filteredFlashcards, setFilteredFlashcards] = useState<FlashcardDto[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FlashcardFilters>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "created_at", order: "desc" });
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardDto | null>(null);
  const [deletingFlashcard, setDeletingFlashcard] = useState<FlashcardDto | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <FlashcardsHeader
        totalCount={filteredFlashcards.length}
        selectedCount={selectedIds.size}
        onCreateNew={() => setIsCreateModalOpen(true)}
        stats={stats}
      />

      <FlashcardsToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={setFilters}
        sortConfig={sortConfig}
        onSortChange={setSortConfig}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {selectedIds.size > 0 && (
        <BulkActionsPanel
          selectedCount={selectedIds.size}
          onDelete={() => handleBulkDelete(selectedIds)}
          onDeselect={() => setSelectedIds(new Set())}
          isDeleting={isDeleting}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredFlashcards.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters(filters)}
            onClearFilters={() => setFilters(defaultFilters)}
            onCreateNew={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <>
            <FlashcardsTable
              flashcards={paginatedFlashcards}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onEdit={setEditingFlashcard}
              onDelete={setDeletingFlashcard}
              sortConfig={sortConfig}
              onSort={setSortConfig}
              viewMode={viewMode}
            />

            <FlashcardsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={filteredFlashcards.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <CreateFlashcardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleFlashcardCreated}
      />

      <EditFlashcardModal
        isOpen={!!editingFlashcard}
        flashcard={editingFlashcard}
        onClose={() => setEditingFlashcard(null)}
        onSuccess={handleFlashcardUpdated}
      />

      <DeleteConfirmationModal
        isOpen={!!deletingFlashcard}
        flashcard={deletingFlashcard}
        onClose={() => setDeletingFlashcard(null)}
        onConfirm={handleFlashcardDeleted}
      />
    </div>
  );
}
```

### 4.2 FlashcardsHeader.tsx

```tsx
interface FlashcardsHeaderProps {
  totalCount: number;
  selectedCount: number;
  onCreateNew: () => void;
  stats: FlashcardStats;
}

export function FlashcardsHeader({ totalCount, selectedCount, onCreateNew, stats }: FlashcardsHeaderProps) {
  return (
    <div className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Moje fiszki</h1>
            <p className="mt-1 text-muted-foreground">
              {totalCount} {totalCount === 1 ? "fiszka" : totalCount < 5 ? "fiszki" : "fiszek"}
              {selectedCount > 0 && <span className="ml-2 text-primary">• {selectedCount} zaznaczonych</span>}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick stats for desktop */}
            <div className="hidden lg:flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                <span>AI: {stats.by_source["ai-full"] + stats.by_source["ai-edit"]}</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <span>Manual: {stats.by_source.manual}</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                <span>Do powtórki: {stats.due_today}</span>
              </div>
            </div>

            <Button onClick={onCreateNew} className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Dodaj fiszkę</span>
              <span className="sm:hidden">Dodaj</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4.3 FlashcardsToolbar.tsx

```tsx
interface FlashcardsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FlashcardFilters;
  onFiltersChange: (filters: FlashcardFilters) => void;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
  viewMode: "table" | "cards";
  onViewModeChange: (mode: "table" | "cards") => void;
}

export function FlashcardsToolbar({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  sortConfig,
  onSortChange,
  viewMode,
  onViewModeChange,
}: FlashcardsToolbarProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Search bar */}
          <div className="flex-1 max-w-md">
            <SearchBar
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Szukaj w fiszkach..."
              className="w-full"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {/* Filters toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn("flex items-center", hasActiveFilters(filters) && "border-primary bg-primary/5")}
            >
              <Filter className="w-4 h-4 mr-1" />
              Filtry
              {hasActiveFilters(filters) && (
                <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">
                  {getActiveFiltersCount(filters)}
                </Badge>
              )}
            </Button>

            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="w-4 h-4 mr-1" />
                  Sortuj
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSortChange({ field: "created_at", order: "desc" })}>
                  Najnowsze
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange({ field: "created_at", order: "asc" })}>
                  Najstarsze
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange({ field: "due", order: "asc" })}>
                  Najbliższa powtórka
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange({ field: "difficulty", order: "desc" })}>
                  Najtrudniejsze
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View mode toggle */}
            <div className="hidden sm:flex border border-border rounded-md">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("table")}
                className="rounded-r-none"
              >
                <Table className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("cards")}
                className="rounded-l-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Expandable filters panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border">
            <FlashcardFilters
              filters={filters}
              onChange={onFiltersChange}
              onReset={() => onFiltersChange(defaultFilters)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4.4 FlashcardsTable.tsx

```tsx
interface FlashcardsTableProps {
  flashcards: FlashcardDto[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
  sortConfig: SortConfig;
  onSort: (config: SortConfig) => void;
  viewMode: "table" | "cards";
}

export function FlashcardsTable({
  flashcards,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  sortConfig,
  onSort,
  viewMode,
}: FlashcardsTableProps) {
  const isAllSelected = flashcards.length > 0 && flashcards.every((f) => selectedIds.has(f.id));
  const isPartiallySelected = flashcards.some((f) => selectedIds.has(f.id)) && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(flashcards.map((f) => f.id)));
    }
  };

  const handleRowSelect = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectionChange(newSelection);
  };

  if (viewMode === "cards") {
    return <FlashcardsGridView {...props} />;
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isPartiallySelected}
                  onChange={handleSelectAll}
                  aria-label="Zaznacz wszystkie"
                />
              </th>

              <SortableTableHeader field="front_text" sortConfig={sortConfig} onSort={onSort} className="text-left">
                Przód
              </SortableTableHeader>

              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tył</th>

              <SortableTableHeader field="source" sortConfig={sortConfig} onSort={onSort} className="w-24">
                Źródło
              </SortableTableHeader>

              <SortableTableHeader field="due" sortConfig={sortConfig} onSort={onSort} className="w-32">
                Powtórka
              </SortableTableHeader>

              <SortableTableHeader field="created_at" sortConfig={sortConfig} onSort={onSort} className="w-32">
                Utworzono
              </SortableTableHeader>

              <th className="w-24 px-4 py-3 text-right text-sm font-medium text-muted-foreground">Akcje</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {flashcards.map((flashcard) => (
              <FlashcardRow
                key={flashcard.id}
                flashcard={flashcard}
                isSelected={selectedIds.has(flashcard.id)}
                onSelect={() => handleRowSelect(flashcard.id)}
                onEdit={() => onEdit(flashcard)}
                onDelete={() => onDelete(flashcard)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 4.5 FlashcardRow.tsx

```tsx
interface FlashcardRowProps {
  flashcard: FlashcardDto;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FlashcardRow({ flashcard, isSelected, onSelect, onEdit, onDelete }: FlashcardRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const frontTextPreview = truncateText(flashcard.front_text, 60);
  const backTextPreview = truncateText(flashcard.back_text, 80);

  const dueStatus = getDueStatus(flashcard.due);
  const sourceInfo = getSourceInfo(flashcard.source);

  return (
    <tr className={cn("group hover:bg-muted/25 transition-colors", isSelected && "bg-primary/5")}>
      {/* Selection checkbox */}
      <td className="px-4 py-3">
        <Checkbox checked={isSelected} onChange={onSelect} aria-label={`Zaznacz fiszkę: ${flashcard.front_text}`} />
      </td>

      {/* Front text */}
      <td className="px-4 py-3">
        <div className="max-w-xs">
          <p className="text-sm font-medium text-foreground break-words">{frontTextPreview}</p>
          {flashcard.front_text.length > 60 && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Zwiń" : "Rozwiń"}
            </Button>
          )}
          {isExpanded && <p className="mt-2 text-sm text-muted-foreground break-words">{flashcard.front_text}</p>}
        </div>
      </td>

      {/* Back text */}
      <td className="px-4 py-3">
        <div className="max-w-sm">
          <p className="text-sm text-muted-foreground break-words">{backTextPreview}</p>
        </div>
      </td>

      {/* Source */}
      <td className="px-4 py-3">
        <Badge variant={sourceInfo.variant} className="text-xs">
          {sourceInfo.icon}
          {sourceInfo.label}
        </Badge>
      </td>

      {/* Due date */}
      <td className="px-4 py-3">
        <div className="flex items-center">
          <Badge variant={dueStatus.variant} className="text-xs">
            {dueStatus.label}
          </Badge>
        </div>
      </td>

      {/* Created at */}
      <td className="px-4 py-3 text-sm text-muted-foreground">{formatRelativeDate(flashcard.created_at)}</td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0" title="Edytuj fiszkę">
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            title="Usuń fiszkę"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
```

## 5. State Management Strategy

### 5.1 Local State (React hooks)

```tsx
// Main component state
interface FlashcardsState {
  // Data
  flashcards: FlashcardDto[];
  filteredFlashcards: FlashcardDto[];
  stats: FlashcardStats;

  // UI State
  selectedIds: Set<string>;
  currentPage: number;
  searchQuery: string;
  filters: FlashcardFilters;
  sortConfig: SortConfig;
  viewMode: "table" | "cards";

  // Loading states
  isLoading: boolean;
  isDeleting: boolean;
  isBulkDeleting: boolean;

  // Modal states
  isCreateModalOpen: boolean;
  editingFlashcard: FlashcardDto | null;
  deletingFlashcard: FlashcardDto | null;
}

// Custom hook for flashcards management
function useFlashcardsView(initialData: FlashcardDto[]) {
  // State management
  // API calls
  // Event handlers
  // Computed values

  return {
    state,
    actions: {
      loadFlashcards,
      createFlashcard,
      updateFlashcard,
      deleteFlashcard,
      bulkDelete,
      setFilters,
      setSearch,
      setSort,
      selectFlashcard,
      selectAll,
      clearSelection,
    },
  };
}
```

### 5.2 URL State Synchronization

```tsx
// Sync filters and search with URL for bookmarkable links
function useUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const updateFilters = (filters: FlashcardFilters) => {
    const params = new URLSearchParams(searchParams);

    // Update URL params
    if (filters.source) params.set("source", filters.source);
    else params.delete("source");

    if (filters.search) params.set("search", filters.search);
    else params.delete("search");

    setSearchParams(params);
  };

  return { updateFilters };
}
```

## 6. Accessibility (a11y) Implementation

### 6.1 Keyboard Navigation

```tsx
// Table keyboard navigation
function useTableKeyboardNavigation() {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Space":
        e.preventDefault();
        // Toggle selection of focused row
        break;
      case "ArrowDown":
        // Move focus to next row
        break;
      case "ArrowUp":
        // Move focus to previous row
        break;
      case "Enter":
        // Edit focused flashcard
        break;
      case "Delete":
        // Delete focused flashcard (with confirmation)
        break;
    }
  };

  return { handleKeyDown };
}
```

### 6.2 Screen Reader Support

```tsx
// ARIA labels and descriptions
export function FlashcardsTable() {
  return (
    <table role="table" aria-label="Lista fiszek użytkownika" aria-describedby="flashcards-description">
      <caption id="flashcards-description" className="sr-only">
        Tabela zawiera {flashcards.length} fiszek. Użyj strzałek do nawigacji, spacji do zaznaczania, Enter do edycji.
      </caption>

      <thead>
        <tr role="row">
          <th scope="col" aria-label="Zaznacz wszystkie fiszki">
            <Checkbox />
          </th>
          <th scope="col">Przód fiszki</th>
          {/* ... */}
        </tr>
      </thead>

      <tbody>
        {flashcards.map((flashcard) => (
          <tr key={flashcard.id} role="row" aria-selected={selectedIds.has(flashcard.id)} tabIndex={0}>
            {/* ... */}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 6.3 Focus Management

```tsx
// Focus management for modals and interactions
function useFocusManagement() {
  const focusAfterDelete = useRef<HTMLElement>();

  const handleDelete = (flashcard: FlashcardDto) => {
    // Store reference to element that should receive focus after deletion
    focusAfterDelete.current = document.activeElement as HTMLElement;
    setDeletingFlashcard(flashcard);
  };

  const handleDeleteConfirm = async () => {
    await deleteFlashcard(deletingFlashcard.id);
    setDeletingFlashcard(null);

    // Return focus to appropriate element
    if (focusAfterDelete.current) {
      focusAfterDelete.current.focus();
    }
  };
}
```

## 7. Performance Optimizations

### 7.1 Virtual Scrolling (dla dużych zbiorów)

```tsx
// Virtual scrolling for large datasets (100+ flashcards)
import { FixedSizeList as List } from "react-window";

function VirtualizedFlashcardsTable({ flashcards }: { flashcards: FlashcardDto[] }) {
  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style}>
      <FlashcardRow flashcard={flashcards[index]} {...otherProps} />
    </div>
  );

  return (
    <List height={600} itemCount={flashcards.length} itemSize={60} itemData={flashcards}>
      {Row}
    </List>
  );
}
```

### 7.2 Memoization Strategy

```tsx
// Memoize expensive computations
const filteredFlashcards = useMemo(() => {
  return flashcards.filter((flashcard) => {
    const matchesSearch =
      searchQuery === "" ||
      flashcard.front_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flashcard.back_text.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSource = !filters.source || flashcard.source === filters.source;
    const matchesDateRange = !filters.dateRange || isWithinDateRange(flashcard, filters.dateRange);

    return matchesSearch && matchesSource && matchesDateRange;
  });
}, [flashcards, searchQuery, filters]);

// Memoize row components
const FlashcardRow = memo(({ flashcard, ...props }: FlashcardRowProps) => {
  // Component implementation
});
```

### 7.3 Debounced Search

```tsx
// Debounced search to avoid excessive API calls
function useDebounceSearch(query: string, delay: number = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  return debouncedQuery;
}
```

## 8. Error Handling & Loading States

### 8.1 Error Boundaries

```tsx
// Error boundary for the flashcards view
function FlashcardsErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold">Wystąpił błąd</h3>
          <p className="text-muted-foreground mb-4">Nie udało się załadować fiszek. Spróbuj odświeżyć stronę.</p>
          <Button onClick={() => window.location.reload()}>Odśwież stronę</Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
```

### 8.2 Loading States

```tsx
// Different loading states for different operations
function LoadingStates() {
  return (
    <>
      {/* Initial loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner className="w-8 h-8" />
          <span className="ml-2">Ładowanie fiszek...</span>
        </div>
      )}

      {/* Bulk delete loading */}
      {isBulkDeleting && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <Spinner className="w-6 h-6 mr-2" />
            <span>Usuwanie zaznaczonych fiszek...</span>
          </div>
        </div>
      )}

      {/* Skeleton loading for table */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}
    </>
  );
}
```

## 9. Mobile-specific Optimizations

### 9.1 Touch-friendly Interface

```tsx
// Mobile-optimized row component
function MobileFlashcardCard({ flashcard, ...props }: FlashcardRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      {/* Selection and main content */}
      <div className="flex items-start space-x-3">
        <Checkbox checked={isSelected} onChange={onSelect} className="mt-1 touch-manipulation" />

        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground break-words">{flashcard.front_text}</p>

          {!isExpanded && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{flashcard.back_text}</p>}

          {isExpanded && (
            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{flashcard.back_text}</p>
          )}
        </div>
      </div>

      {/* Meta information */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Badge variant={sourceInfo.variant} className="text-xs">
            {sourceInfo.label}
          </Badge>
          <span>{formatRelativeDate(flashcard.created_at)}</span>
        </div>

        <Badge variant={dueStatus.variant} className="text-xs">
          {dueStatus.label}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="text-xs">
          {isExpanded ? "Zwiń" : "Rozwiń"}
        </Button>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="text-xs">
            Edytuj
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-xs text-destructive">
            Usuń
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 9.2 Swipe Actions (przyszłość)

```tsx
// Swipe gestures for mobile (future enhancement)
function useSwipeActions() {
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  const handleSwipeStart = (e: TouchEvent) => {
    // Track swipe start
  };

  const handleSwipeEnd = (e: TouchEvent) => {
    // Handle swipe completion
    // Left swipe = Edit
    // Right swipe = Delete
  };

  return { handleSwipeStart, handleSwipeEnd, swipeDirection };
}
```

## 10. Integration z Astro

### 10.1 Astro Page Component

```astro
---
// src/pages/flashcards.astro
import Layout from "../layouts/Layout.astro";
import { Navigation } from "../components/navigation/Navigation";
import { FlashcardsView } from "../components/flashcards/FlashcardsView";

// Auth check
const { user } = Astro.locals;
if (!user) {
  return Astro.redirect("/auth/login");
}

const currentPath = Astro.url.pathname;

// Server-side data loading (optional, for SSR)
let initialFlashcards = null;
let initialStats = null;

try {
  // Pre-load first page of flashcards for faster initial render
  const response = await fetch(`${Astro.url.origin}/api/flashcards?limit=20`, {
    headers: {
      Authorization: `Bearer ${user.access_token}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    initialFlashcards = data.data.flashcards;
  }

  // Pre-load stats
  const statsResponse = await fetch(`${Astro.url.origin}/api/flashcards/stats`, {
    headers: {
      Authorization: `Bearer ${user.access_token}`,
    },
  });

  if (statsResponse.ok) {
    const statsData = await statsResponse.json();
    initialStats = statsData.data;
  }
} catch (error) {
  console.error("Failed to pre-load flashcards:", error);
}

const userData = {
  id: user.id,
  email: user.email || "",
  email_confirmed: !!user.email_confirmed_at,
  created_at: user.created_at ? new Date(user.created_at) : new Date(),
};
---

<Layout title="Moje fiszki - 10xCards">
  <Navigation user={userData} currentPath={currentPath} client:load />

  <FlashcardsView user={userData} initialFlashcards={initialFlashcards} initialStats={initialStats} client:load />
</Layout>
```
