-- Migration: Restore original working RLS policies
-- Purpose: Restore the original policies that were working before my changes
-- Affected tables: flashcards, review_records

-- Drop all current policies
DROP POLICY IF EXISTS "Users can view own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can insert own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can update own flashcards" ON flashcards;

-- Restore original policies from 20250103000000_enable_real_auth.sql
CREATE POLICY "Users can view own flashcards" ON flashcards
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "Users can insert own flashcards" ON flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards" ON flashcards
  FOR UPDATE USING (auth.uid() = user_id AND is_deleted = false)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft delete own flashcards" ON flashcards
  FOR UPDATE USING (auth.uid() = user_id AND is_deleted = false)
  WITH CHECK (auth.uid() = user_id);

-- Restore policies for review_records
DROP POLICY IF EXISTS "Users can view own reviews" ON review_records;
DROP POLICY IF EXISTS "Users can insert own reviews" ON review_records;
DROP POLICY IF EXISTS "Users can soft delete own reviews" ON review_records;

CREATE POLICY "Users can view own reviews" ON review_records
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "Users can insert own reviews" ON review_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft delete own reviews" ON review_records
  FOR UPDATE USING (auth.uid() = user_id AND is_deleted = false)
  WITH CHECK (auth.uid() = user_id);
