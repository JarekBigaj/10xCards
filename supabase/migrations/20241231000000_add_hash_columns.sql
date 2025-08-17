-- Migration: Add hash columns for duplicate detection and content similarity
-- Purpose: Add front_text_hash and back_text_hash columns for performance optimization
-- Affected tables: flashcards
-- Dependencies: Requires pgcrypto extension for digest function

-- Enable pgcrypto extension for SHA-256 hashing
create extension if not exists "pgcrypto";

-- Add hash columns to flashcards table
alter table flashcards 
add column front_text_hash char(64) not null default '',
add column back_text_hash char(64) not null default '';

-- Create function to calculate SHA-256 hash for flashcard content
create or replace function calculate_flashcard_hashes() returns trigger as $$
begin
  new.front_text_hash = encode(digest(new.front_text, 'sha256'), 'hex');
  new.back_text_hash = encode(digest(new.back_text, 'sha256'), 'hex');
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically calculate hashes on insert/update
create trigger trg_calculate_flashcard_hashes
  before insert or update on flashcards
  for each row execute function calculate_flashcard_hashes();

-- Populate existing records with hashes
update flashcards set 
  front_text_hash = encode(digest(front_text, 'sha256'), 'hex'),
  back_text_hash = encode(digest(back_text, 'sha256'), 'hex');

-- Create indexes for fast duplicate detection
create index idx_flashcards_user_front_hash 
on flashcards(user_id, front_text_hash) 
where is_deleted = false;

create index idx_flashcards_back_hash 
on flashcards(back_text_hash) 
where is_deleted = false;

-- Remove default empty string constraint now that data is populated
alter table flashcards 
alter column front_text_hash drop default,
alter column back_text_hash drop default; 