# Ideen für die Suite

Sammlung von Lücken, Feature-Ideen und möglichen neuen Tools, entstanden aus einer Bestandsaufnahme der vier Tools
(rsvp-app, abstimmungstool, seating, zeitplan) im Oktober 2026. Am 2026-10-07 wurden alle Ideen ein erstes Mal
bewertet (anstehend: eine Hochzeit und ein Ball mit Eintritt). Die Begründung steht jeweils am Anfang des Abschnitts.

**Reihenfolge der angenommenen Ideen:** die Quick Wins Q5, Q3, L5 und L10 sind umgesetzt (2026-10-07), für den Ball
L4 und L1 (2026-10-10, Konzept in `rsvp-app/docs/KONZEPT-TICKETS.md`), L2 und L3 für die Hochzeit (2026-10-10, Konzept in `rsvp-app/docs/KONZEPT-EINLADUNGEN.md`), am 2026-10-11 deren Nachzügler (Einlass und Alkohol pro Person, Küchenliste pro Tisch, Einladungen für Reihen) und N4 (Wunschliste, `rsvp-app/docs/KONZEPT-WUNSCHLISTE.md`). Am 2026-10-12 umgesetzt: N1 (Dienste/Schichten) als neues Tool „Schichten“ für den Winterball, Konzept in `schichten/docs/KONZEPT.md`, angebunden an rsvp-app und Zeitplan. Am 2026-10-13 kamen für den Zeitplan L15–L25 dazu, alle angenommen, ebenso die bisher zurückgestellten L6, L7, L11 und L12; am selben Tag umgesetzt: L15, L20, L24, danach L22, L18, L21 und L16. Zurückgestellte Ideen werden neu bewertet, sobald ein Anlass sie braucht.

**Status:** `offen` (noch nicht bewertet) · `angenommen` · `in Arbeit` · `umgesetzt` · `zurückgestellt` · `verworfen`
(verworfene Ideen bleiben mit Begründung stehen, damit sie nicht wieder auftauchen).

**Aufwand** ist eine erste grobe Schätzung: **S** = ein paar Stunden bis ein Tag, **M** = mehrere Tage, **L** = eine
Phase wie bei Seating/Zeitplan (Konzept, mehrere Schritte, eigene Tests).

## Übersicht

| ID | Idee | Betrifft | Aufwand | Status |
| --- | --- | --- | --- | --- |
| [P1](#p1-suite-paket) | Suite-Paket: gemeinsames Deployment der Einzel-Apps | neu (Deploy-Repo) | L | zurückgestellt |
| [P2](#p2-pwas-und-gemeinsame-startseite) | PWAs und gemeinsame Startseite | Paket, alle Tools | M | zurückgestellt |
| [L1](#l1-geld-preise-bezahlstatus-kasse) | Geld: Preise, Bezahlstatus, GiroCode, Abendkasse | rsvp-app | L | umgesetzt |
| [L2](#l2-einladungen-pro-haushalt-mehrere-begleitungen) | Einladungen pro Haushalt, mehrere Begleitungen | rsvp-app (+ seating) | L | umgesetzt |
| [L3](#l3-angaben-pro-person-und-menüwahl) | Essen/Allergien pro Person, Menüwahl pro Gang | rsvp-app | M | umgesetzt |
| [L4](#l4-ticketkategorien-und-kontingente) | Ticketkategorien und Kontingente | rsvp-app | M | umgesetzt |
| [L5](#l5-mitbringliste-mit-slots) | Mitbringliste mit Slots zum Beanspruchen | rsvp-app | S–M | umgesetzt |
| [L6](#l6-session-anmeldung-mit-kapazität) | Session-Anmeldung mit Kapazität pro Programmpunkt | zeitplan (+ rsvp-app) | M–L | angenommen |
| [L7](#l7-sitzungsmodus-für-versammlungen) | Sitzungsmodus für Versammlungen | abstimmungstool, rsvp-app, zeitplan | L | angenommen |
| [L8](#l8-fragebogen-feedback-nach-dem-event) | Fragebogen / Feedback nach dem Event | abstimmungstool (+ rsvp-app) | M | zurückgestellt |
| [L9](#l9-teams-bei-der-anmeldung) | Teams bei der Anmeldung (Teamname, Teamgröße) | rsvp-app / seating | S–M | zurückgestellt |
| [L10](#l10-öffentliche-sitzordnung-mit-namen) | Öffentliche Sitzordnung mit Namen („Wo sitze ich?“) | seating | S–M | umgesetzt |
| [L11](#l11-kürzbare-programmpunkte) | Kürzbare Programmpunkte mit Mindestdauer | zeitplan | M | angenommen |
| [L12](#l12-benachrichtigungen-an-gäste-im-zeitplan) | Benachrichtigungen an Gäste im Zeitplan (Push/Mail) | zeitplan | M | angenommen |
| [L13](#l13-echtzeit-per-sse-im-zeitplan) | Echtzeit per SSE statt Polling im Zeitplan | zeitplan | S–M | verworfen |
| [L14](#l14-online-zahlung-paypal) | Online-Zahlung per PayPal neben der Überweisung | rsvp-app | M | zurückgestellt |
| [L15](#l15-durchsagen-im-zeitplan) | Durchsagen an Gäste und Tafel | zeitplan | S | umgesetzt |
| [L16](#l16-zuständigkeiten-pro-programmpunkt) | Zuständigkeiten pro Programmpunkt, „Meine Punkte“ | zeitplan | S–M | umgesetzt |
| [L17](#l17-vorwarnung-fürs-team) | Vorwarnung fürs Team (Push vor eigenen Punkten) | zeitplan | M | angenommen |
| [L18](#l18-lesezugang-für-dienstleister) | Lesezugang ohne Konto für Dienstleister | zeitplan | S | umgesetzt |
| [L19](#l19-was-wäre-wenn-vorschau) | „Was wäre wenn“-Vorschau in der Planung | zeitplan | M | angenommen |
| [L20](#l20-block-verschieben) | Block verschieben (Punkt und alle folgenden) | zeitplan | S | umgesetzt |
| [L21](#l21-regieplan-und-programmheft-zum-drucken) | Regieplan und Programmheft zum Drucken | zeitplan | S | umgesetzt |
| [L22](#l22-orte-mit-adresse-und-kartenlink) | Orte mit Adresse und Kartenlink | zeitplan | S | umgesetzt |
| [L23](#l23-weitere-vorlagen-im-zeitplan) | Weitere Vorlagen im Zeitplan (Winterball, Pubquiz, Versammlung) | zeitplan | S je Vorlage | angenommen |
| [L24](#l24-rückblick-plan-gegen-ist) | Rückblick: Plan gegen Ist, auch als Sitzungsdokumentation | zeitplan | S–M | umgesetzt |
| [L25](#l25-kalender-export-ics) | Kalender-Export (ICS) | zeitplan | S | angenommen |
| [N1](#n1-dienste--schichten) | Neues Tool: Dienste/Schichten | neu (schichten) | L | umgesetzt |
| [N2](#n2-wertung--scoreboard) | Neues Tool: Wertung/Scoreboard (Quiz, Turniere) | neu | L | zurückgestellt |
| [N3](#n3-kasse--abrechnung) | Neues Tool: Kasse/Abrechnung (Kostenteilung) | neu | M–L | verworfen |
| [N4](#n4-wunschliste--geschenke) | Wunschliste/Geschenke (als Teil von rsvp-app) | rsvp-app | M | umgesetzt |
| [N5](#n5-mitfahrgelegenheiten) | Mitfahrgelegenheiten (eigenes Tool oder Teil von rsvp-app) | neu / rsvp-app | M | zurückgestellt |
| [Q1](#q1-einmal-anlegen-überall-verknüpfen) | Einmal anlegen, überall verknüpfen | alle Tools | M je Paar | zurückgestellt |
| [Q2](#q2-mehrsprachigkeit) | Mehrsprachigkeit (mindestens Deutsch/Englisch) | alle Tools | L | zurückgestellt |
| [Q3](#q3-fotos-der-gäste-über-immich) | Fotos der Gäste über Immich statt eigener App | rsvp-app / zeitplan | S | umgesetzt |
| [Q4](#q4-vorlagen-pro-event-typ-über-alle-tools) | Vorlagen pro Event-Typ über alle Tools | alle Tools | M–L | zurückgestellt |
| [Q5](#q5-direkt-weiter-zum-einzigen-anbieter) | Login: direkt weiter zum einzigen Anbieter | suite-kit, alle Tools | S | umgesetzt |
| [Q6](#q6-bot-schutz-für-öffentliche-formulare) | Bot-Schutz für öffentliche Formulare (Turnstile o. Ä.) | seating, ggf. alle Tools | S je Tool | zurückgestellt |

### Wo die Ideen ansetzen

Die Suite deckt den Kern **anmelden → entscheiden → platzieren → Ablauf steuern** ab. Die Lücken liegen **davor**
(einladen, Geld, Helfer\*innen), **daneben** (Teams, Wertung, Sessions) und **danach** (Feedback, Fotos, Abrechnung).

| Szenario | Wichtigste Ideen |
| --- | --- |
| Regelmäßige Freundesrunde | L5, N3 |
| Pubquiz in der Studikneipe | L1 (Startgeld), L9, N2, N1 |
| Winterball | L1, L3, L4, N1, L23 |
| Hochzeit | L2, L3, N4, N5, Q3, L15, L16, L18, L22 |
| Workshops, Ersti-Woche, Barcamp, Tag der offenen Tür | L6 (+ abstimmungstool für Session-Vorschläge) |
| Mitgliederversammlung, Fachschaft, StuPa | L7, L24 |
| Freizeiten, Ersti-Fahrt, Vereinsausflug | N5, N3, Zimmerverteilung über seating `ASSIGNED` (schon möglich) |
| Turniere, Spieleabend, Sportfest | N2 |
| Internationales Publikum | Q2 |

---

## Suite-Paket

### P1: Suite-Paket

**Bewertung (2026-10-07): zurückgestellt.** Heute betreibt nur eine Person alle Tools auf einem Server; lohnt sich erst, wenn andere die Suite installieren wollen.

**Ziel:** Wer mehrere Tools betreiben will, installiert sie mit einem Paket, ohne dass die Tools selbst einen
„Suite-Modus“ bekommen. Mögliche Betreiber\*innen:

| Wer | Was |
| --- | --- |
| alles | Paket mit allen Profilen |
| nur rsvp-app | Einzel-Repo wie heute, oder das Paket mit einem Profil |
| zwei Tools getrennt | Einzel-Repos, Verdrahtung von Hand nach README (heutiger Weg) |
| drei von vier gebündelt | Paket mit drei Profilen; das Skript verdrahtet nur, was da ist |

**Inhalt (kein App-Code):**

1. `docker-compose.yml` mit **Profilen** pro Tool (`--profile rsvp --profile zeitplan …`). Neue Tools (N1, N2, …)
   kommen als weiteres Profil dazu.
2. **Reverse Proxy mit Subdomains** (Vorschlag: Caddy mit automatischem HTTPS): `rsvp.example.de`,
   `zeitplan.example.de`, … Jedes Tool behält seinen eigenen Origin.
3. **Setup-Skript**, das den eigentlichen Mehrwert liefert: fragt Domain, SMTP und Impressum **einmal** ab und erzeugt
   für die gewählten Tools die `.env`-Dateien:
   * je ein eigenes Ed25519-Schlüsselpaar (`suite-keygen`),
   * `SUITE_IDPS`/`SUITE_TRUSTED_APPS` über Kreuz, mit `autoProvision: false` als Voreinstellung,
   * die Kopplungs-Secrets **paarweise verschieden** (`SEATING_SECRET`/`RSVP_SEATING_SECRET`,
     `TIMELINE_SECRET`/`RSVP_TIMELINE_SECRET`, `POLL_VERIFICATION_SECRET`/`RSVP_VERIFICATION_SECRET`), sodass ein
     Secret nie in zwei Anbindungen landet,
   * `BASE_URL`, `*_BASE_URL`, `CRON_SECRET` und `TRUST_PROXY_HOPS` passend zum mitgelieferten Proxy,
   * danach das erste Konto mit Admin-Rolle je Tool per `create-user.js --invite`.
4. **Gemeinsamer Betrieb:** ein Cron-Container für alle `/api/cron/*`-Endpunkte, ein Backup-Skript für alle
   SQLite-Dateien (Container kurz anhalten), ein Update-Befehl.
5. Optional die **Startseite** auf der Hauptdomain, siehe P2.

**Leitlinie:** Das Paket erzeugt nur Konfiguration, die man auch von Hand schreiben könnte. Dadurch funktionieren
gemischte Setups automatisch (gebündeltes rsvp-app + separat gehostetes Seating).

**Bewusst nicht:** kein zentraler Login, keine gemeinsame Nutzerverwaltung (Leitprinzip 2). Das Bequemlichkeitsproblem
„einmal pro Tool anmelden“ geht Q5 an.

**Offene Fragen:** Eigenes Repo oder Ordner `deploy/` in suite-kit? Images aus einer Registry (GHCR) oder lokal bauen?
DNS: Wildcard-Eintrag empfehlen? Wie aktualisiert man einzelne Tools, die eine neuere suite-kit-Version brauchen?

**Verworfen: eine zusammengelegte Suite-App** (alle Tools in einer Next.js-App). Gründe, am Code geprüft:

* Die Föderation identifiziert Tools am **Origin** (`normalizeOrigin`, `src/config.ts`, `src/discovery.ts`). Tools
  unter Pfaden derselben Domain wären für das Protokoll ein einziges Tool.
* Alle Tools nutzen `__Host-session` und `__Host-suite-state`. `__Host-`-Cookies gelten zwingend für den ganzen Host,
  Sitzungen würden sich gegenseitig überschreiben.
* Routen kollidieren: Catch-alls `/[slug]` bzw. `/[pollId]` in jedem Tool, dazu `/admin`, `/api/cron/cleanup`,
  `/impressum`, `/datenschutz`, `/rsvp`, `/login` mehrfach.
* Zwei Produkte statt eins: jedes Feature in Einzel- und Suite-Variante testen, vier Prisma-Schemas und
  Header-Regeln in einem Build, Upgrades im Gleichschritt (Next steht schon heute auf `16.3.5` bzw. `^16.3.8`).
* Einziger Vorteil wäre weniger RAM (ein Node-Prozess statt vier). Wieder aufgreifen nur, falls die Suite auf sehr
  kleiner Hardware laufen muss.

### P2: PWAs und gemeinsame Startseite

**Bewertung (2026-10-07): zurückgestellt.** Hängt an P1 (Startseite) und an Tests auf echten Geräten; im Alltag kein Engpass.

**Ausgangslage:** Jedes Tool ist eine eigene PWA (`app/manifest.ts`, `public/sw.js`, Offline-Seite außer rsvp-app),
alle mit `scope: '/'`. rsvp-app startet auf der neutralen Startseite (Admin und Gäste), Seating und Zeitplan starten in
`/admin`, das Abstimmungstool auf `/`. Push gibt es in rsvp-app (Admin und Gäste) und im Abstimmungstool, jeweils mit
eigenen VAPID-Schlüsseln.

**Grundregel:** Eine PWA umfasst genau einen Origin. Mit Subdomains (P1) bleibt **jedes Tool seine eigene PWA**, und
das ist auch richtig so: eigener Push, eigener Datenschutz, eigenes Offline-Verhalten, unabhängig installierbar.

**Rolle der Startseite:** **Startrampe und Installationshilfe, kein Container.**

* Kacheln der installierten Tools mit Name, Icon (`/icon.svg` des Tools), einem Satz Beschreibung und je einem Link
  „Öffnen“ sowie „Als App installieren“ (Anleitung pro Plattform; ein Installieren-Knopf geht nur auf dem Origin des
  Tools selbst).
* Die Liste kommt **statisch aus dem Setup-Skript** (P1), nicht aus Discovery: `/.well-known/suite-identity` liefert
  zwar `name`, antwortet aber ohne Signierschlüssel mit 404, und nicht jedes Tool muss Anbieter sein.
* Kein Konto, keine Sitzung, keine Daten: eine statische Seite, die der Proxy ausliefert.
* Hinweis auf der Startseite, welche Tools Push können und dass Push auf iOS nur in der **installierten** PWA des
  jeweiligen Tools ankommt.

**Optional: die Startseite selbst als kleine PWA** („Suite“-Symbol auf dem Startbildschirm). Einschränkung: Links in
andere Origins öffnen aus einer installierten PWA heraus nicht nahtlos, sondern je nach Plattform in einem
eingebetteten Browser mit Hinweisleiste. Erst auf echten Geräten testen (Android/Chrome, iOS/Safari), dann entscheiden.

**Kleine Änderungen in den Tools** (jeweils optional, ohne Konfiguration unsichtbar, also „eigenständig zuerst“):

* `SUITE_HOME_URL`: Link „Weitere Apps“ zurück zur Startseite, z. B. in der Kopfzeile oder unter „Mein Konto“.
* **Tool-Umschalter** (aus dem Abstimmungstool-TODO D3 hierher verschoben, 2026-10-04): ein gemeinsames Menü, um
  zwischen den verbundenen Tools zu wechseln. Am einfachsten über diese Startseite bzw. `SUITE_HOME_URL`; ein Menü in
  jedem Tool bräuchte die Liste der Tools in jedem Tool (Discovery liefert sie nicht vollständig, siehe oben).
* Anpassbarer Anzeigename (heute fest: `APP_NAME` in Seating/Zeitplan, `'RSVP'` in rsvp-app), damit die Symbole auf
  dem Startbildschirm zusammengehörig benannt werden können.
* Unterscheidbare Symbole: Alle Tools nutzen dieselbe `theme_color` (`#2563eb`). Auf dem Startbildschirm unterscheiden
  sie sich nur am Motiv, eine gemeinsame Bildsprache mit je eigener Farbe würde helfen.

**Verworfen:**

* *Startseite bettet Tools per iFrame ein:* Verwaltung, Login und Konto senden absichtlich `frame-ancestors 'none'`
  (Clickjacking-Schutz), Push-Berechtigungen gehen in fremden iFrames nicht, und auf iOS wäre es unzuverlässig.
* *Manifest-Shortcuts auf andere Tools:* Shortcuts außerhalb des eigenen Scopes ignorieren die Browser.
* *Eine PWA über mehrere Origins (`scope_extensions`):* experimentell und nur in Chromium, darauf baut man nichts.

**Zu beachten:** Auf iOS hat eine installierte PWA einen eigenen Cookie-Speicher, getrennt von Safari. Nach dem
Installieren meldet man sich in der App also neu an. Die Föderation hilft dabei nur, wenn man im Anbieter-Tool
innerhalb desselben Kontexts angemeldet ist. Vor einer Entscheidung auf echtem Gerät prüfen.

---

## Lücken in bestehenden Tools

### L1: Geld: Preise, Bezahlstatus, Kasse

**Bewertung (2026-10-07): angenommen.** Für den anstehenden Ball (Eintritt). Zusammen mit L4 planen.

**Umgesetzt (2026-10-10) in rsvp-app** zusammen mit L4, Konzept in `rsvp-app/docs/KONZEPT-TICKETS.md`. Entscheidungen zu
den offenen Fragen: Die Zahlfrist wird **nur angezeigt**, überfällige Zusagen storniert die Verwaltung per Klick (kein
automatischer Verfall). Moderator\*innen dürfen den Bezahlstatus setzen (Abendkasse). Die Sitzplatzwahl in Seating
lässt sich pro Termin bis zur Zahlung sperren (Vertrag mit Seating unverändert, nur die Regel „zählt bei Seating“).
Rückerstattung nur als Status („Erstattung offen“ → „erstattet“). Ebenfalls am 2026-10-10 nachgezogen:
**Kontoauszug-Import** (beliebiges Bank-CSV oder CAMT.053, Abgleich über den Verwendungszweck, Vorschau mit
Betragsprüfung, Datei wird nicht gespeichert) und **Zahlungserinnerung** (automatisch X Tage vor Fristende per Mail und
Push, oder per Knopf).

**Problem:** Kein Tool kennt Preise, Eintritt oder Bezahlstatus. Winterball (Tickets), Pubquiz (Startgeld) und
Freizeiten (Beitrag) brauchen das.

**Idee (rsvp-app):** kein Zahlungsanbieter, sondern Überweisung mit **GiroCode (EPC-QR)** und eindeutigem
Verwendungszweck in Bestätigungsmail und Erfolgsseite. Status „offen / bezahlt“ pro Zusage, optional „bezahlt bis …“
mit automatischem Verfall (Platz geht an die Warteliste). Abgleich manuell („als bezahlt markieren“) oder per CSV-Import
eines Kontoauszugs (Verwendungszweck → Zusage). Abendkasse beim Check-in (bar bezahlt markieren). Bezahlstatus im
CSV-Export und beim Einlass.

**Abhängigkeiten:** L4 (Preise je Kategorie). Datenschutzerklärung (Zahlungsdaten, Kontoauszüge).

**Offene Fragen:** Rückerstattung bei Absage? Wer sieht den Bezahlstatus (Moderator\*innen)? Gilt die Sitzplatz-Buchung
in Seating erst nach Zahlung?

### L2: Einladungen pro Haushalt, mehrere Begleitungen

**Bewertung (2026-10-07): angenommen.** Für die anstehende Hochzeit. Zusammen mit L3 planen, Vertrag mit Seating mitdenken.

**Stand (2026-10-10): umgesetzt** (zusammen mit L3), Konzept in `rsvp-app/docs/KONZEPT-EINLADUNGEN.md`. Entschieden:
mehrere Begleitungen auch bei offener Anmeldung („bis zu N“, ersetzt „+1“), Einladungslinks per Mail und als Druckliste
mit QR-Codes, Zusatzpersonen pro Einladung freigebbar, optionale Antwortfrist pro Termin (danach nur noch die
Verwaltung, mit Erinnerung an Haushalte ohne Antwort). Umgesetzt in vier Schritten: Begleitungen mit Altersgruppe,
Essen und Allergien pro Person (Plätze zählen Personen, Kleinkinder nicht); Menü mit Küchenübersicht (L3);
Einladungsmodus mit Antwort pro Person; Antwortfrist. Der Vertrag mit Seating blieb unverändert (`companions` war schon
eine Liste), Zeitplan und Abstimmungstool sind nicht betroffen. Nachgezogen am 2026-10-11: Einlass und Alkohol pro
Person, Küchenliste pro Tisch (Seating meldet Tisch und Platz pro Person, `placements[].persons`) und der
Einladungsmodus für Reihen (eine Einladungsliste pro Reihe, ein Link pro Haushalt für alle oder ausgewählte Termine).

**Problem:** rsvp-app ist offene Anmeldung (ggf. mit PIN). Bei Hochzeiten lädt man aber gezielt Haushalte ein.
Außerdem erlaubt `companions` höchstens **eine** Begleitung, Familien mit Kindern passen nicht hinein.

**Idee:** Einladungsliste je Event mit persönlichem Link pro Haushalt und vorgegebenen Namen („Ihr seid zu viert
eingeladen“). Zu- und Absage **pro Person**, Altersgruppe (Erwachsene/Kind) für Menü und Zählung. Wer nicht eingeladen
ist, kommt nicht hinein (Modus pro Event, offene Anmeldung bleibt Standard).

**Abhängigkeiten:** Vertrag mit Seating (`companions` wird eine echte Liste, Seating kennt dann alle Namen pro Platz)
und mit Zeitplan (unverändert, dort zählt nur die Zusage). L3.

### L3: Angaben pro Person und Menüwahl

**Bewertung (2026-10-07): angenommen.** Für Hochzeit und Ball (Menüwahl, Allergien pro Person). Zusammen mit L2.

**Stand (2026-10-10): umgesetzt** mit L2: Essen und Allergien pro Person, Menü als Gänge mit Optionen (Textfeld
`Hauptgang: Fisch; Fleisch; Vegetarisch`), Wahl pro Person Pflicht bei Zusage (Kleinkinder ohne), auch für den Ball mit
Ticketkategorien nutzbar. Küchenübersicht mit Zählung nach Erwachsenen und Kindern, Allergien, Personenliste nach
Sitzplatz, Druck und CSV.

**Problem:** Essenswunsch und Allergien hängen an der Antwort, nicht an jeder Person (die Begleitung hat keine eigenen).
Für Ball und Hochzeit fehlt eine Menüwahl pro Gang.

**Idee:** Angaben pro Person (Gast und jede Begleitung). Menü als frei definierbare Gänge mit Auswahl (z. B. Hauptgang
Fisch/Fleisch/vegetarisch), Auswertung für die Küche (Anzahl je Option, Liste pro Tisch zusammen mit Seating).

### L4: Ticketkategorien und Kontingente

**Bewertung (2026-10-07): angenommen.** Für den anstehenden Ball (Kategorien, Kontingente). Grundlage für Preise in L1.

**Umgesetzt (2026-10-10) in rsvp-app** wie beschrieben, mit eigener Warteliste je Kategorie (eine volle Kategorie
blockiert die anderen nicht; die Nachrück-Regel liegt jetzt an einer Stelle). Bei Terminen mit Kategorien gibt es
bis L2 keine Begleitung, jede Person meldet sich selbst an.

**Problem:** Eine Kapazität pro Event reicht beim Ball nicht (Studi/Gast/Ermäßigt, „Ball mit Dinner“ vs. „nur Ball“).

**Idee:** Kategorien pro Event mit eigenem Kontingent, eigenem Preis (L1) und eigener Warteliste; Gesamtkapazität
bleibt als Obergrenze. Kategorie im Einlass sichtbar.

### L5: Mitbringliste mit Slots

**Bewertung (2026-10-07): angenommen.** Quick Win: echtes Alltagsproblem der Freundesrunde, überschaubarer Umfang.

**Umgesetzt (2026-10-07) in rsvp-app:** Einträge mit Anzahl pro Termin (`2x Salat`), Ankreuzen beim Zusagen, volle
Einträge gesperrt (atomare SQL-Anweisung, auch bei gleichzeitigen Zusagen), Absage und Warteliste geben frei. Anzeige in
Gästeliste, Verwaltung und CSV. Noch offen: Vorlage für Reihen (Liste beim neuen Termin übernehmen).

**Problem:** „Mitbringsel“ ist Freitext, dadurch bringen fünf Leute Nudelsalat.

**Idee:** Liste mit Einträgen und Anzahl („Salat 2/2, Getränke 1/3, Nachtisch 0/2“), Gäste beanspruchen einen Slot
beim Zusagen oder später über ihren persönlichen Link. Optional als Vorlage für Reihen (Freundesrunde).

### L6: Session-Anmeldung mit Kapazität

**Neu bewertet (2026-10-13): angenommen.** Mit den Zeitplan-Ideen L15–L25 auf die Liste; Reihenfolge offen.

**Bewertung (2026-10-07): zurückgestellt.** Kein Workshop- oder Barcamp-Event in Sicht; offene Grundsatzfrage (Zeitplan oder rsvp-app).

**Szenario:** Workshops, Ersti-Woche, Barcamp, Tag der offenen Tür: parallele Slots, Gäste wählen Sessions.

**Idee:** Programmpunkte in Zeitplan bekommen optional eine Kapazität. Gäste mit Zugang melden sich pro Punkt an
(Überschneidungen werden verhindert), Warteliste je Punkt. Barcamp-Kette: Session-Vorschläge und Voting im
Abstimmungstool (`allowVoterOptions`), Gewinner landen als Punkte im Zeitplan.

**Offene Fragen:** Gehört das in Zeitplan (Ablauf) oder in rsvp-app (Anmeldung)? Zeitplan kennt heute bewusst keine
Namen von Gästen.

### L7: Sitzungsmodus für Versammlungen

**Neu bewertet (2026-10-13): angenommen.** Mit den Zeitplan-Ideen L15–L25 auf die Liste; Reihenfolge offen.

**Bewertung (2026-10-07): zurückgestellt.** Kein konkreter Anlass; großer Umbau über drei Tools.

**Szenario:** Mitgliederversammlung, Fachschaftsrat, StuPa.

**Idee:** Die Bausteine verbinden: Tagesordnung (Zeitplan), Anwesenheit über den Check-in (rsvp-app),
**„nur Eingecheckte dürfen abstimmen“** (Check-in → Stimmlinks, auch geheim), viele kurze Abstimmungen hintereinander
mit wenig Klicks, Beschlussfähigkeit live (Quorum gibt es schon), Rednerliste. Später: Protokoll-Export (ein erster Baustein ist L24: Tagesordnung als Programmpunkte, Ist-Zeiten und
Protokollnotizen aus dem Zeitplan).

**Abhängigkeiten:** neuer Vertrag rsvp-app → abstimmungstool (Liste der Eingecheckten bzw. Token beim Check-in).

### L8: Fragebogen / Feedback nach dem Event

**Bewertung (2026-10-07): zurückgestellt.** Kein konkreter Anlass; Freitext gibt es inzwischen in den Live-Runden als möglichen Baustein.

**Problem:** Eine Abstimmung hat genau eine Frage, Freitext gibt es nicht.

**Idee:** Abstimmungsart „Fragebogen“ mit mehreren Fragen (Auswahl, Skala, Freitext) im Abstimmungstool. rsvp-app
schickt nach dem Event automatisch den Link an alle Eingecheckten (bzw. alle Zusagen), Identität über den bestehenden
`RSVP`-Modus.

### L9: Teams bei der Anmeldung

**Bewertung (2026-10-07): zurückgestellt.** Erst mit N2 oder einem konkreten Turnier sinnvoll.

**Szenario:** Pubquiz, Turniere.

**Idee:** Anmeldung als Team mit Teamname und Teamgröße. Eine Tischbuchung in Seating (`TABLE`) deckt den Teamtisch
schon ab; es fehlen Teamname und die Übergabe an N2.

### L10: Öffentliche Sitzordnung mit Namen

**Bewertung (2026-10-07): angenommen.** Quick Win: Daten gibt es schon (Druck, Export); wichtig für die anstehende Hochzeit.

**Umgesetzt (2026-10-07) in engerer Form:** Seating kennt keinen Zugangscode, öffentliche Seiten sind für alle mit dem
Link offen. Deshalb sehen die Namen nur Gäste mit Zusage, die über „Sitzplatz“ aus rsvp-app kommen (signierter Link),
mit Schalter pro Event (`guestSeatingVisible`, nur Modus ASSIGNED, nur veröffentlichte Events). Gezeigt werden nur Namen
und Plätze, der eigene Platz hervorgehoben. Die öffentliche Eventseite zeigt weiterhin nie Namen.

*Aus dem Konzept von Seating übernommen (2026-10-07), dort in Phase 6 bewusst zurückgestellt.*

**Problem:** Die öffentliche Plan-Ansicht zeigt nur „belegt“, nie Namen. Bei einer Hochzeit mit Sitzordnung wollen Gäste
aber wissen, wo sie sitzen; heute gibt es das nur im Druck (Tischkarten, Tischliste) und im Export.

**Idee:** Schalter pro Event (aus als Voreinstellung): Die Gästeansicht zeigt die Sitzordnung mit Namen, dazu eine Suche
„Wo sitze ich?“. Nur für Events mit Zugangsschutz (Code oder `RSVP`), nicht für offene Pläne. Datenschutzerklärung und
Hinweis beim Einschalten ergänzen.

### L11: Kürzbare Programmpunkte

**Neu bewertet (2026-10-13): angenommen.** Mit den Zeitplan-Ideen L15–L25 auf die Liste; Reihenfolge offen.

**Bewertung (2026-10-07): zurückgestellt.** Der Konfliktanzeige fürs Team reicht bisher; nach dem ersten echten Einsatz neu bewerten.

*Aus dem Konzept von Zeitplan übernommen (2026-10-07), Abschnitt „Später“.*

**Problem:** Bei Verspätung schiebt Zeitplan alle folgenden Punkte nach hinten, bis zum nächsten Anker. Dass sich
manche Punkte (Kaffee, Reden) kürzen lassen, um die Verspätung aufzuholen, weiß das Tool nicht; heute zeigt es nur den
Konflikt fürs Team an („kürzen?“).

**Idee:** Optionale Mindestdauer pro Punkt. Die Prognose kürzt kürzbare Punkte bis zur Mindestdauer, bevor sie
Folgepunkte verschiebt, und zeigt dem Team, wo gekürzt wurde.

### L12: Benachrichtigungen an Gäste im Zeitplan

**Neu bewertet (2026-10-13): angenommen.** Mit den Zeitplan-Ideen L15–L25 auf die Liste; Reihenfolge offen.

**Bewertung (2026-10-07): zurückgestellt.** Für einen Eventtag fraglicher Nutzen; nach dem ersten echten Einsatz neu bewerten.

*Aus dem Konzept von Zeitplan übernommen (2026-10-07), Abschnitt „Später“.*

**Problem:** Gäste sehen Änderungen nur, wenn sie die Gästeansicht offen haben. Zeitplan verschickt weder Push noch Mails
an Gäste und kennt bewusst keine Namen oder Adressen.

**Idee:** Push in der installierten PWA (wie in rsvp-app und dem Abstimmungstool) für ausgewählte Punkte („Gleich geht's
los: Trauung in 10 Minuten“) und bei größeren Verschiebungen. Mails nur über rsvp-app, das die Adressen kennt.

**Offene Fragen:** Lohnt sich Push für einen einzigen Eventtag? Auf iOS nur in der installierten PWA (siehe P2). Für
das Team, das die PWA ohnehin installiert hat, siehe L17.

### L13: Echtzeit per SSE im Zeitplan

**Bewertung (2026-10-07): verworfen.** Polling reicht laut Lasttest (200 Gäste). Falls es schneller werden muss, Long-Polling wie bei den Live-Runden des Abstimmungstools statt SSE (Cloudflare puffert SSE teils).

*Aus dem Konzept von Zeitplan übernommen (2026-10-07), Abschnitt „Später“.*

**Problem:** Gästeansicht und Tafel fragen per Polling nach (bis zu 30 Sekunden Verzögerung, sofort beim Zurückkehren in
den Tab). Bewusst so gewählt, weil es hinter Cloudflare und bei schlechtem Empfang robuster ist.

**Idee:** Server-Sent Events als Zusatz für Tafel und Live-Steuerung, Polling bleibt als Rückfall. Das Abstimmungstool
löst dasselbe für Live-Runden mit Long-Polling ohne Zusatzdienst, das wäre die naheliegende Vorlage.

### L14: Online-Zahlung (PayPal)

*Aufgenommen 2026-10-10 als Erweiterung von L1.* **Bewertung (2026-10-12): zurückgestellt.** Der AStA hat noch kein PayPal-Konto; neu bewerten, sobald es eins gibt.

**Idee:** Neben Überweisung/GiroCode optional „Mit PayPal bezahlen“, mit derselben Funktionalität: Betrag pro Zusage,
Zuordnung, Status „bezahlt“ (Zahlart PayPal), Erstattung.

**Varianten:**

* **PayPal.Me-Link** (Aufwand S): Knopf `paypal.me/<name>/25EUR` neben dem GiroCode. Den Verwendungszweck muss die
  zahlende Person selbst als Notiz eintippen (lässt sich nicht vorbelegen), der Abgleich liefe über den PayPal-Export
  im Kontoauszug-Import. Nachteile: vergessene Notizen, für Ticketverkauf nur als „Waren und Dienstleistungen“
  zulässig (Gebühren für die Empfänger\*in), kein automatischer Status.
* **PayPal Checkout (Orders API v2)** (Aufwand M, etwa 2–3 Tage mit Tests): Server legt eine Bestellung mit Betrag und
  Verwendungszweck an, Gast bestätigt bei PayPal, Server bucht ab; ein signierter Webhook (Prüfung über PayPals API)
  markiert automatisch „bezahlt“, Erstattungen über die API möglich. Braucht ein PayPal-Geschäftskonto, Client-ID,
  Secret und Webhook-ID in der `.env`, eine Ausnahme in der CSP für das PayPal-Skript auf den (einbettbaren)
  Event-Seiten, einen Schein-PayPal-Server für die E2E-Tests und einen Abschnitt in der Datenschutzerklärung (PayPal als
  eigene Verantwortliche). Gebühren pro Zahlung trägt die Veranstaltung.

**Offene Fragen:** Gibt es ein PayPal-Geschäftskonto der empfangenden Stelle (Fachschaft/Verein)? Gebühren auf den
Ticketpreis umlegen?

### L15: Durchsagen im Zeitplan

**Stand (2026-10-13): umgesetzt** in `zeitplan` (Live-Steuerung, Gästeansicht, Tafel, Offline-Seite; eine Durchsage zur Zeit, 15–120 Min oder ohne Ablauf, im Verlauf).

**Problem:** Das Team kann Gästen nur über Programmpunkte etwas mitteilen. Kurzfristige Hinweise („Bitte zum
Gruppenfoto in den Garten“, „Bus fährt 23:30 ab Haupteingang“) haben keinen Platz.

**Idee:** Kurze Durchsage aus der Live-Steuerung, als Banner oben in Gästeansicht und auf der Tafel, mit Ablaufzeit oder
von Hand entfernt. Läuft über das bestehende Polling (ETag), kein Push nötig.

### L16: Zuständigkeiten pro Programmpunkt

**Stand (2026-10-13): umgesetzt** in `zeitplan` (Zuständige im Punkt-Formular, bei geheimen Punkten nur aus „Geheim für“; „Meine Punkte“ oben in der Team-Ansicht mit erwarteter Zeit, Filter `?meine=1`; auch im Regieplan und im Team-Link).

**Problem:** Wer für einen Punkt zuständig ist („Ansprechperson“), steht heute als Freitext in der internen Notiz.

**Idee:** Pro Punkt zuständige Konten (Auswahl aus den Konten mit Zugriff). Jedes Konto sieht „Meine Punkte“ mit
Prognose („Deine Rede: ca. 21:40, in 25 Min“). Grundlage für L17.

### L17: Vorwarnung fürs Team

**Bewertung (2026-10-13): angenommen.** Variante von L12 für das Team statt für Gäste.

**Problem:** Wer gleich dran ist, rechnet die Prognose im Trubel selbst nach.

**Idee:** Push in der installierten PWA an Moderator\*innen und Zuständige (L16) eine einstellbare Zeit vor dem
erwarteten Beginn („In 10 Min: Eröffnungstanz, Musik bereit?“), nach der Prognose statt nach der Planzeit. Das Team
hat die PWA ohnehin installiert, damit entfällt der iOS-Einwand aus L12 weitgehend.

### L18: Lesezugang für Dienstleister

**Stand (2026-10-13): umgesetzt** in `zeitplan` (Team-Link `/<adresse>/team?k=…`, standardmäßig aus, per HMAC aus `DISPLAY_LINK_SECRET` mit eigener Version; geheime Punkte als Platzhalter, Zuständige nur mit Namen).

**Problem:** DJ, Fotograf\*in oder Catering brauchen die Team-Sicht (Team-Punkte, interne Notizen), heute aber dafür
ein Konto mit Freigabe.

**Idee:** Ein per HMAC abgeleiteter, neu erzeugbarer Link wie bei der Tafel bzw. dem Leitstand in Schichten: Team-Ansicht
nur lesend, ohne geheime Punkte.

### L19: „Was wäre wenn“-Vorschau

**Bewertung (2026-10-13): angenommen.**

**Idee:** In der Planung eine Verspätung simulieren („Trauung +20“) und sehen, welche Puffer sie schlucken und wo
Konflikte mit Ankern entstehen – ohne etwas zu speichern. Der Prognose-Kern ist eine reine Funktion, das macht es
billig. Eine Art Generalprobe für die Puffer.

### L20: Block verschieben

**Stand (2026-10-13): umgesetzt** in `zeitplan` (Seite eines Punkts; bis vor den nächsten Anker oder bis zum Ende der Spur, `shiftBlock` im Kern).

**Problem:** Verschiebt sich ein Teil des Ablaufs (Trauung eine halbe Stunde später), ändert man heute jede Uhrzeit
einzeln oder tauscht mit Nachbarn.

**Idee:** In der Planung „diesen und alle folgenden Punkte der Spur um X Minuten verschieben“.

### L21: Regieplan und Programmheft zum Drucken

**Stand (2026-10-13): umgesetzt** in `zeitplan` (`/admin/events/<id>/druck`: Regieplan pro Spur, zusammen oder eine Spur; Programmheft mit QR-Code zur Gästeansicht).

**Idee:** Ablauf als A4-Druck fürs Team (Uhrzeiten, Orte, interne Notizen, Zuständige, pro Spur) als Rückfall bei
ausgefallenem Netz oder leerem Akku, optional als Programmheft für Gäste (nur öffentliche Punkte).

### L22: Orte mit Adresse und Kartenlink

**Stand (2026-10-13): umgesetzt** in `zeitplan` (Orte je Event in der Planung, Zuordnung über den Namen im Feld „Ort“; „Route öffnen“ zu Google Maps oder eigenem Link; in Export und Duplizieren).

**Idee:** Orte als eigene Einträge mit Adresse; in der Gästeansicht „Route öffnen“ am Punkt. Vor allem für Reihen und
Events an mehreren Orten (Kirche → Location).

### L23: Weitere Vorlagen im Zeitplan

**Bewertung (2026-10-13): angenommen.** Vorstufe zu Q4.

**Idee:** Neben „Hochzeit“ Vorlagen für „Winterball“ (passend zur Anbindung an Schichten), „Pubquiz“ und
„Mitgliederversammlung“ (Tagesordnung, siehe L24).

### L24: Rückblick: Plan gegen Ist

**Stand (2026-10-13): umgesetzt** in `zeitplan` (`/admin/events/<id>/rueckblick`: Plan gegen Ist, Zusammenfassung, Verlauf, Druck, CSV; Protokollnotiz je Punkt im Rückblick und live beim laufenden Punkt).

**Problem:** Ursprungsplan, tatsächliche Zeiten und der Verlauf liegen vor, werden nach dem Event aber nicht ausgewertet.

**Idee:** Pro Punkt geplanter und tatsächlicher Beginn, geplante und tatsächliche Dauer, Abweichung, Ausfälle und
Einschübe, mit CSV-Export. Hilft beim nächsten Event der Reihe und beim Einschätzen der Puffer. Zugleich eine
**Dokumentation für Sitzungen**: Tagesordnungspunkte als Programmpunkte, der Rückblick hält fest, wann welcher Punkt
behandelt wurde – zusammen mit einer Protokollnotiz pro Punkt ein erster Baustein für L7.

### L25: Kalender-Export (ICS)

**Bewertung (2026-10-13): angenommen.**

**Idee:** Ablauf als ICS zu Planzeiten, für Gäste nur öffentliche Punkte, fürs Team alle (ohne geheime). Aktualisiert
sich nicht live, also eher zur Vorbereitung, z. B. bei mehrtägigen Reihen.

---

## Mögliche neue Tools

Alle nach dem Muster von Seating und Zeitplan: eigenständig zuerst, eigene Datenbank und Konten, Föderation über
suite-kit, optionale Anbindung an rsvp-app mit eigenem Secret.

### N1: Dienste / Schichten

**Stand (2026-10-12): umgesetzt** als eigenes Tool „Schichten“ (`schichten.ramonroeser.de`, Repo `schichten`) für den Winterball, Konzept in `schichten/docs/KONZEPT.md`; Anbindung an Zeitplan als Abruf durch Schichten (die Prognose ändert sich auch ohne Klick). Nachgereicht am selben Tag: Mitverwaltung als zweite Freigabe, Schichtleitungen einzelner Schichten, Ansicht und CSV nach Schicht, optionale Namen für Helfer\*innen, Bildschirm-Link ohne Konto (Leitstand). Später (Konzept „Später“): Rundmail, Reihen, Push, Wünsche mit automatischer Verteilung. Entschieden: Eintragen per Link mit optionalem Code (ohne Konto, Adresse per Mail bestätigt), Tauschbörse, Abhaken vor Ort, Regeln pro Person, Anbindung an Zeitplan (Schicht folgt Programmpunkt) und an rsvp-app (Helfer\*innen bekommen automatisch eine Zusage, Ticketkategorie nach Stufen „ab N Schichten“).

*Bewertung (2026-10-07): zurückgestellt.* Größte Lücke für große Events, aber kein solches Event in Sicht.

**Problem:** Mittlere und große Events (Bar, Einlass, Garderobe, Aufbau, Abbau) brauchen Helfer\*innen. Zeitplan hat
Team-Spuren, aber niemand kann sich in einen Dienst eintragen. Das ist die größte fehlende Funktion für mittlere und
große Events.

**Idee:** Schichten mit Slots (Ort, Zeit, Anzahl, Anforderungen), Selbst-Eintragen per Link (ohne Konto, wie
Buchungen in Seating), Tauschbörse, Erinnerungen per Mail/Push, Übersicht „wer ist gerade wo“, Druckansicht.

**Anbindungen:** Zeitplan (Schicht hängt an Programmpunkt oder Spur, Verspätungen verschieben Schichten mit), rsvp-app
(Helfer\*innen bekommen automatisch eine Zusage bzw. freien Eintritt).

### N2: Wertung / Scoreboard

**Bewertung (2026-10-07): zurückgestellt.** Überschneidet sich teilweise mit den Live-Runden im Abstimmungstool; erst bei einem konkreten Turnier oder Papier-Quiz.

**Szenario:** Pubquiz, Turniere, Spieleabend, Sportfest.

**Idee:** Teams, Runden, Punkteeingabe am Handy (mehrere Moderator\*innen gleichzeitig, wie die Live-Steuerung in
Zeitplan), Rangliste auf einer Anzeigetafel (Tafel und Polling aus Zeitplan wiederverwenden). Später Turnierformen:
K.-o.-Baum, Gruppenphase, Schweizer System.

**Anbindungen:** Teams aus L9 bzw. Tischbuchungen in Seating.

### N3: Kasse / Abrechnung

**Bewertung (2026-10-07): verworfen.** Gute selbst gehostete Tools gibt es (z. B. Spliit, IHateMoney). Einziger Suite-Mehrwert wäre die Übernahme der Teilnehmenden, das rechtfertigt kein eigenes Tool.

**Szenario:** Freundesrunde, Freizeiten, WG-Abend; eventuell Budget und Belege für Veranstalter\*innen (Fachschaftsgeld,
Hochzeitsbudget).

**Idee:** Ausgaben erfassen (wer hat was für wen bezahlt), Salden und minimale Ausgleichszahlungen, GiroCode für die
Überweisung. Teilnehmende aus einer rsvp-app-Reihe übernehmen.

**Abgrenzung zu L1:** L1 kassiert vom Gast an den Veranstalter, N3 verteilt Kosten innerhalb einer Gruppe. Beides
zusammen nur, wenn es wirklich gebraucht wird.

### N4: Wunschliste / Geschenke

**Bewertung (2026-10-07): zurückgestellt.** Für die Hochzeit nicht zwingend; L2/L3 gehen vor.

**Stand (2026-10-11): umgesetzt** als Teil von rsvp-app statt als eigenes Tool (Gäste, Links und Einladungen gibt es
dort schon), Konzept in `rsvp-app/docs/KONZEPT-WUNSCHLISTE.md`: pro Termin Geschenke mit Anzahl oder Geldwünsche mit
Zielbetrag und Teilbeträgen, Reservieren über den persönlichen Link (nach Antwort bzw. mit Einladung), Stückzahl
atomar begrenzt, „Überraschung“ (Standard) verbirgt die Namen auch vor der Verwaltung. Später: eine Liste für eine
ganze Reihe, Kontoverbindung/GiroCode für Geldwünsche.

**Szenario:** Hochzeit, Geburtstag.

**Idee:** Liste von Wünschen (auch Teilbeträge, z. B. für die Hochzeitsreise), Gäste reservieren, ohne dass die
Beschenkten sehen, wer was nimmt. Zugang über rsvp-app-Zusage oder Link mit Code.

### N5: Mitfahrgelegenheiten

**Bewertung (2026-10-07): zurückgestellt.** Kein konkreter Anlass.

**Szenario:** Hochzeit auf dem Land, Freizeiten, Ausflüge.

**Idee:** Angebote („3 Plätze ab Leipzig, Rückfahrt 2 Uhr“) und Gesuche, Kontakt erst nach Zustimmung beider Seiten.
Klein genug, um als Teil von rsvp-app zu beginnen.

---

## Querschnitt

### Q1: Einmal anlegen, überall verknüpfen

**Bewertung (2026-10-07): zurückgestellt.** Nützlich, aber bei wenigen Events pro Jahr ist das Verknüpfen von Hand verkraftbar; nach L1–L4 neu bewerten.

**Problem:** Für eine Hochzeit legt man heute vier Events in vier Tools an und verknüpft sie über IDs auf beiden Seiten.

**Idee:** Das Muster der Terminabstimmung übertragen (das Abstimmungstool legt ein rsvp-app-Event an, wenn das Konto
per Föderation verknüpft ist): In rsvp-app „Sitzplan anlegen“ bzw. „Zeitplan anlegen“, die verknüpfte Instanz
entsteht dort mit Titel, Datum und Zugang `RSVP`.

### Q2: Mehrsprachigkeit

**Bewertung (2026-10-07): zurückgestellt.** Großer Aufwand in allen Tools; erst bei konkretem internationalem Publikum.

**Problem:** Alle Tools sind nur deutsch (Erasmus-Studierende in der Kneipe, Hochzeit mit Familie im Ausland).

**Idee:** Einmal ein Muster festlegen (mindestens Gästeseiten und Mails in Deutsch/Englisch, Verwaltung zunächst nur
Deutsch) und es in allen Tools gleich umsetzen. Sprache pro Event oder aus dem Browser.

### Q3: Fotos der Gäste über Immich

**Bewertung (2026-10-07): angenommen.** Quick Win: Immich läuft schon auf dem Server, im Kern ein Feld und ein Datenschutzhinweis.

**Umgesetzt (2026-10-07) in rsvp-app:** Feld „Foto-Link“ pro Event/Termin (nur http(s)). Sichtbar nur für Gäste mit
Zusage (nicht Warteliste) und erst ab dem Ende des Termins, damit ein offener Upload-Link nicht vorher herumliegt.
Zeitplan bekommt keinen eigenen Link: Gäste erreichen die Fotos über ihre rsvp-app-Seite.

**Idee:** Keine eigene App: ein geteiltes Immich-Album mit Upload-Link pro Event, den rsvp-app oder Zeitplan nach dem
Event anzeigen (Feld „Foto-Link“, ab Eventende sichtbar). Datenschutzhinweis ergänzen.

### Q4: Vorlagen pro Event-Typ über alle Tools

**Bewertung (2026-10-07): zurückgestellt.** Setzt Q1 voraus.

**Idee:** „Pubquiz“ ergibt Teamanmeldung, Tischplan, Ablauf mit Runden und Scoreboard; „Hochzeit“ ergibt Einladungen,
Sitzordnung und Ablauf. Setzt Q1 voraus.

### Q5: Direkt weiter zum einzigen Anbieter

**Bewertung (2026-10-07): angenommen.** Quick Win: spart in jedem Tool einen Klick, kleine Änderung in suite-kit plus Schalter je Tool.

**Umgesetzt (2026-10-07), verallgemeinert:** In der eigenen Installation hat jedes Tool alle drei anderen als Anbieter
eingetragen, „genau ein Anbieter“ hätte also nie gegriffen. Stattdessen nennt `SUITE_LOGIN_REDIRECT` einen
**bevorzugten** Anbieter aus `SUITE_IDPS` (der Fall mit einem Anbieter ist darin enthalten). Umgesetzt in allen vier
Tools, nicht in suite-kit selbst (wenige Zeilen je Tool, keine neue Paketversion nötig); Regeln im README unter „Ein
weiteres Tool anbinden“, Schritt 4. E2E-Tests je Tool mit einer zweiten Instanz (`login-redirect.spec.ts`).

**Problem:** Auch mit Föderation klickt man in jedem Tool „Mit … anmelden“.

**Idee:** Optionale Einstellung je Tool: Ist genau ein Anbieter eingetragen und die Person nicht angemeldet, leitet die
Login-Seite direkt dorthin weiter (lokaler Login bleibt über einen Link erreichbar). Kein zentraler
Identitätsanbieter, nur weniger Klicks.

### Q6: Bot-Schutz für öffentliche Formulare

**Bewertung (2026-10-07): zurückgestellt.** Drosselung pro IP und E-Mail reicht bisher; erst bei beobachtetem Missbrauch (Drittanbieter, Datenschutz).

*Aus dem README von Seating übernommen (2026-10-07): „Später evtl.: `TURNSTILE_*`“.*

**Problem:** Öffentliche Formulare ohne Konto (Buchung in Seating, Zusage in rsvp-app, Mail-Bestätigung im
Abstimmungstool) sind heute nur gedrosselt (pro IP und pro E-Mail). Gegen verteilte Bots hilft das wenig.

**Idee:** Optionales Cloudflare Turnstile (oder ein anderer datensparsamer Dienst), nur aktiv, wenn `TURNSTILE_*` gesetzt
ist. Einmal als Muster festlegen und in allen Tools gleich umsetzen. Datenschutzerklärung ergänzen (Drittanbieter).
