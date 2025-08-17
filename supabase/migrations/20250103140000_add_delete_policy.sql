-- Migration: Fix UPDATE policy for soft deleting flashcards
-- Purpose: Fix the UPDATE policy to allow soft deletion without SELECT access conflicts
-- Affected tables: flashcards

-- Drop the problematic soft delete policy
DROP POLICY IF EXISTS "Users can soft delete own flashcards" ON flashcards;

-- Create corrected soft delete policy that doesn't conflict with SELECT
CREATE POLICY "Users can soft delete own flashcards" ON flashcards
  FOR UPDATE USING (auth.uid() = user_id AND is_deleted = false)
  WITH CHECK (auth.uid() = user_id);

-- Also fix the policy for review_records
DROP POLICY IF EXISTS "Users can soft delete own reviews" ON review_records;

-- Create corrected soft delete policy for review_records
CREATE POLICY "Users can soft delete own reviews" ON review_records
  FOR UPDATE USING (auth.uid() = user_id AND is_deleted = false)
  WITH CHECK (auth.uid() = user_id);
