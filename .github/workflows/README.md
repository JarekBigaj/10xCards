# CI/CD Workflows

## Przegląd

Projekt zawiera dwa główne workflow GitHub Actions:

### 1. `ci-cd.yml` - Główny pipeline CI/CD

**Uruchamiany automatycznie:**

- Po każdym push do `master`/`main`
- Po każdym pull request do `master`/`main`

**Uruchamiany manualnie:**

- Przez `workflow_dispatch` w GitHub UI

**Zawiera:**

- Linting i formatowanie kodu
- Testy jednostkowe z coverage
- Testy E2E z Playwright
- Build produkcyjny
- Audit bezpieczeństwa
- Sprawdzanie typów TypeScript

### 2. `deploy.yml` - Deployment

**Uruchamiany tylko manualnie:**

- Wymaga potwierdzenia przez `workflow_dispatch`
- Wybór środowiska (staging/production)

## Architektura

### Composite Actions

Workflow wykorzystuje composite actions dla lepszej reużywalności:

- **`.github/actions/checkout`** - Checkout kodu z repozytorium
- **`.github/actions/setup-node`** - Setup Node.js z npm caching

### Struktura Jobs

#### CI/CD Pipeline

```
lint-and-format → unit-tests → e2e-tests → build
     ↓                ↓           ↓         ↓
security-audit    type-check
```

#### Deployment

```
validate-deployment → deploy
```

## Konfiguracja

### Wymagane sekrety w GitHub repository

Przejdź do `Settings` → `Secrets and variables` → `Actions` i dodaj:

```bash
# Dla deploymentu (opcjonalne)
DIGITALOCEAN_ACCESS_TOKEN=your_token_here
DEPLOY_HOST=your_server_ip
DEPLOY_USER=your_username
DEPLOY_PATH=/var/www/10xcards
```

### Zmienne środowiskowe

Każdy job ma własne zmienne środowiskowe:

```yaml
env:
  NODE_VERSION: "22.14.0" # Zgodne z .nvmrc
```

### Plik env.example

Projekt zawiera `env.example` z kluczowymi zmiennymi:

- Supabase configuration
- OpenRouter AI configuration
- Database configuration
- Session configuration

## Uruchomienie manualne

### CI/CD Pipeline

1. Przejdź do `Actions` w GitHub
2. Wybierz `CI/CD Pipeline`
3. Kliknij `Run workflow`
4. Wybierz branch i kliknij `Run workflow`

### Deployment

1. Przejdź do `Actions` w GitHub
2. Wybierz `Deploy to Production`
3. Kliknij `Run workflow`
4. Wybierz środowisko (staging/production)
5. Wpisz "deploy" w polu potwierdzenia
6. Kliknij `Run workflow`

## Monitoring i artifacts

- **Coverage reports** - automatycznie uploadowane do Codecov
- **Playwright reports** - dostępne jako artifacts przez 30 dni
- **Build artifacts** - dostępne jako artifacts przez 30 dni

## Wersje Actions

Workflow używa najnowszych wersji GitHub Actions:

- `actions/checkout@v5`
- `actions/setup-node@v4`
- `actions/upload-artifact@v4`
- `codecov/codecov-action@v5`

## Troubleshooting

### Testy E2E nie przechodzą

- Sprawdź czy Playwright browsers są zainstalowane
- Sprawdź logi w GitHub Actions
- Uruchom lokalnie: `npm run test:e2e`

### Build nie przechodzi

- Sprawdź logi TypeScript
- Sprawdź czy wszystkie dependencies są zainstalowane
- Uruchom lokalnie: `npm run build`

### Deployment nie działa

- Sprawdź sekrety w GitHub
- Sprawdź uprawnienia na serwerze
- Sprawdź logi deploymentu

### Composite Actions

- Sprawdź czy pliki `.github/actions/*/action.yml` istnieją
- Sprawdź składnię YAML w composite actions
- Sprawdź czy ścieżki do actions są poprawne
