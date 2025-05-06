# Dokument wymagań produktu (PRD) - MemoSpark

## 1. Przegląd produktu

FiszkiAI to webowa aplikacja do generowania i zarządzania kartami edukacyjnymi (flashcards) wykorzystująca sztuczną inteligencję (AI) i bibliotekę ts-fsrs v4 (Node ≥18, MIT) do planowania powtórek spaced repetition. Użytkownik może wkleić tekst (1000–10000 znaków), a system automatycznie segmentuje i generuje kandydatów na fiszki. Dodatkowo dostępne jest ręczne tworzenie, edycja oraz usuwanie fiszek. Założeniem MVP jest prosty system kont użytkowników, mechanizmy obsługi błędów AI z retry i circuit-breakerem oraz przechowywanie zaakceptowanych fiszek w bazie z metadanymi.

## 2. Problem użytkownika

Manualne przygotowywanie fiszek jest czasochłonne i wymaga dużego nakładu pracy, co zniechęca do korzystania ze sprawdzonej metody spaced repetition. Użytkownicy potrzebują technologii, która usprawni i przyspieszy proces tworzenia wysokiej jakości fiszek.

## 3. Wymagania funkcjonalne

1. Generowanie fiszek przez AI
   - akceptowany tekst od 1000 do 10000 znaków
   - automatyczne segmentowanie na potencjalne karty
   - walidacja długości pól „przód” (maks. 200 znaków) i „tył” (maks. 500 znaków) w frontendzie, backendzie i w bazie danych
   - retry 2 razy z back-offem i jitterem
   - circuit-breaker po przekroczeniu progu błędów
   - czytelny komunikat o błędzie i przycisk „Spróbuj ponownie”
   - telemetry: liczba retry, błędy, czasy odpowiedzi
2. Przegląd i akceptacja kandydatów
   - lista kandydatów w tabeli z inline edycją
   - modal do edycji przy bardzo długich treściach
   - akcje: akceptuj, edytuj, odrzuć, zapis zaakceptowanych
3. Ręczne tworzenie i zarządzanie fiszkami
   - formularz tworzenia z polami „przód” i „tył” z identyczną walidacją
   - przegląd, edycja i usuwanie istniejących fiszek
   - Ręczne tworzenie fiiszek i wyświetlanie w ramach widoku listy "Moje fiszki"
4. Konta użytkowników
   - rejestracja, logowanie, podgląd i usunięcie konta
   - bezpieczne uwierzytelnianie i autoryzacja dostępu
5. Integracja z ts-fsrs v4
   - planowanie powtórek zaakceptowanych fiszek
6. Przechowywanie kandydatów
   - session storage na froncie z zachowaniem po odświeżeniu strony
7. Monitoring
   - zbieranie informacji o tym, ile fiszek zostało wygenerowanych przez AI i ile z nich ostatecznie zaakceptowano
8. Wymagania prawne i ograniczenia:
   - Dane osobowe użytkowników i fiszek przechowywane zgodnie z RODO
   - Prawo do wglądu i usunięcia danych (konto wraz z fiszkami) na wniosek użytkownika

## 4. Granice produktu

W MVP nie obejmujemy:

- własnego, zaawansowanego algorytmu spaced repetition (SuperMemo, Anki)
- mechanizm gratyfikacji
- publicznie dostępne API
- importu dokumentów PDF, DOCX itp.
- udostępniania zestawów fiszek pomiędzy użytkownikami
- integracji z zewnętrznymi platformami edukacyjnymi
- aplikacji mobilnych
- eksportu fiszek
- rozbudowany system powiadomień
- zaawansowane wyszukiwanie fiszek po słowach kluczowych

## 5. Historyjki użytkowników

- US-001
  Tytuł: Rejestracja użytkownika
  Opis: Jako nowy użytkownik chcę się zarejestrować, aby korzystać z aplikacji i zapisywać moje fiszki.
  Kryteria akceptacji:

  - Po przejściu na stronę rejestracji widzę formularz z polami email, hasło, potwierdź hasło.
  - Dane są walidowane: email w formacie, hasło min. 8 znaków, potwierdzenie zgodne.
  - Po poprawnym wypełnieniu i wysłaniu formularz tworzy konto w bazie i przekierowuje do pulpitu.
  - Przy niepoprawnych danych wyświetlany jest odpowiedni komunikat walidacyjny.
  - Przy próbie rejestracji istniejącym adresem email otrzymuję informację „Email już zarejestrowany”.

- US-002
  Tytuł: Logowanie użytkownika
  Opis: Jako zarejestrowany użytkownik chcę się zalogować, aby uzyskać dostęp do moich fiszek.
  Kryteria akceptacji:

  - Na stronie logowania widzę pola email i hasło oraz przycisk „Zaloguj się”.
  - Po podaniu poprawnych danych zostaję przekierowany do pulpitu.
  - Przy niepoprawnych danych otrzymuję komunikat „Nieprawidłowy email lub hasło”.
  - Sesja jest utrzymywana przez czas określony w specyfikacji.

- US-003
  Tytuł: Zarządzanie kontem
  Opis: Jako zalogowany użytkownik chcę przeglądać oraz usuwać moje konto, aby mieć kontrolę nad moimi danymi.
  Kryteria akceptacji:

  - Na stronie profilu widzę opcję „Usuń konto”.
  - Po kliknięciu „Usuń konto” otrzymuję potwierdzenie operacji.
  - Po potwierdzeniu konto zostaje usunięte, a ja wylogowany.

- US-004
  Tytuł: Generowanie fiszek AI
  Opis: Jako użytkownik chcę wkleić tekst (1000–10000 znaków), aby system automatycznie wygenerował kandydatów na fiszki.
  Kryteria akceptacji:

  - Po wklejeniu tekstu w dozwolonym zakresie i kliknięciu „Generuj” widzę listę kandydatów w tabeli.
  - Każdy kandydat zawiera pola „przód” i „tył” zgodne z ograniczeniami długości.
  - System wykonuje maks. 2 retry przy błędach z back-offem i jitterem.
  - Przy przekroczeniu limitu błędów wyświetla się czytelny komunikat i przycisk „Spróbuj ponownie”.

- US-005
  Tytuł: Obsługa błędów generacji AI
  Opis: Jako użytkownik chcę otrzymywać jasne informacje o niepowodzeniach generacji i możliwość ponowienia próby.
  Kryteria akceptacji:

  - W przypadku awarii API AI system wykonuje 2 automatyczne retry (z back-offem i jitterem).
  - Po 3 nieudanych próbach wyświetla komunikat „Wystąpił błąd, spróbuj ponownie” oraz przycisk retry.
  - Wywołanie ponowienia resetuje licznik retry i ponawia próbę generacji.

- US-006
  Tytuł: Walidacja długości tekstu wejściowego
  Opis: Jako użytkownik chcę zostać poinformowany, jeśli wklejony tekst jest za krótki (<1000 znaków) lub za długi (>10000 znaków).
  Kryteria akceptacji:

  - W przypadku tekstu <1000 znaków pojawia się komunikat „Tekst jest za krótki, minimalnie 1000 znaków”.
  - W przypadku tekstu >10000 znaków pojawia się komunikat „Tekst jest za długi, maksymalnie 10000 znaków”.
  - Przy nieprawidłowej długości przycisk „Generuj” jest nieaktywny.

- US-007
  Tytuł: Przegląd i inline edycja kandydatów
  Opis: Jako użytkownik chcę przeglądać wygenerowane karty w tabeli i edytować je inline, aby szybko poprawić treść.
  Kryteria akceptacji:

  - Kandydaci wyświetlają się w tabeli z polami edytowalnymi inline.
  - Zmiany w polach są walidowane na bieżąco (maks. długości).
  - Po wyjściu z pola edycji zmiany są zapisywane lokalnie.

- US-008
  Tytuł: Modal dla długich treści
  Opis: Jako użytkownik chcę, aby bardzo długie treści fiszek były edytowane w modalnym oknie, by zachować czytelny interfejs.
  Kryteria akceptacji:

  - Dla fiszek, których pole „tył” przekracza 200 znaków, edycja odbywa się w modalnym oknie.
  - Modal zawiera pole tekstowe z pełnym tekstem i przyciski „Zapisz” oraz „Anuluj”.

- US-009
  Tytuł: Akceptacja, odrzucenie i zapis fiszek
  Opis: Jako użytkownik chcę zaakceptować lub odrzucić kandydatów oraz zapisać zaakceptowane fiszki w mojej kolekcji.
  Kryteria akceptacji:

  - Przy każdej karcie dostępne są przyciski „Akceptuj” i „Odrzuć”.
  - Po zaakceptowaniu karta znika z listy kandydatów i trafia do bazy z datą utworzenia.
  - Po odrzuceniu karta znika z widoku i nie zostaje zapisana.

- US-010
  Tytuł: Ręczne tworzenie fiszki
  Opis: Jako użytkownik chcę ręcznie dodać fiszkę, aby tworzyć własne karty poza generowanymi kandydatami.
  Kryteria akceptacji:

  - Widoczny jest formularz z polami „przód” i „tył” z limitem 200/500 znaków.
  - Po wypełnieniu i wysłaniu formularza fiszka zostaje zapisana w bazie.

- US-011
  Tytuł: Edycja istniejącej fiszki
  Opis: Jako użytkownik chcę edytować zapisane fiszki, aby poprawiać ich treść.
  Kryteria akceptacji:

  - Na liście moich fiszek dostępna jest opcja „Edytuj”.
  - Kliknięcie otwiera inline lub modal (zgodnie z długością) z walidacją długości.
  - Po zapisaniu zmiany są odzwierciedlone w bazie.

- US-012
  Tytuł: Usuwanie istniejącej fiszki
  Opis: Jako użytkownik chcę usuwać niepotrzebne fiszki, aby utrzymać porządek.
  Kryteria akceptacji:

  - Przy każdej fiszce jest przycisk „Usuń”.
  - Po kliknięciu wyświetla się potwierdzenie usunięcia.
  - Po potwierdzeniu fiszka zostaje trwale usunięta z bazy.

- US-013
  Tytuł: Przechowywanie kandydatów po odświeżeniu
  Opis: Jako użytkownik chcę, aby lista kandydatów nie znikała po odświeżeniu strony, żeby nie tracić postępów.
  Kryteria akceptacji:

  - Kandydaci są przechowywani w session storage.
  - Po odświeżeniu lista kandydatów jest odtwarzana.

- US-014
  Tytuł: Sesja nauki z algorytmem powtórek
  Opis: Jako użytkownik chcę, aby zaakceptowane fiszki były dostępne w widoku "Sesja nauki" oparte na algorytmie ts-fsrs v4, aby móc efektywnie się uczyć.
  Kryteria akceptacji:

  - W widoku "Sesja nauki" algorytm przygotowuje dla mnie sesję nauki fiszek
  - Na start wyświetlany jest przód fiszki, poprzez interakcję użytkownik wyświetla jej tył
  - Użytkownik ocenia zgodnie z oczekiwaniami algorytmu na ile przyswoił fiszkę
  - Następnie algorytm pokazuje kolejną fiszkę w ramach sesji nauki

- US-015
  Tytuł: Przegląd harmonogramu powtórek
  Opis: Jako użytkownik chcę przeglądać nadchodzące powtórki, żeby wiedzieć, które fiszki mam powtórzyć.
  Kryteria akceptacji:

  - W zakładce „Powtórki” widzę listę fiszek zaplanowanych na dany dzień z datą i statusem.

- US-016
  Tytuł: Bezpieczny dostęp i autoryzacja
  Opis: Jako zalogowany użytkownik chcę mieć pewność, że moje fiszki nie są dostępne dla innych użytkoników, aby zachować prywatność i bezpieczeństwo danych.
  Kryteria akceptacji:

  - Tylko zalogowany użytkownik może wyświetlać, edytować i usuwać swoje fiszki.
  - Nie ma dostępu do fiszek innych użytkowników ani możliwości współdzielenia

## 6. Metryki sukcesu

- ≥ 75% fiszek wygenerowanych przez AI zaakceptowanych przez użytkowników (stosunek zaakceptowanych do wygenerowanych).
- ≥ 75% wszystkich utworzonych fiszek pochodzi z generowania AI (udział AI w tworzeniu fiszek).
- Monitorowanie liczby wygenerowanych fiszek i porównanie z liczbą zatwierdzonych do analizy jakości i użyteczności
