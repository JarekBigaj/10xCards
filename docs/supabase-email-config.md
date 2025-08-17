# Konfiguracja Email Templates w Supabase Dashboard - 10xCards

## Przegląd

Ten dokument opisuje jak skonfigurować email templates w Supabase Dashboard dla aplikacji 10xCards, aby obsługiwać właściwe funkcje resetowania hasła i weryfikacji emaila.

## Wymagane konfiguracje

### 1. Ustawienia podstawowe Authentication

W Supabase Dashboard → Authentication → Settings:

#### General

- **Site URL**: `https://10xcards.com` (lub odpowiednia domena produkcyjna)
- **Additional redirect URLs**:
  - `http://localhost:4321/auth/reset-password` (development)
  - `https://10xcards.com/auth/reset-password` (production)

#### Email Auth

- **Enable email confirmations**: `true`
- **Enable email change confirmations**: `true`

### 2. Email Templates

W Supabase Dashboard → Authentication → Email Templates:

#### Confirm signup (Email Verification)

**Subject**: `Potwierdź swoje konto w 10xCards`

**Body (HTML)**:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Potwierdź swoje konto - 10xCards</title>
    <style>
      .container {
        max-width: 600px;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
        text-align: center;
      }
      .content {
        padding: 2rem;
        background: #ffffff;
      }
      .button {
        display: inline-block;
        background: #667eea;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        margin: 1rem 0;
      }
      .footer {
        padding: 1rem 2rem;
        background: #f8fafc;
        color: #64748b;
        font-size: 14px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎓 10xCards</h1>
        <p>Inteligentne fiszki z AI</p>
      </div>

      <div class="content">
        <h2>Potwierdź swoje konto</h2>
        <p>Cześć!</p>
        <p>
          Dziękujemy za założenie konta w 10xCards. Aby rozpocząć korzystanie z aplikacji, potwierdź swój adres email
          klikając przycisk poniżej:
        </p>

        <a href="{{ .ConfirmationURL }}" class="button">Potwierdź email</a>

        <p>Jeśli przycisk nie działa, skopiuj i wklej ten link do przeglądarki:</p>
        <p style="word-break: break-all; color: #667eea;">{{ .ConfirmationURL }}</p>

        <p>Ten link wygaśnie za 24 godziny.</p>

        <p>Jeśli nie zakładałeś konta w 10xCards, zignoruj tę wiadomość.</p>
      </div>

      <div class="footer">
        <p>10xCards - Ucz się efektywniej z AI</p>
        <p>Ta wiadomość została wysłana automatycznie. Nie odpowiadaj na nią.</p>
      </div>
    </div>
  </body>
</html>
```

#### Reset Password

**Subject**: `Resetowanie hasła - 10xCards`

**Body (HTML)**:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset hasła - 10xCards</title>
    <style>
      .container {
        max-width: 600px;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
        text-align: center;
      }
      .content {
        padding: 2rem;
        background: #ffffff;
      }
      .button {
        display: inline-block;
        background: #dc2626;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        margin: 1rem 0;
      }
      .footer {
        padding: 1rem 2rem;
        background: #f8fafc;
        color: #64748b;
        font-size: 14px;
        text-align: center;
      }
      .warning {
        background: #fef2f2;
        border: 1px solid #fecaca;
        padding: 1rem;
        border-radius: 6px;
        margin: 1rem 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎓 10xCards</h1>
        <p>Inteligentne fiszki z AI</p>
      </div>

      <div class="content">
        <h2>🔐 Resetowanie hasła</h2>
        <p>Cześć!</p>
        <p>
          Otrzymaliśmy prośbę o reset hasła do Twojego konta w 10xCards. Kliknij przycisk poniżej, aby ustawić nowe
          hasło:
        </p>

        <a href="{{ .ConfirmationURL }}" class="button">Resetuj hasło</a>

        <p>Jeśli przycisk nie działa, skopiuj i wklej ten link do przeglądarki:</p>
        <p style="word-break: break-all; color: #dc2626;">{{ .ConfirmationURL }}</p>

        <div class="warning">
          <strong>⚠️ Ważne informacje bezpieczeństwa:</strong>
          <ul>
            <li>Ten link wygaśnie za 1 godzinę</li>
            <li>Link można użyć tylko raz</li>
            <li>Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość</li>
          </ul>
        </div>

        <p>Jeśli masz problemy z dostępem do konta, skontaktuj się z naszym wsparciem.</p>
      </div>

      <div class="footer">
        <p>10xCards - Ucz się efektywniej z AI</p>
        <p>Ta wiadomość została wysłana automatycznie. Nie odpowiadaj na nią.</p>
      </div>
    </div>
  </body>
</html>
```

#### Magic Link (opcjonalne)

**Subject**: `Zaloguj się do 10xCards`

**Body (HTML)**:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Zaloguj się - 10xCards</title>
    <style>
      .container {
        max-width: 600px;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
        text-align: center;
      }
      .content {
        padding: 2rem;
        background: #ffffff;
      }
      .button {
        display: inline-block;
        background: #16a34a;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        margin: 1rem 0;
      }
      .footer {
        padding: 1rem 2rem;
        background: #f8fafc;
        color: #64748b;
        font-size: 14px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎓 10xCards</h1>
        <p>Inteligentne fiszki z AI</p>
      </div>

      <div class="content">
        <h2>Zaloguj się do swojego konta</h2>
        <p>Cześć!</p>
        <p>Kliknij przycisk poniżej, aby zalogować się do swojego konta 10xCards:</p>

        <a href="{{ .ConfirmationURL }}" class="button">Zaloguj się</a>

        <p>Jeśli przycisk nie działa, skopiuj i wklej ten link do przeglądarki:</p>
        <p style="word-break: break-all; color: #16a34a;">{{ .ConfirmationURL }}</p>

        <p>Ten link wygaśnie za 1 godzinę z powodów bezpieczeństwa.</p>

        <p>Jeśli nie prosiłeś o logowanie, zignoruj tę wiadomość.</p>
      </div>

      <div class="footer">
        <p>10xCards - Ucz się efektywniej z AI</p>
        <p>Ta wiadomość została wysłana automatycznie. Nie odpowiadaj na nią.</p>
      </div>
    </div>
  </body>
</html>
```

### 3. URL Configuration

W każdym template, upewnij się że redirect URLs są poprawnie skonfigurowane:

#### Development URLs:

- `http://localhost:4321/auth/reset-password`
- `http://localhost:4321/auth/verify`

#### Production URLs:

- `https://10xcards.com/auth/reset-password`
- `https://10xcards.com/auth/verify`

### 4. SMTP Configuration (Opcjonalne)

Jeśli chcesz używać własnego serwera SMTP zamiast domyślnego Supabase:

W Supabase Dashboard → Authentication → Settings → SMTP Settings:

#### Gmail SMTP (przykład):

- **SMTP Host**: `smtp.gmail.com`
- **SMTP Port**: `587`
- **SMTP User**: `your-app@gmail.com`
- **SMTP Pass**: `your-app-password`
- **SMTP Admin Email**: `admin@10xcards.com`

#### SendGrid SMTP (zalecane dla produkcji):

- **SMTP Host**: `smtp.sendgrid.net`
- **SMTP Port**: `587`
- **SMTP User**: `apikey`
- **SMTP Pass**: `your-sendgrid-api-key`
- **SMTP Admin Email**: `noreply@10xcards.com`

### 5. Testing Email Templates

Po skonfigurowaniu templates:

1. **Test Email Confirmation**:
   - Zarejestruj się nowym kontem
   - Sprawdź czy email z potwierdzeniem przychodzi
   - Kliknij link i sprawdź czy przekierowuje do właściwej strony

2. **Test Password Reset**:
   - Użyj funkcji "Zapomniałeś hasła?"
   - Sprawdź czy email przychodzi
   - Kliknij link i sprawdź czy można ustawić nowe hasło

3. **Test Redirect URLs**:
   - Upewnij się że wszystkie linki przekierowują do właściwych stron
   - Sprawdź zarówno na development jak i production

## Dodatkowe uwagi

### Bezpieczeństwo

- Ustaw krótki czas wygaśnięcia linków (1-24 godziny)
- Używaj HTTPS w production
- Regularnie sprawdzaj logi autentykacji

### Personalizacja

- Dostosuj kolory do branding aplikacji
- Dodaj logo firmy do header
- Zmień tone of voice na odpowiedni dla Twojej marki

### Monitoring

- Monitoruj delivery rates w Supabase Analytics
- Sprawdzaj bounce rates i spam reports
- Testuj templates na różnych klientach email

## Checklist implementacji

- [ ] Skonfigurowano Site URL
- [ ] Dodano redirect URLs
- [ ] Stworzono template "Confirm signup"
- [ ] Stworzono template "Reset password"
- [ ] (Opcjonalnie) Stworzono template "Magic Link"
- [ ] Skonfigurowano SMTP (jeśli wymagane)
- [ ] Przetestowano proces rejestracji
- [ ] Przetestowano reset hasła
- [ ] Sprawdzono działanie na różnych klientach email
- [ ] Zweryfikowano redirect URLs w production
