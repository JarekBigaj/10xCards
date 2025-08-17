-- Migration: Create test user for development
-- Purpose: Create a test user in auth.users table for development testing
-- Affected tables: auth.users

-- Insert test user into auth.users table
-- This allows us to use DEFAULT_USER_ID in flashcards without foreign key violations
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
) VALUES (
    '7ce3aad3-1038-41bc-b901-5a225e52b2db',
    '00000000-0000-0000-0000-000000000000',
    'test@example.com',
    '$2a$10$TEST.HASH.FOR.DEVELOPMENT.ONLY.DO.NOT.USE.IN.PRODUCTION',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Test User"}',
    false,
    'authenticated',
    'authenticated'
) ON CONFLICT (id) DO NOTHING;
