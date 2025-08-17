# Schemat bazy danych 10xCards

## 1. Tabele

### users

This table is managed by Supabase Auth.

- id: UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- email: VARCHAR(255) NOT NULL UNIQUE
- password_hash: TEXT NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- is_deleted: BOOLEAN NOT NULL DEFAULT false

### flashcards

- id: UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- user_id: UUID NOT NULL REFERENCES users(id)
- front_text: VARCHAR(200) NOT NULL
- back_text: VARCHAR(500) NOT NULL
- front_text_hash: CHAR(64) NOT NULL -- SHA-256 hash of front_text for fast duplicate checking
- back_text_hash: CHAR(64) NOT NULL -- SHA-256 hash of back_text for content similarity
- source: VARCHAR(20) NOT NULL CHECK (source IN ('ai-full','ai-edit','manual'))
- due: TIMESTAMPTZ NOT NULL DEFAULT now()
- scheduled_days: INTEGER NOT NULL DEFAULT 0
- difficulty: REAL NOT NULL DEFAULT 2.5
- reps: INTEGER NOT NULL DEFAULT 0
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- is_deleted: BOOLEAN NOT NULL DEFAULT false

### review_records

- id: UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- flashcard_id: UUID NOT NULL REFERENCES flashcards(id)
- user_id: UUID NOT NULL REFERENCES users(id)
- rating: SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 4)
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- is_deleted: BOOLEAN NOT NULL DEFAULT false

## 2. Relacje

- users 1 → \* flashcards
- users 1 → \* review_records
- flashcards 1 → \* review_records

## 3. Indeksy

- PRIMARY KEY jest automatycznie indeksowany na kolumnie `id` w każdej tabeli
- UNIQUE INDEX `ux_flashcards_user_front` ON `flashcards`(`user_id`, `front_text`) WHERE `is_deleted` = false
- INDEX `idx_flashcards_user_front_hash` ON `flashcards`(`user_id`, `front_text_hash`) WHERE `is_deleted` = false -- Fast duplicate detection
- INDEX `idx_flashcards_back_hash` ON `flashcards`(`back_text_hash`) WHERE `is_deleted` = false -- Content similarity search
- INDEX `idx_flashcards_user_due` ON `flashcards`(`user_id`, `due`)
- INDEX `idx_flashcards_user_created_at` ON `flashcards`(`user_id`, `created_at`)
- INDEX `idx_review_records_flashcard_created_at` ON `review_records`(`flashcard_id`, `created_at`)

## 4. Zasady PostgreSQL

### Włączenie rozszerzenia

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Triggery (aktualizacja updated_at)

```sql
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate SHA-256 hash for flashcard content
CREATE FUNCTION calculate_flashcard_hashes() RETURNS trigger AS $$
BEGIN
  NEW.front_text_hash = encode(digest(NEW.front_text, 'sha256'), 'hex');
  NEW.back_text_hash = encode(digest(NEW.back_text, 'sha256'), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_flashcards
  BEFORE UPDATE ON flashcards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_calculate_flashcard_hashes
  BEFORE INSERT OR UPDATE ON flashcards
  FOR EACH ROW EXECUTE FUNCTION calculate_flashcard_hashes();
```

### RLS (Row Level Security)

```sql
-- users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_users ON users
  FOR SELECT USING (auth.uid() = id AND is_deleted = false);
CREATE POLICY insert_users ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY update_users ON users
  FOR UPDATE USING (auth.uid() = id);

-- flashcards
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_flashcards ON flashcards
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = false);
CREATE POLICY insert_flashcards ON flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_flashcards ON flashcards
  FOR UPDATE USING (auth.uid() = user_id AND is_deleted = false);

-- review_records
ALTER TABLE review_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_reviews ON review_records
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = false);
CREATE POLICY insert_reviews ON review_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_reviews ON review_records
  FOR UPDATE USING (auth.uid() = user_id AND is_deleted = false);
```

## 5. Dodatkowe uwagi

- W przyszłości można rozważyć partycjonowanie tabel `flashcards` lub `review_records` (np. według user_id lub due) w celu poprawy wydajności.
- Weryfikacja duplikatów `front_text` realizowana jest przez unikalny warunkowy indeks.
- **Hash-based duplicate detection**: Kolumny `front_text_hash` i `back_text_hash` umożliwiają szybkie sprawdzanie duplikatów i podobieństwa treści bez pełnego skanowania tekstu.
- **Content similarity**: `back_text_hash` może być używany do znajdowania podobnych fiszek między użytkownikami (future feature).
- **AI caching**: Hashe mogą być używane do cache'owania wyników AI dla identycznych tekstów wejściowych.
- Soft delete realizowany jest przez kolumnę `is_deleted` oraz RLS filtrujące usunięte wiersze.
- Mechanizm retry i circuit-breaker implementowany jest w warstwie aplikacji (Openrouter.ai).
