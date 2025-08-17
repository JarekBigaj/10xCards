-- Migration: Fix RLS policy for soft deleting flashcards
-- Purpose: Fix the incorrect WITH CHECK clause in the soft delete policy
-- Affected tables: flashcards, review_records

-- Drop the incorrect soft delete policy
DROP POLICY IF EXISTS "Users can soft delete own flashcards" ON flashcards;

-- Create corrected soft delete policy
CREATE POLICY "Users can soft delete own flashcards" ON flashcards
  FOR UPDATE USING (auth.uid() = user_id AND is_deleted = false)
  WITH CHECK (auth.uid() = user_id);

-- Drop the incorrect soft delete policy for review_records
DROP POLICY IF EXISTS "Users can soft delete own reviews" ON review_records;

-- Create corrected soft delete policy for review_records
CREATE POLICY "Users can soft delete own reviews" ON review_records
  FOR UPDATE USING (auth.uid() = user_id AND is_deleted = false)
  WITH CHECK (auth.uid() = user_id);
