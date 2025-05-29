-- Migration: Disable RLS policies
-- Purpose: Drop all RLS policies from flashcards and review_records tables
-- Affected tables: flashcards, review_records

-- Drop all RLS policies from flashcards table
drop policy if exists select_flashcards on flashcards;
drop policy if exists insert_flashcards on flashcards;
drop policy if exists update_flashcards on flashcards;

-- Drop all RLS policies from review_records table
drop policy if exists select_reviews on review_records;
drop policy if exists insert_reviews on review_records;
drop policy if exists update_reviews on review_records; 