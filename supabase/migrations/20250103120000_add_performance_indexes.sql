-- Performance Indexes for Flashcards System
-- Created for "Moje fiszki" functionality improvements

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable trigram extension for similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- Full-text search index with default English configuration
-- This enables efficient search across front_text and back_text fields
CREATE INDEX IF NOT EXISTS idx_flashcards_fulltext_search
ON flashcards USING gin(
  to_tsvector('english', front_text || ' ' || back_text)
)
WHERE is_deleted = false;

-- Simple text search indexes for basic ILIKE operations
-- These are more lightweight alternatives for simple text matching
CREATE INDEX IF NOT EXISTS idx_flashcards_front_text_trgm
ON flashcards USING gin(front_text gin_trgm_ops)
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_flashcards_back_text_trgm  
ON flashcards USING gin(back_text gin_trgm_ops)
WHERE is_deleted = false;

-- ============================================================================
-- COMPOSITE INDEXES FOR FILTERING
-- ============================================================================

-- User + created_at index for date-based filtering and sorting
CREATE INDEX IF NOT EXISTS idx_flashcards_user_created
ON flashcards(user_id, created_at DESC)
WHERE is_deleted = false;

-- User + difficulty index for difficulty-based filtering
CREATE INDEX IF NOT EXISTS idx_flashcards_user_difficulty
ON flashcards(user_id, difficulty)
WHERE is_deleted = false;

-- User + reps index for repetition-based filtering
CREATE INDEX IF NOT EXISTS idx_flashcards_user_reps
ON flashcards(user_id, reps)
WHERE is_deleted = false;

-- User + due date index for due-based filtering and sorting
CREATE INDEX IF NOT EXISTS idx_flashcards_user_due
ON flashcards(user_id, due)
WHERE is_deleted = false;

-- User + source index for source-based filtering
CREATE INDEX IF NOT EXISTS idx_flashcards_user_source
ON flashcards(user_id, source)
WHERE is_deleted = false;

-- ============================================================================
-- SPECIALIZED INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Index for "never reviewed" flashcards (reps = 0)
CREATE INDEX IF NOT EXISTS idx_flashcards_never_reviewed
ON flashcards(user_id, created_at DESC)
WHERE is_deleted = false AND reps = 0;

-- Index for due date queries (without time-based predicates)
CREATE INDEX IF NOT EXISTS idx_flashcards_due_queries
ON flashcards(user_id, due, is_deleted)
WHERE is_deleted = false;

-- ============================================================================
-- MULTI-COLUMN INDEXES FOR COMPLEX FILTERING
-- ============================================================================

-- Combined index for source and difficulty filtering
CREATE INDEX IF NOT EXISTS idx_flashcards_user_source_difficulty
ON flashcards(user_id, source, difficulty)
WHERE is_deleted = false;

-- Combined index for date range queries with sorting
CREATE INDEX IF NOT EXISTS idx_flashcards_user_created_range
ON flashcards(user_id, created_at, updated_at)
WHERE is_deleted = false;

-- Combined index for reps and difficulty (for learning analytics)
CREATE INDEX IF NOT EXISTS idx_flashcards_user_reps_difficulty
ON flashcards(user_id, reps, difficulty)
WHERE is_deleted = false;

-- ============================================================================
-- HASH INDEXES FOR DUPLICATE DETECTION
-- ============================================================================

-- Hash-based index for front_text_hash (faster exact duplicate detection)
CREATE INDEX IF NOT EXISTS idx_flashcards_front_hash
ON flashcards USING hash(front_text_hash)
WHERE is_deleted = false;

-- Combined index for user + front_text_hash (most common duplicate check)
CREATE INDEX IF NOT EXISTS idx_flashcards_user_front_hash
ON flashcards(user_id, front_text_hash)
WHERE is_deleted = false;

-- ============================================================================
-- STATISTICS AND ANALYTICS INDEXES
-- ============================================================================

-- Index optimized for statistics calculations
CREATE INDEX IF NOT EXISTS idx_flashcards_stats
ON flashcards(user_id, source, difficulty, reps, created_at, due)
WHERE is_deleted = false;

-- Partial index for active flashcards (not deleted)
CREATE INDEX IF NOT EXISTS idx_flashcards_active
ON flashcards(user_id, updated_at DESC)
WHERE is_deleted = false;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION NOTES
-- ============================================================================

-- The following indexes are designed to support:
-- 1. Full-text search across flashcard content
-- 2. Efficient filtering by user, date ranges, difficulty, and repetitions
-- 3. Fast duplicate detection using content hashes
-- 4. Optimized statistics calculations
-- 5. Support for bulk operations

-- Monitor index usage with:
-- SELECT schemaname, tablename, attname, n_distinct, correlation 
-- FROM pg_stats WHERE tablename = 'flashcards';

-- Check index usage:
-- SELECT indexrelname, idx_tup_read, idx_tup_fetch, idx_scan
-- FROM pg_stat_user_indexes WHERE relname = 'flashcards';

-- For very large datasets, consider partitioning by user_id or date
-- if the number of flashcards per user exceeds 100,000+
