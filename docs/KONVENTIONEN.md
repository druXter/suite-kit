# Konventionen der Suite

Was neben dem Aussehen ([DESIGN.md](DESIGN.md)) in allen Tools gleich sein soll: Aufbau, Betrieb, Sicherheit,
Datenschutz, Tests und Doku. Die Regeln sind aus dem Stand der Tools abgeleitet (geprüft am 2026-10-24, Abschnitt
[Prüfung](#prüfung-vom-2026-10-24)) - meist hat ein Tool sie schon gut gelöst, die anderen ziehen nach.

**Ein Tool weicht nur mit Begründung ab** und schreibt sie in sein README bzw. seine `CLAUDE.md`. Eine Regel ändert
man hier und zieht dann alle Tools nach, nicht umgekehrt.

## Aufbau eines Tools

* **Stack:** Next.js (App Router), React, Prisma mit SQLite, Tailwind 4, `suite-kit` als Git-Abhängigkeit mit
  festem Tag. **Alle Tools auf derselben Next-Minor-Version**: Sicherheitskorrekturen kommen über Minor-Versionen,
  ein Tool auf einem alten Stand ist die Lücke der ganzen Suite.
* **Ein Prisma-Client pro Tool** in `app/lib/prisma.ts`, nie `new PrismaClient()` in einer Seite oder Route (jeder
  Client hält eigene Verbindungen und eigenen Speicher, in der Entwicklung kommt bei jedem Hot Reload einer dazu).
* **Logik in `app/lib`**, rein und testbar, wo es geht (`buildX` rein, `loadX` liest die Datenbank). Seiten und
  Server Actions sind dünne Adapter. Eine Regel, die an zwei Stellen gilt (z.B. Kapazität, Rechte), hat genau eine
  Funktion.
* **Oberfläche nur aus `app/ui/kit`** (re-exportiert `suite-kit/ui`), siehe DESIGN.md. Eingabefelder immer mit
  `inputClass`, sonst fehlen die 16 px unter `sm` und iOS zoomt ins Formular.
* **Hilfsfunktionen, die jedes Tool braucht,** haben überall dasselbe Verhalten und denselben Namen:
  `app/lib/csv.ts` (siehe [Ausgaben](#ausgaben)), `esc`/`escapeHtml` für Mails, `readLimitedText` für Bodies,
  `safeEqual` für Geheimnisse. Kandidaten für `suite-kit`, sobald ein Tool sie ohnehin anfasst.

## Betrieb

* **Docker-Image** wie Seating, Zeitplan und Schichten: `node:<aktuelle LTS>-alpine`, `apk add git` (für
  `suite-kit`), **`USER node`** (nie root), `npm ci`, `npx prisma generate` und `npm run build` im Image, beim
  Start `npx prisma db push --skip-generate && npm start`. Im Container lauscht Next auf 3000.
* **Ports auf dem Server:** 3005 rsvp-app, 3006 Abstimmungstool, 3007 Seating, 3008 Zeitplan, 3009 Schichten.
  Das nächste Tool bekommt 3010. **Nur an `127.0.0.1` binden** (`"127.0.0.1:3006:3000"` wie das Abstimmungstool):
  Von außen kommt alles über den Cloudflare-Tunnel (`cloudflared` auf dem Host, verbindet zu `localhost`). Ein Port
  auf allen Schnittstellen ist über die öffentliche IPv6 des Servers womöglich direkt erreichbar - am Tunnel vorbei,
  mit selbst gesetztem `X-Forwarded-For`, also auch an der IP-Drosselung vorbei. Monitore deshalb über die
  öffentliche Adresse, nicht über `192.168.178.126:<port>`.
* **Daten** in `./data` (Volume `/app/data`, `DATABASE_URL=file:/app/data/prod.db`, `TZ=Europe/Berlin`), das
  Verzeichnis gehört UID 1000.
* **Schemaänderungen** über `prisma db push`, keine Migrationsdateien. Einmalige Datenmigrationen als
  `migrate-*.js`, je durch `PRAGMA user_version` geschützt (läuft nie doppelt), im `CMD` vor `npm start`.
* **Vor jedem Deploy** die Datenbank sichern: `sqlite3 -readonly data/prod.db ".backup ~/<tool>-backups/prod.db.backup-<JJJJMMTT-HHMMSS>-pre-<thema>"`,
  dann `docker compose up -d --build` im Tool-Verzeichnis, danach Startlog (`db push`, `Ready`) und eine Seite prüfen.
* **Cron** über Uptime Kuma: `GET /api/cron/<name>?secret=<CRON_SECRET>`. Jedes Tool mit Löschfristen hat
  `/api/cron/cleanup` (täglich). **Jede Cron-Route eines Tools hat einen Monitor**, dazu je Tool ein Monitor für die
  Erreichbarkeit und einer für das Backup - eine Route ohne Monitor läuft nie, eine Löschfrist ohne Lauf ist ein
  Datenschutzverstoß. Neue Cron-Route = neuer Monitor im selben Arbeitsgang (Intervalle: `cleanup` 24 h,
  Erinnerungen 1 h, Warnungen 15 min).
* **Abhängigkeiten:** vor jedem Deploy `npm audit --omit=dev` - keine `high`/`critical`. Danach `npm install`
  laufen lassen: `npm audit fix --omit=dev` entfernt die Entwicklungsabhängigkeiten aus `node_modules`.

## Umgebungsvariablen

Gleiche Bedeutung, gleicher Name in jedem Tool (`.env.example` listet alle mit Platzhaltern):

| Gruppe | Variablen |
| --- | --- |
| Grundlage | `DATABASE_URL`, `BASE_URL` (öffentliche Adresse ohne Slash, zugleich Kennung in der Suite), `TRUST_PROXY_HOPS` (gemessen, hier `1`), `CRON_SECRET` |
| Pflichtangaben | `IMPRESSUM_NAME`, `IMPRESSUM_STREET`, `IMPRESSUM_ZIP`, `IMPRESSUM_CITY`, `IMPRESSUM_EMAIL`, `IMPRESSUM_PHONE` |
| Mail | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` - ohne `SMTP_HOST` verschickt das Tool nichts und läuft weiter |
| Push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` - optional |
| Konten-Verbund | `SUITE_*`, siehe README |
| Anbindungen | `<PARTNER>_BASE_URL` und ein Secret je Tool-Paar (Tabelle unten) |
| Eigene Link-Geheimnisse | `<ZWECK>_SECRET`, beim Wechsel `<ZWECK>_SECRET_PREVIOUS` (z.B. `MANAGE_LINK_SECRET`, `DISPLAY_LINK_SECRET`) |

**Secrets der Anbindungen:** je Tool-Paar ein eigenes, auf beiden Seiten gleich, nie zwischen Paaren geteilt (sonst
gälte eine Nachricht der einen Anbindung auch in der anderen). Das später angebundene Tool hängt seinen Namen an:

| Paar | erstes Tool | später angebundenes Tool |
| --- | --- | --- |
| rsvp-app ↔ Seating | `SEATING_SECRET` | `RSVP_SEATING_SECRET` |
| rsvp-app ↔ Zeitplan | `TIMELINE_SECRET` | `RSVP_TIMELINE_SECRET` |
| rsvp-app ↔ Schichten | `SHIFTS_SECRET` | `RSVP_SHIFTS_SECRET` |
| Zeitplan ↔ Schichten | `SHIFTS_SECRET` | `TIMELINE_SHIFTS_SECRET` |
| rsvp-app ↔ Abstimmungstool | `POLL_VERIFICATION_SECRET` | `RSVP_VERIFICATION_SECRET` (ältere Benennung, bleibt) |

Partner-Adressen heißen nach dem Partner: `RSVP_APP_BASE_URL`, `SEATING_BASE_URL`, `TIMELINE_BASE_URL`,
`SHIFTS_BASE_URL`, `ABSTIMMUNGSTOOL_BASE_URL`. Ausnahme: Das Abstimmungstool nennt Zeitplan `ZEITPLAN_BASE_URL`
(bleibt, Umbenennen bräche bestehende Installationen).

## Sicherheit

Jede dieser Regeln steht in mindestens einem Tool schon im Code samt Test; Begründungen im README von rsvp-app
(„Konto-Sicherheit“) und in [PROTOCOL.md](PROTOCOL.md).

### Konten und Sitzungen

* Sitzung serverseitig: Cookie trägt nur einen zufälligen Token, die Datenbank nur dessen SHA-256-Hash. Cookie
  `__Host-session` (HttpOnly, Secure, SameSite=Lax, ohne Domain), 30 Tage. Nach jedem Login eine neue Sitzung
  (Session-Fixation), Abmelden löscht sie auch in der Datenbank.
* Einmal-Links (Passwort-Reset, E-Mail-Änderung, Konto-Bestätigung) nur als Hash gespeichert, 1 Stunde gültig, nach
  Gebrauch verbraucht. **Mail-Links lösen beim Aufruf nichts aus**, erst ein Knopf auf der Seite (Link-Scanner).
* Passwort: mindestens 10 Zeichen, höchstens 72 Byte, nicht naheliegend, serverseitig geprüft
  (`MIN_PASSWORD_LENGTH`); bcrypt mit Kosten 12, ältere Hashes beim Login erneuert.
* Drosselung: Versuch **vor** der Prüfung atomar reservieren; Login 10 pro E-Mail und 20 pro IP in 15 Minuten,
  Reset-Mails 3 pro E-Mail und Stunde. Keine dauerhafte Sperre. Unbekannte Adresse: gleiche Meldung, gleiche
  Rechenzeit (Prüfung gegen einen Wegwerf-Hash).
* Konten mit Admin-Rolle: kein Passwort-Reset per Mail, in der Oberfläche weder löschbar noch herabstufbar
  (nur per Skript auf dem Server).
* API-Tokens: nur als Hash gespeichert, einmal angezeigt, einzeln widerrufbar. Ein Token trägt keine eigenen Rechte,
  jede Anfrage prüft die aktuellen Rechte des Kontos.

### Rechte

* Jede Server Action prüft selbst Anmeldung **und** Zugriff auf genau das Objekt, das sie anfasst - es gibt keine
  Middleware, die das übernimmt. IDs aus Formularen sind Eingaben eines Angreifers.
* Ohne Zugriff dieselbe Antwort wie für ein unbekanntes Objekt (404), damit sich IDs nicht ertasten lassen.

### Sicherheits-Header (`next.config.ts`)

Dieselben Bausteine in jedem Tool:

```ts
const NO_FRAMING = [{ key: 'X-Frame-Options', value: 'DENY' }, { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" }]
const NOT_STORED = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'no-store' }]
const PRIVATE_PAGE = [...NO_FRAMING, ...NOT_STORED]
const EMBEDDABLE = [{ key: 'Content-Security-Policy', value: 'frame-ancestors *' }]
```

1. Auf alle Pfade: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
   `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Strict-Transport-Security: max-age=31536000`
   (ohne `includeSubDomains`).
2. **Einbetten grundsätzlich verboten** (`NO_FRAMING`), erlaubt nur für Gästeseiten, die wirklich eingebettet werden
   (`EMBEDDABLE`) - Einbetten erlauben ist die Ausnahme, nicht umgekehrt.
3. Verwaltung, Konto, Login: `PRIVATE_PAGE`. Seiten mit Geheimnis in der URL (Reset, Bestätigung, persönliche Links,
   Anzeige-Schlüssel): zusätzlich `Referrer-Policy: no-referrer`. `/api/suite/*`: `no-referrer`.
4. `/sw.js`: `Cache-Control: no-cache, no-store, must-revalidate` und `default-src 'self'; script-src 'self'; frame-ancestors 'none'`.
5. Bei mehreren passenden Regeln gewinnt die spätere. Ein E2E-Test (`tests/e2e/headers.spec.ts`) prüft die
   Pfadgruppen; eine neue einteilige Route wird dort und in der Ausnahmeliste ergänzt.

### Anbindungen zwischen Tools

Neben der Konten-Föderation (Ed25519, [PROTOCOL.md](PROTOCOL.md)) tauschen Tools fachliche Nachrichten aus. Für neue
Anbindungen gilt das Format aus `app/lib/linked-tools.ts` (rsvp-app):

* `base64url(JSON).base64url(HMAC-SHA256)`, Nutzlast `{ typ, aud, ...felder, iat, exp }`. **`typ` Pflicht** und
  vom Empfänger geprüft (eine Nachricht einer Art gilt nie als andere), `aud` = Origin des Empfängers,
  Lebensdauer höchstens eine Stunde (Standard 10 Minuten). Signatur mit `timingSafeEqual` vergleichen.
* Body **begrenzt einlesen** (`readLimitedText(request, MAX_BODY)`) - `(await request.text()).slice(...)` begrenzt
  nichts, der Body ist dann schon im Speicher.
* Antworten: `401` ungültige Nachricht, `404` nicht konfiguriert bzw. nicht verknüpft, `409` Zustand passt nicht,
  immer `Cache-Control: no-store`. Abrufe beim Partner ohne Weiterleitungen (`redirect: 'error'`) und mit Timeout.
* Übertragen wird nur, was der Partner braucht (Kennungen statt Namen, wo es geht).
* Beide Seiten haben feste Prüfnachrichten in ihren Unit-Tests, damit das Format nicht auseinanderläuft.

### Ausgaben

* **HTML-Mails:** Alles, was nicht wörtlich im Code steht, geht durch `esc`/`escapeHtml` - Namen und Angaben von
  Gästen genauso wie Titel, Ort und Texte der Verwaltung. Gäste können sich mit fremder Adresse anmelden, ohne
  Escaping käme fremdes HTML über unseren (DKIM-signierten) Absender. Betreff und Textteil nicht escapen.
* **CSV:** `app/lib/csv.ts` - Semikolon, jede Zelle in Anführungszeichen, BOM für Excel, Zellen mit `= + - @`,
  Tab oder Zeilenumbruch am Anfang mit vorangestelltem Hochkomma (CSV-Injection). Zahlen dürfen ausgenommen sein.
  Export-Routen prüfen Anmeldung und Zugriff wie jede Seite, Antwort mit `Cache-Control: no-store`.
* Kein `dangerouslySetInnerHTML`, kein `$queryRawUnsafe`.
* Öffentliche Gästelisten: Abfrage mit ausdrücklicher Feldliste (`select`), nie E-Mail, Telefon oder Allergien.

## Datenschutz

* `/impressum` und `/datenschutz` in jedem Tool, `force-dynamic`, Angaben aus `IMPRESSUM_*`; Link in der
  Fußzeile jeder Seite. Ein neuer Datenfluss (Anbindung, Push, API) kommt im selben Commit in die Datenschutzerklärung,
  mit dem tatsächlichen Empfänger.
* **Löschfristen:** Inhalte 18 Monate nach Ende, Konten nach 2 Jahren ohne Anmeldung (Konten mit Admin-Rolle
  ausgenommen, in rsvp-app alle Verwaltungskonten). Umgesetzt im Cron `cleanup`.
* Gesundheitsdaten (Essenswünsche, Allergien, Art. 9 DSGVO) verlassen ein Tool nicht über APIs oder Anbindungen,
  höchstens als Anzahl.

## Tests

* Unit-Tests mit Vitest (`tests/unit`, reine Logik aus `app/lib`), E2E mit Playwright (`tests/e2e`, eigene Instanz auf
  eigenem Port mit frischer Datenbank, Mail/Push/Partner abgeschaltet oder durch Attrappen ersetzt).
* **Jeder Angriffsfall hat eine Positivkontrolle**: dieselbe Anfrage mit den richtigen Rechten gelingt - sonst
  beweist ein „abgelehnt“ nichts.
* Vor jedem Commit: Typen (`tsc --noEmit`), Lint, Unit-Tests; vor jedem Deploy zusätzlich alle E2E-Tests.

## Doku und Git

* Je Tool: `README.md` (Funktionen, Env, Betrieb, Sicherheit), `CLAUDE.md` (Architektur und Regeln für die
  Arbeit am Code, versioniert), `docs/KONZEPT-OBERFLAECHE.md` (wie das Tool DESIGN.md umsetzt), weitere
  `docs/KONZEPT-*.md` je größerem Feature. Was für alle gilt, steht hier in suite-kit (README, DESIGN.md, diese
  Datei, PROTOCOL.md); Ideen in [IDEEN.md](IDEEN.md), offene Wartung in [TODO.md](../TODO.md).
* README und Datenschutzerklärung werden mit der Änderung selbst aktualisiert, nicht später.
* Commits auf Deutsch mit Präfix `feat:`, `fix:`, `security:`, `refactor:`, `docs:`, `test:`, `chore:`.

## Selbstprüfung

Vor einem Release oder beim Durchsehen eines Tools, im Tool-Verzeichnis:

```bash
npm audit --omit=dev                                          # keine high/critical
grep -rn "new PrismaClient" app | grep -v app/lib/prisma.ts   # leer
grep -rn "request.text()\|request.json()" app/api             # nur über readLimitedText
grep -rn "dangerouslySetInnerHTML\|queryRawUnsafe" app        # leer
grep -rn 'border border-gray-300 p-2' app --include=*.tsx     # leer (inputClass)
grep -n "^USER\|npm ci" Dockerfile                            # USER node, npm ci
```

## Prüfung vom 2026-10-24

Durchgesehen: suite-kit, rsvp-app vollständig, die anderen Tools im Vergleich.

**suite-kit:** keine Befunde. Feste Algorithmen und Typen, Origin-Allowlists, `state` an ein Cookie gebunden,
Discovery ohne Weiterleitungen und mit Größenlimit.

**rsvp-app - behoben:**

* Next.js 16.3.8 mit kritischer Lücke (RCE über die Bild-Optimierung, DoS über Server Actions), dazu nodemailer,
  sharp und source-map-js mit bekannten Lücken → Next 16.4.3, `npm audit --omit=dev` ohne Befund.
* Gästeliste-CSV ohne Formel-Schutz (Küche und Anwesenheit hatten ihn) → gemeinsames `app/lib/csv.ts`.
* 14 HTML-Mails setzten Gast-Namen, Titel und Ort ungeschützt ein → überall `escapeHtml`, eine gemeinsame Funktion.
* Header nach altem Muster (Einbetten erlaubt außer Verwaltung): `/verify` mit dem Bestätigungsknopf und die
  Reihenseiten waren einbettbar, Verwaltung und Konto ohne `noindex`/`no-store`, keine `no-referrer` auf Token-Seiten,
  keine Regel für `/sw.js` → Muster oben.
* 33 eigene `PrismaClient`-Instanzen → ein gemeinsamer Client.
* Sechs Routen lasen den Body unbegrenzt; die Client-API antwortete auf `null` als Body mit 500 → Limits, 400.
* Container lief als root mit `npm install` und erzeugte den Prisma-Client bei jedem Start neu → wie Seating.
* 27 Eingabefelder ohne `inputClass` (iOS-Zoom auf den Gästeformularen), Emojis an acht Knöpfen → Bausteine.
* Fünf ungenutzte SVGs aus der Next-Vorlage in `public/`.

**Offen** (in [TODO.md](../TODO.md)):

* Abstimmungstool, Seating, Zeitplan, Schichten: Next.js mit derselben kritischen Lücke, nodemailer mit hoher
  (Seating, Zeitplan, Schichten), sharp und zod. Seating, Zeitplan und Schichten pinnen Next exakt auf 16.3.5.
* Abstimmungstool läuft noch als root mit `npm install`.
* Unbegrenzt gelesene Bodies: Abstimmungstool (`rsvp-assembly`, `assembly/decisions`, `rsvp-webhook`), Seating und
  Zeitplan (`rsvp-webhook` mit `.slice()` nach dem Lesen), Zeitplan (`schichten/forecast`).
* Kopplung rsvp-app ↔ Abstimmungstool (älteste Anbindung): Ergebnis-Meldung ohne `typ` und ohne Obergrenze für
  `exp`, kein `aud`. Beim nächsten Umbau der Kopplung auf das Format oben bringen (beide Seiten gleichzeitig).
* Alle Tools auf `node:20-alpine` (End-of-Life), siehe TODO.md.
* rsvp-app versioniert als einziges Tool seine `CLAUDE.md` nicht.
* **Uptime Kuma:** Für Schichten gibt es keinen einzigen Monitor - `cleanup` (Löschfristen!), `reminders` und das
  Backup laufen nie. Für Zeitplan fehlt `alerts` (Vorwarnung fürs Team), für Schichten und Zeitplan ein
  Erreichbarkeits-Monitor.
* rsvp-app, Seating, Zeitplan und Schichten binden ihren Port an alle Schnittstellen (`0.0.0.0` und `[::]`), nur das
  Abstimmungstool an `127.0.0.1`. Umstellen, sobald geklärt ist, dass der Tunnel `localhost` nutzt; der Monitor
  „RSVP“ (`http://192.168.178.126:3005`) muss dann auf die öffentliche Adresse.
* Datenbankabfragen in Schleifen (rsvp-app: Einladungsversand, Erinnerungen, Schichten-Abgleich) - bei der heutigen
  Datenmenge unkritisch, meist bewusst als atomare Einzel-Updates.
