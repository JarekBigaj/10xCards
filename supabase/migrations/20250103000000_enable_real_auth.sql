-- Migration: Enable real authentication and RLS policies
-- Purpose: Switch from test user to real authentication with RLS policies
-- Affected tables: flashcards, review_records

-- Enable Row Level Security on both tables
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for flashcards table
CREATE POLICY "Users can view own flashcards" ON flashcards
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "Users can insert own flashcards" ON flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards" ON flashcards
  FOR UPDATE USING (auth.uid() = user_id AND is_deleted = false)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft delete own flashcards" ON flashcards
  FOR UPDATE USING (auth.uid() = user_id AND is_deleted = false)
  WITH CHECK (auth.uid() = user_id AND is_deleted = true);

-- Create RLS policies for review_records table
CREATE POLICY "Users can view own reviews" ON review_records
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "Users can insert own reviews" ON review_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft delete own reviews" ON review_records
  FOR UPDATE USING (auth.uid() = user_id AND is_deleted = false)
  WITH CHECK (auth.uid() = user_id AND is_deleted = true);

-- Optional: Clean up dummy flashcards (they will be inaccessible with RLS anyway)
-- Uncomment if you want to remove test data:
-- DELETE FROM flashcards WHERE user_id = '7ce3aad3-1038-41bc-b901-5a225e52b2db';
-- DELETE FROM review_records WHERE user_id = '7ce3aad3-1038-41bc-b901-5a225e52b2db';
