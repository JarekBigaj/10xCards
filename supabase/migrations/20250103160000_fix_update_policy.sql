-- Migration: Fix UPDATE policy to not require access after update
-- Purpose: Change UPDATE policy to only check state before update, not after
-- Affected tables: flashcards

-- Drop the current UPDATE policy
DROP POLICY IF EXISTS "Users can update own flashcards" ON flashcards;

-- Create corrected UPDATE policy that only checks state before update
CREATE POLICY "Users can update own flashcards" ON flashcards
  FOR UPDATE USING (auth.uid() = user_id AND is_deleted = false);
