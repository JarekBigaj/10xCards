-- Migration: Insert dummy flashcards for manual testing
-- Purpose: Add sample flashcard data for testing the GET /api/flashcards endpoint
-- Affected tables: flashcards
-- Test user: Uses DEFAULT_USER_ID from supabase.client.ts

-- Insert dummy flashcards with various sources, due dates, and difficulties
INSERT INTO flashcards (
    id,
    user_id,
    front_text,
    back_text,
    source,
    due,
    scheduled_days,
    difficulty,
    reps,
    created_at,
    updated_at
) VALUES 
-- AI-generated flashcards (recent)
(
    '11111111-1111-1111-1111-111111111111',
    '7ce3aad3-1038-41bc-b901-5a225e52b2db',
    'What is React?',
    'React is a JavaScript library for building user interfaces, particularly web applications. It was developed by Facebook and allows developers to create reusable UI components.',
    'ai-full',
    NOW() - INTERVAL '1 day',
    1,
    2.3,
    2,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '1 day'
),
(
    '22222222-2222-2222-2222-222222222222',
    '7ce3aad3-1038-41bc-b901-5a225e52b2db',
    'What is TypeScript?',
    'TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. It adds static type definitions to JavaScript.',
    'ai-full',
    NOW() + INTERVAL '2 days',
    3,
    2.1,
    1,
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '2 days'
),
-- AI-edited flashcards
(
    '33333333-3333-3333-3333-333333333333',
    '7ce3aad3-1038-41bc-b901-5a225e52b2db',
    'What is Astro?',
    'Astro is a modern static site generator that allows you to build faster websites with less client-side JavaScript. It supports multiple frameworks and focuses on performance.',
    'ai-edit',
    NOW() - INTERVAL '3 hours',
    0,
    2.5,
    0,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 hour'
),
(
    '44444444-4444-4444-4444-444444444444',
    '7ce3aad3-1038-41bc-b901-5a225e52b2db',
    'What is Supabase?',
    'Supabase is an open-source Firebase alternative that provides a backend-as-a-service platform with PostgreSQL database, authentication, real-time subscriptions, and storage.',
    'ai-edit',
    NOW() + INTERVAL '1 day',
    2,
    2.8,
    3,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '6 hours'
),
-- Manual flashcards
(
    '55555555-5555-5555-5555-555555555555',
    '7ce3aad3-1038-41bc-b901-5a225e52b2db',
    'What is the capital of France?',
    'The capital of France is Paris. It is located in the north-central part of the country and is known for landmarks like the Eiffel Tower and Louvre Museum.',
    'manual',
    NOW() + INTERVAL '5 days',
    7,
    1.9,
    4,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),
(
    '66666666-6666-6666-6666-666666666666',
    '7ce3aad3-1038-41bc-b901-5a225e52b2db',
    'What is 2 + 2?',
    'The answer is 4. This is basic arithmetic addition.',
    'manual',
    NOW() - INTERVAL '2 days',
    1,
    1.5,
    5,
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '3 days'
),
-- More flashcards for pagination testing
(
    '77777777-7777-7777-7777-777777777777',
    '7ce3aad3-1038-41bc-b901-5a225e52b2db',
    'What is Node.js?',
    'Node.js is a JavaScript runtime built on Chrome''s V8 JavaScript engine. It allows developers to run JavaScript on the server side.',
    'ai-full',
    NOW() + INTERVAL '3 days',
    5,
    2.4,
    2,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '4 days'
),
(
    '88888888-8888-8888-8888-888888888888',
    '7ce3aad3-1038-41bc-b901-5a225e52b2db',
    'What is CSS?',
    'CSS (Cascading Style Sheets) is a stylesheet language used to describe the presentation of a document written in HTML or XML.',
    'manual',
    NOW() + INTERVAL '1 hour',
    0,
    2.5,
    0,
    NOW() - INTERVAL '8 hours',
    NOW() - INTERVAL '8 hours'
),
(
    '99999999-9999-9999-9999-999999999999',
    '7ce3aad3-1038-41bc-b901-5a225e52b2db',
    'What is HTML?',
    'HTML (HyperText Markup Language) is the standard markup language for creating web pages and web applications.',
    'ai-edit',
    NOW() + INTERVAL '6 days',
    10,
    1.8,
    6,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '5 days'
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '7ce3aad3-1038-41bc-b901-5a225e52b2db',
    'What is JavaScript?',
    'JavaScript is a high-level, interpreted programming language that is one of the core technologies of the World Wide Web, alongside HTML and CSS.',
    'ai-full',
    NOW() - INTERVAL '5 days',
    2,
    3.2,
    1,
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '6 days'
); 