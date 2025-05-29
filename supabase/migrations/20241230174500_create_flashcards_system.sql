-- Migration: Create flashcards system
-- Purpose: Initial migration to create the core flashcard tables, indexes, triggers, and RLS policies
-- Affected tables: flashcards, review_records
-- Special considerations: Users table is managed by Supabase Auth, implementing soft delete pattern

-- Enable UUID extension for primary keys
create extension if not exists "uuid-ossp";

-- Create flashcards table
-- This table stores user flashcards with spaced repetition algorithm data
create table flashcards (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id),
    front_text varchar(200) not null,
    back_text varchar(500) not null,
    source varchar(20) not null check (source in ('ai-full','ai-edit','manual')),
    due timestamptz not null default now(),
    scheduled_days integer not null default 0,
    difficulty real not null default 2.5,
    reps integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    is_deleted boolean not null default false
);

-- Create review_records table
-- This table stores the history of flashcard reviews for analytics and algorithm improvements
create table review_records (
    id uuid primary key default uuid_generate_v4(),
    flashcard_id uuid not null references flashcards(id),
    user_id uuid not null references auth.users(id),
    rating smallint not null check (rating between 1 and 4),
    created_at timestamptz not null default now(),
    is_deleted boolean not null default false
);

-- Create indexes for optimal query performance

-- Unique index to prevent duplicate front_text per user (excluding deleted records)
create unique index ux_flashcards_user_front 
on flashcards(user_id, front_text) 
where is_deleted = false;

-- Index for finding due flashcards for a user (main query pattern for study sessions)
create index idx_flashcards_user_due 
on flashcards(user_id, due);

-- Index for finding recently created flashcards for a user
create index idx_flashcards_user_created_at 
on flashcards(user_id, created_at);

-- Index for finding review records for a specific flashcard ordered by creation time
create index idx_review_records_flashcard_created_at 
on review_records(flashcard_id, created_at);

-- Create trigger function for automatically updating updated_at timestamps
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for flashcards table to auto-update updated_at on modifications
create trigger trg_set_updated_at_flashcards
  before update on flashcards
  for each row execute function set_updated_at();

-- Enable Row Level Security on all tables

-- Enable RLS on flashcards table
alter table flashcards enable row level security;

-- RLS policies for flashcards - users can only access their own non-deleted flashcards
create policy select_flashcards on flashcards
  for select using (auth.uid() = user_id and is_deleted = false);

create policy insert_flashcards on flashcards
  for insert with check (auth.uid() = user_id);

create policy update_flashcards on flashcards
  for update using (auth.uid() = user_id and is_deleted = false);

-- Enable RLS on review_records table
alter table review_records enable row level security;

-- RLS policies for review_records - users can only access their own non-deleted records
create policy select_reviews on review_records
  for select using (auth.uid() = user_id and is_deleted = false);

create policy insert_reviews on review_records
  for insert with check (auth.uid() = user_id);

create policy update_reviews on review_records
  for update using (auth.uid() = user_id and is_deleted = false); 