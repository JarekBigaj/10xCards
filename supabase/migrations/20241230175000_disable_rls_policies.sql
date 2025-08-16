-- Migration: Disable RLS policies and RLS itself
-- Purpose: Drop all RLS policies and disable RLS on flashcards and review_records tables
-- Affected tables: flashcards, review_records

-- Drop all RLS policies from flashcards table
drop policy if exists select_flashcards on flashcards;
drop policy if exists insert_flashcards on flashcards;
drop policy if exists update_flashcards on flashcards;

-- Drop all RLS policies from review_records table
drop policy if exists select_reviews on review_records;
drop policy if exists insert_reviews on review_records;
drop policy if exists update_reviews on review_records;

-- Disable Row Level Security on both tables
alter table flashcards disable row level security;
alter table review_records disable row level security; 