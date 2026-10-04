# Ideen für die Suite

Sammlung von Lücken, Feature-Ideen und möglichen neuen Tools, entstanden aus einer Bestandsaufnahme der vier Tools
(rsvp-app, abstimmungstool, seating, zeitplan) im Oktober 2026. **Nichts davon ist beschlossen.** Jede Idee wird
später nach Machbarkeit und Nutzen bewertet und dann angenommen, zurückgestellt oder verworfen.

**Status:** `offen` (noch nicht bewertet) · `angenommen` · `in Arbeit` · `umgesetzt` · `zurückgestellt` · `verworfen`
(verworfene Ideen bleiben mit Begründung stehen, damit sie nicht wieder auftauchen).

**Aufwand** ist eine erste grobe Schätzung: **S** = ein paar Stunden bis ein Tag, **M** = mehrere Tage, **L** = eine
Phase wie bei Seating/Zeitplan (Konzept, mehrere Schritte, eigene Tests).

## Übersicht

| ID | Idee | Betrifft | Aufwand | Status |
| --- | --- | --- | --- | --- |
| [P1](#p1-suite-paket) | Suite-Paket: gemeinsames Deployment der Einzel-Apps | neu (Deploy-Repo) | L | offen |
| [P2](#p2-pwas-und-gemeinsame-startseite) | PWAs und gemeinsame Startseite | Paket, alle Tools | M | offen |
| [L1](#l1-geld-preise-bezahlstatus-kasse) | Geld: Preise, Bezahlstatus, GiroCode, Abendkasse | rsvp-app | L | offen |
| [L2](#l2-einladungen-pro-haushalt-mehrere-begleitungen) | Einladungen pro Haushalt, mehrere Begleitungen | rsvp-app (+ seating) | L | offen |
| [L3](#l3-angaben-pro-person-und-menüwahl) | Essen/Allergien pro Person, Menüwahl pro Gang | rsvp-app | M | offen |
| [L4](#l4-ticketkategorien-und-kontingente) | Ticketkategorien und Kontingente | rsvp-app | M | offen |
| [L5](#l5-mitbringliste-mit-slots) | Mitbringliste mit Slots zum Beanspruchen | rsvp-app | S–M | offen |
| [L6](#l6-session-anmeldung-mit-kapazität) | Session-Anmeldung mit Kapazität pro Programmpunkt | zeitplan (+ rsvp-app) | M–L | offen |
| [L7](#l7-sitzungsmodus-für-versammlungen) | Sitzungsmodus für Versammlungen | abstimmungstool, rsvp-app, zeitplan | L | offen |
| [L8](#l8-fragebogen-feedback-nach-dem-event) | Fragebogen / Feedback nach dem Event | abstimmungstool (+ rsvp-app) | M | offen |
| [L9](#l9-teams-bei-der-anmeldung) | Teams bei der Anmeldung (Teamname, Teamgröße) | rsvp-app / seating | S–M | offen |
| [N1](#n1-dienste--schichten) | Neues Tool: Dienste/Schichten | neu | L | offen |
| [N2](#n2-wertung--scoreboard) | Neues Tool: Wertung/Scoreboard (Quiz, Turniere) | neu | L | offen |
| [N3](#n3-kasse--abrechnung) | Neues Tool: Kasse/Abrechnung (Kostenteilung) | neu | M–L | offen |
| [N4](#n4-wunschliste--geschenke) | Neues Tool: Wunschliste/Geschenke | neu | M | offen |
| [N5](#n5-mitfahrgelegenheiten) | Mitfahrgelegenheiten (eigenes Tool oder Teil von rsvp-app) | neu / rsvp-app | M | offen |
| [Q1](#q1-einmal-anlegen-überall-verknüpfen) | Einmal anlegen, überall verknüpfen | alle Tools | M je Paar | offen |
| [Q2](#q2-mehrsprachigkeit) | Mehrsprachigkeit (mindestens Deutsch/Englisch) | alle Tools | L | offen |
| [Q3](#q3-fotos-der-gäste-über-immich) | Fotos der Gäste über Immich statt eigener App | rsvp-app / zeitplan | S | offen |
| [Q4](#q4-vorlagen-pro-event-typ-über-alle-tools) | Vorlagen pro Event-Typ über alle Tools | alle Tools | M–L | offen |
| [Q5](#q5-direkt-weiter-zum-einzigen-anbieter) | Login: direkt weiter zum einzigen Anbieter | suite-kit, alle Tools | S | offen |

### Wo die Ideen ansetzen

Die Suite deckt den Kern **anmelden → entscheiden → platzieren → Ablauf steuern** ab. Die Lücken liegen **davor**
(einladen, Geld, Helfer\*innen), **daneben** (Teams, Wertung, Sessions) und **danach** (Feedback, Fotos, Abrechnung).

| Szenario | Wichtigste Ideen |
| --- | --- |
| Regelmäßige Freundesrunde | L5, N3 |
| Pubquiz in der Studikneipe | L1 (Startgeld), L9, N2, N1 |
| Winterball | L1, L3, L4, N1 |
| Hochzeit | L2, L3, N4, N5, Q3 |
| Workshops, Ersti-Woche, Barcamp, Tag der offenen Tür | L6 (+ abstimmungstool für Session-Vorschläge) |
| Mitgliederversammlung, Fachschaft, StuPa | L7 |
| Freizeiten, Ersti-Fahrt, Vereinsausflug | N5, N3, Zimmerverteilung über seating `ASSIGNED` (schon möglich) |
| Turniere, Spieleabend, Sportfest | N2 |
| Internationales Publikum | Q2 |

---

## Suite-Paket

### P1: Suite-Paket

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

**Problem:** rsvp-app ist offene Anmeldung (ggf. mit PIN). Bei Hochzeiten lädt man aber gezielt Haushalte ein.
Außerdem erlaubt `companions` höchstens **eine** Begleitung, Familien mit Kindern passen nicht hinein.

**Idee:** Einladungsliste je Event mit persönlichem Link pro Haushalt und vorgegebenen Namen („Ihr seid zu viert
eingeladen“). Zu- und Absage **pro Person**, Altersgruppe (Erwachsene/Kind) für Menü und Zählung. Wer nicht eingeladen
ist, kommt nicht hinein (Modus pro Event, offene Anmeldung bleibt Standard).

**Abhängigkeiten:** Vertrag mit Seating (`companions` wird eine echte Liste, Seating kennt dann alle Namen pro Platz)
und mit Zeitplan (unverändert, dort zählt nur die Zusage). L3.

### L3: Angaben pro Person und Menüwahl

**Problem:** Essenswunsch und Allergien hängen an der Antwort, nicht an jeder Person (die Begleitung hat keine eigenen).
Für Ball und Hochzeit fehlt eine Menüwahl pro Gang.

**Idee:** Angaben pro Person (Gast und jede Begleitung). Menü als frei definierbare Gänge mit Auswahl (z. B. Hauptgang
Fisch/Fleisch/vegetarisch), Auswertung für die Küche (Anzahl je Option, Liste pro Tisch zusammen mit Seating).

### L4: Ticketkategorien und Kontingente

**Problem:** Eine Kapazität pro Event reicht beim Ball nicht (Studi/Gast/Ermäßigt, „Ball mit Dinner“ vs. „nur Ball“).

**Idee:** Kategorien pro Event mit eigenem Kontingent, eigenem Preis (L1) und eigener Warteliste; Gesamtkapazität
bleibt als Obergrenze. Kategorie im Einlass sichtbar.

### L5: Mitbringliste mit Slots

**Problem:** „Mitbringsel“ ist Freitext, dadurch bringen fünf Leute Nudelsalat.

**Idee:** Liste mit Einträgen und Anzahl („Salat 2/2, Getränke 1/3, Nachtisch 0/2“), Gäste beanspruchen einen Slot
beim Zusagen oder später über ihren persönlichen Link. Optional als Vorlage für Reihen (Freundesrunde).

### L6: Session-Anmeldung mit Kapazität

**Szenario:** Workshops, Ersti-Woche, Barcamp, Tag der offenen Tür: parallele Slots, Gäste wählen Sessions.

**Idee:** Programmpunkte in Zeitplan bekommen optional eine Kapazität. Gäste mit Zugang melden sich pro Punkt an
(Überschneidungen werden verhindert), Warteliste je Punkt. Barcamp-Kette: Session-Vorschläge und Voting im
Abstimmungstool (`allowVoterOptions`), Gewinner landen als Punkte im Zeitplan.

**Offene Fragen:** Gehört das in Zeitplan (Ablauf) oder in rsvp-app (Anmeldung)? Zeitplan kennt heute bewusst keine
Namen von Gästen.

### L7: Sitzungsmodus für Versammlungen

**Szenario:** Mitgliederversammlung, Fachschaftsrat, StuPa.

**Idee:** Die Bausteine verbinden: Tagesordnung (Zeitplan), Anwesenheit über den Check-in (rsvp-app),
**„nur Eingecheckte dürfen abstimmen“** (Check-in → Stimmlinks, auch geheim), viele kurze Abstimmungen hintereinander
mit wenig Klicks, Beschlussfähigkeit live (Quorum gibt es schon), Rednerliste. Später: Protokoll-Export.

**Abhängigkeiten:** neuer Vertrag rsvp-app → abstimmungstool (Liste der Eingecheckten bzw. Token beim Check-in).

### L8: Fragebogen / Feedback nach dem Event

**Problem:** Eine Abstimmung hat genau eine Frage, Freitext gibt es nicht.

**Idee:** Abstimmungsart „Fragebogen“ mit mehreren Fragen (Auswahl, Skala, Freitext) im Abstimmungstool. rsvp-app
schickt nach dem Event automatisch den Link an alle Eingecheckten (bzw. alle Zusagen), Identität über den bestehenden
`RSVP`-Modus.

### L9: Teams bei der Anmeldung

**Szenario:** Pubquiz, Turniere.

**Idee:** Anmeldung als Team mit Teamname und Teamgröße. Eine Tischbuchung in Seating (`TABLE`) deckt den Teamtisch
schon ab; es fehlen Teamname und die Übergabe an N2.

---

## Mögliche neue Tools

Alle nach dem Muster von Seating und Zeitplan: eigenständig zuerst, eigene Datenbank und Konten, Föderation über
suite-kit, optionale Anbindung an rsvp-app mit eigenem Secret.

### N1: Dienste / Schichten

**Problem:** Mittlere und große Events (Bar, Einlass, Garderobe, Aufbau, Abbau) brauchen Helfer\*innen. Zeitplan hat
Team-Spuren, aber niemand kann sich in einen Dienst eintragen. Das ist die größte fehlende Funktion für mittlere und
große Events.

**Idee:** Schichten mit Slots (Ort, Zeit, Anzahl, Anforderungen), Selbst-Eintragen per Link (ohne Konto, wie
Buchungen in Seating), Tauschbörse, Erinnerungen per Mail/Push, Übersicht „wer ist gerade wo“, Druckansicht.

**Anbindungen:** Zeitplan (Schicht hängt an Programmpunkt oder Spur, Verspätungen verschieben Schichten mit), rsvp-app
(Helfer\*innen bekommen automatisch eine Zusage bzw. freien Eintritt).

### N2: Wertung / Scoreboard

**Szenario:** Pubquiz, Turniere, Spieleabend, Sportfest.

**Idee:** Teams, Runden, Punkteeingabe am Handy (mehrere Moderator\*innen gleichzeitig, wie die Live-Steuerung in
Zeitplan), Rangliste auf einer Anzeigetafel (Tafel und Polling aus Zeitplan wiederverwenden). Später Turnierformen:
K.-o.-Baum, Gruppenphase, Schweizer System.

**Anbindungen:** Teams aus L9 bzw. Tischbuchungen in Seating.

### N3: Kasse / Abrechnung

**Szenario:** Freundesrunde, Freizeiten, WG-Abend; eventuell Budget und Belege für Veranstalter\*innen (Fachschaftsgeld,
Hochzeitsbudget).

**Idee:** Ausgaben erfassen (wer hat was für wen bezahlt), Salden und minimale Ausgleichszahlungen, GiroCode für die
Überweisung. Teilnehmende aus einer rsvp-app-Reihe übernehmen.

**Abgrenzung zu L1:** L1 kassiert vom Gast an den Veranstalter, N3 verteilt Kosten innerhalb einer Gruppe. Beides
zusammen nur, wenn es wirklich gebraucht wird.

### N4: Wunschliste / Geschenke

**Szenario:** Hochzeit, Geburtstag.

**Idee:** Liste von Wünschen (auch Teilbeträge, z. B. für die Hochzeitsreise), Gäste reservieren, ohne dass die
Beschenkten sehen, wer was nimmt. Zugang über rsvp-app-Zusage oder Link mit Code.

### N5: Mitfahrgelegenheiten

**Szenario:** Hochzeit auf dem Land, Freizeiten, Ausflüge.

**Idee:** Angebote („3 Plätze ab Leipzig, Rückfahrt 2 Uhr“) und Gesuche, Kontakt erst nach Zustimmung beider Seiten.
Klein genug, um als Teil von rsvp-app zu beginnen.

---

## Querschnitt

### Q1: Einmal anlegen, überall verknüpfen

**Problem:** Für eine Hochzeit legt man heute vier Events in vier Tools an und verknüpft sie über IDs auf beiden Seiten.

**Idee:** Das Muster der Terminabstimmung übertragen (das Abstimmungstool legt ein rsvp-app-Event an, wenn das Konto
per Föderation verknüpft ist): In rsvp-app „Sitzplan anlegen“ bzw. „Zeitplan anlegen“, die verknüpfte Instanz
entsteht dort mit Titel, Datum und Zugang `RSVP`.

### Q2: Mehrsprachigkeit

**Problem:** Alle Tools sind nur deutsch (Erasmus-Studierende in der Kneipe, Hochzeit mit Familie im Ausland).

**Idee:** Einmal ein Muster festlegen (mindestens Gästeseiten und Mails in Deutsch/Englisch, Verwaltung zunächst nur
Deutsch) und es in allen Tools gleich umsetzen. Sprache pro Event oder aus dem Browser.

### Q3: Fotos der Gäste über Immich

**Idee:** Keine eigene App: ein geteiltes Immich-Album mit Upload-Link pro Event, den rsvp-app oder Zeitplan nach dem
Event anzeigen (Feld „Foto-Link“, ab Eventende sichtbar). Datenschutzhinweis ergänzen.

### Q4: Vorlagen pro Event-Typ über alle Tools

**Idee:** „Pubquiz“ ergibt Teamanmeldung, Tischplan, Ablauf mit Runden und Scoreboard; „Hochzeit“ ergibt Einladungen,
Sitzordnung und Ablauf. Setzt Q1 voraus.

### Q5: Direkt weiter zum einzigen Anbieter

**Problem:** Auch mit Föderation klickt man in jedem Tool „Mit … anmelden“.

**Idee:** Optionale Einstellung je Tool: Ist genau ein Anbieter eingetragen und die Person nicht angemeldet, leitet die
Login-Seite direkt dorthin weiter (lokaler Login bleibt über einen Link erreichbar). Kein zentraler
Identitätsanbieter, nur weniger Klicks.
