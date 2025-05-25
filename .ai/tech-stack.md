# Technology Stack – rozszerzone uzasadnienie wyboru

Poniżej znajduje się szczegółowy opis użytych technologii wraz z kluczowymi powodami, dla których zostały wybrane pod kątem realizacji MVP z PRD.

## Frontend

- **Astro 5**  
  Umożliwia hybrydowe podejście SSG/SPA, pozwalające szybko wygenerować statyczne strony (speed + SEO) i osadzić w nich interaktywne komponenty React. Niska bariera wejścia, gotowe schematy layoutów i doskonała integracja z Tailwind CSS.

- **React 19**  
  Biblioteka de-facto do budowania dynamicznych interfejsów. Zapewnia zarządzanie stanem, ładowanie komponentów w locie i bogaty ekosystem (hooki, context, itp.), co przyspiesza development bardziej złożonych widoków (tabele, modale, inline editing).

- **TypeScript 5**  
  Statyczne typowanie na poziomie kodu pozwala wychwycić błędy już na etapie kompilacji, ułatwia refaktoryzację i dokumentowanie kontraktów (props, DTO, entity). Zwiększa czytelność i stabilność w zespole większym niż 1–2 osoby.

- **Tailwind CSS 4**  
  Utility-first CSS przyspieszające tworzenie spójnych, responsywnych interfejsów bez pisania własnych klas. Minimalizuje specyficzne dla projektu stylesheety, skraca czas prototypowania.

- **Shadcn/ui**  
  Kolekcja gotowych komponentów UI zbudowanych w oparciu o Tailwind. Zapewnia spójność wizualną i zachowań (modale, przyciski, formularze), redukując potrzebę implementowania ich od zera.

## Backend & Baza Danych

- **Supabase**  
  Kompleksowe rozwiązanie "PostgreSQL as a Service" z wbudowanym Auth, Storage, Edge Functions i real-time.  
  • Szybki start bez konieczności zarządzania serwerem  
  • Row-level security pozwala precyzyjnie kontrolować dostęp do fiszek każdego użytkownika  
  • Skalowalność wraz ze wzrostem danych i ruchu

## Komunikacja z AI

- **Openrouter.ai**  
  Abstrakcja nad różnymi dostawcami LLM (np. OpenAI, Anthropic).  
  • Umożliwia zmianę modelu/dostawcy bez przebudowy architektury  
  • Wymaga własnej implementacji retry (2× z back-off & jitter) i circuit-breaker, co daje pełną kontrolę nad logiką obsługi błędów

## CI/CD i Hosting

- **GitHub Actions**  
  Automatyzacja workflow: testy, budowa projektu i wdrożenia. Bez dodatkowych narzędzi – działa natywnie z repozytorium.

- **DigitalOcean (Droplets + Load Balancer)**  
  Prosty VPS z możliwością szybkiego skalowania pionowego (większy droplet) i poziomego (load-balancer + kolejne instancje).  
  • Niskie koszty początkowe (~5–10 USD/miesiąc)  
  • Wymaga ręcznej konfiguracji firewall, SSL, backupów i monitoringu, co warto zaplanować przy rozwoju po MVP
