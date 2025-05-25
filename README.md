# 10xCards

A web application for generating and managing educational flashcards using AI and spaced repetition.

## Table of Contents

1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started Locally](#getting-started-locally)
4. [Available Scripts](#available-scripts)
5. [Project Scope](#project-scope)
6. [Project Status](#project-status)
7. [License](#license)

## Project Description

10xCards is a web application that automates the creation and management of flashcards. Users can:

- Paste text (1,000–10,000 characters) and generate AI-powered flashcard candidates.
- Review, accept, edit (inline or via modal), or reject generated cards.
- Manually create, edit, and delete flashcards.
- Log in and manage their account securely.

The MVP includes a simple user authentication system, AI error handling with retry and circuit-breaker, and storage of accepted flashcards with metadata.

## Tech Stack

- **Astro 5** for hybrid SSG/SPA and Tailwind CSS integration
- **React 19** for dynamic UI components
- **TypeScript 5** for static typing and improved maintainability
- **Tailwind CSS 4** & **Shadcn/ui** for utility-first styling and pre-built components
- **Supabase** (PostgreSQL, Auth, Storage, Edge Functions, real-time) for backend and database
- **Openrouter.ai** for AI provider abstraction with built-in retry and circuit-breaker
- **GitHub Actions** for CI/CD workflows
- **DigitalOcean** (Droplets + Load Balancer) for hosting

## Getting Started Locally

### Prerequisites

- Node.js 22.14.0 (use [nvm](https://github.com/nvm-sh/nvm) to manage versions: `nvm use 22.14.0`)
- npm (or yarn)
- A Supabase project and API keys
- An Openrouter API key

### Setup

```bash
# Clone repository
git clone https://github.com/<your-username>/10x-cards.git
cd 10x-cards

# Use the specified Node version
nvm use

# Install dependencies
npm install

# Copy environment variables template and configure
cp .env.example .env
# Edit .env and set SUPABASE_URL, SUPABASE_KEY, OPENROUTER_API_KEY

# Start development server
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.

## Available Scripts

In the project root, you can run:

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start Astro development server       |
| `npm run build`    | Build the project for production     |
| `npm run preview`  | Preview the production build locally |
| `npm run astro`    | Run the Astro CLI                    |
| `npm run lint`     | Lint all files with ESLint           |
| `npm run lint:fix` | Lint & auto-fix issues with ESLint   |
| `npm run format`   | Format code with Prettier            |

## Project Scope

### In-Scope (MVP)

- AI-powered flashcard generation with:
  - Text segmentation (1,000–10,000 characters)
  - Field validation (front ≤200 chars, back ≤500 chars)
  - 2× retry with back-off & jitter
  - Circuit-breaker for error thresholds
- Candidate review & acceptance (inline edit, modal for long text)
- Manual flashcard management (create, edit, delete)
- User accounts (registration, login, profile, deletion)
- Spaced repetition scheduling via ts-fsrs v4
- Session storage for draft candidates
- Telemetry & monitoring (retry counts, errors, response times)
- GDPR compliance (data handling & deletion on request)

### Out-of-Scope (MVP Boundaries)

- Advanced spaced repetition algorithms (e.g., SuperMemo, Anki)
- Gamification or rewards
- Public API
- Document import (PDF, DOCX)
- Flashcard sharing between users
- Third-party educational platform integrations
- Mobile app versions
- Export functionality
- Advanced notification system
- Keyword-based search

## Project Status

This project is currently in active development towards the MVP phase. Core features have been implemented, with ongoing work on improvements and additional user stories. Contributions and feedback are welcome!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
