-- Migration: Remove duplicate UPDATE policy for flashcards
-- Purpose: Remove the duplicate "Users can soft delete own flashcards" policy
-- Affected tables: flashcards

-- Drop the duplicate soft delete policy
DROP POLICY IF EXISTS "Users can soft delete own flashcards" ON flashcards;

-- The "Users can update own flashcards" policy already handles all UPDATE operations
-- including soft deletion, so we don't need a separate policy for it.
