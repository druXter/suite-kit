# Offene Punkte

Stand: 24.10.2026. Wartungs- und Betriebsaufgaben, die mehrere Tools der Suite betreffen. Feature-Ideen stehen in
[docs/IDEEN.md](docs/IDEEN.md), Punkte eines einzelnen Tools in dessen eigenem Repo.
Jeder Punkt mit Begründung, warum er noch offen ist.

## Wartung

- [x] **Alle Tools von `node:20-alpine` auf `node:22-alpine` umgestellt** (24.10.2026), suite-kit `engines.node` auf
  `>=22`. Node 20 ist seit April 2026 End-of-Life. Je Tool Image gebaut, Prisma-Client und `db push` im Container,
  Unit- und E2E-Tests, Föderation und Anbindungen geprüft. Node 22 wird bis April 2027 unterstützt - dann auf Node 24.

  Die Campus-App gehört nicht zur Suite. Ihr Backend läuft noch auf `node:18`, der Punkt steht in deren `TODO.md`.

## Sicherheit und Konsistenz (Prüfung vom 24.10.2026)

Befunde und Begründungen in [docs/KONVENTIONEN.md](docs/KONVENTIONEN.md#prüfung-vom-2026-10-24). Alles aus der Prüfung
ist umgesetzt.

- [x] Next.js 16.4.3, nodemailer, sharp, zod, source-map-js in allen Tools - `npm audit --omit=dev` ohne Befund.
- [x] Abstimmungstool im Container als `node` mit `npm ci` und `--skip-generate`, `data/` an UID 1000.
- [x] Bodies überall über `readLimitedText`.
- [x] Kopplung rsvp-app ↔ Abstimmungstool im Format mit `typ`, `aud` und begrenztem `exp`, feste Prüfnachrichten.
- [x] Gemeinsame Helfer (`escapeHtml`, CSV, `readLimitedText`, `safeEqual`, Header-Bausteine, Nachrichtenformat) in
  suite-kit v0.5.1, alle Tools nutzen sie.
- [x] Ports nur an `127.0.0.1`, alle Tools zusätzlich im Netz `proxy_net` (Uptime Kuma prüft intern).
- [x] rsvp-app versioniert `CLAUDE.md`.
- [x] **Uptime Kuma** (24.10.2026): „RSVP“ prüft `http://rsvp-app:3000`, neu die Erreichbarkeit von Abstimmungstool,
  Seating, Zeitplan und Schichten (intern über `proxy_net`) und die Push-Monitore „Schichten Cleanup“, „Schichten
  Reminders“, „Schichten Backups“ und „Zeitplan Alerts“ (Tokens in `~/scripts/kuma-push.env`). Alle melden „up“.
- [x] **Gemeinsamer Mail-Baustein** (`renderMail` in suite-kit v0.6): alle Mails aller Tools aus einer Vorlage,
  Gestaltung in docs/DESIGN.md („Mails“).

## Sicherheitsprüfung suite-kit (11.11.2026)

Funde, Szenarien und Behebung in [docs/AUDIT-2026-11.md](docs/AUDIT-2026-11.md), je Fund ein Test in
`test/audit-2026-11.test.ts`. Alles behoben und in allen Tools eingespielt.

- [x] **A-01** (mittel) Push-Endpoint: Prüfung und Versand (`web-push`) lesen den Host gleich - v0.11.1, rsvp-app
  aktualisiert, Bestand geprüft (nichts zu löschen).
- [x] **A-02** (mittel) `haushaltsbuch` in `scripts/auskunft.sh` und `scripts/update-apps.mjs`.
- [x] **A-03** bis **A-05**, **A-13** (v0.12.0): Discovery begrenzt gelesen, gebremst und gemerkt; `askAi` ohne fremden
  Text im Log und ohne Weiterleitungen.
- [x] **A-06** bis **A-12** (v0.13.0): `SUITE_IDPS`-Schalter nur als Boolean, `SUITE_SIGNING_KEY_PREVIOUS` allein ist
  ein Fehler, Aussteller hält die Grenzen des Prüfers ein, `/api/suite/*` mit `no-store`, CSV-Schutz auch nach
  Leer- und Steuerzeichen, base64url nur kanonisch, `exp > iat`.
- [x] Beobachtungen ohne Fund (v0.14.0): Bot-Schutz mit Obergrenze und seltenerem Aufräumen; einzeilige Angaben über
  `singleLine` - in allen Tools liest `formString` nur noch eine Zeile, Textareas `formText` (2026-11-11).

## Eigene Durchsicht je Tool

Die Prüfung vom 24.10. ging von rsvp-app aus; die anderen Tools wurden dabei nur verglichen. Jedes Tool bekommt eine
eigene Durchsicht (Rechte in jeder Server Action und Route, Zugänge ohne Konto, Anbindungen, Push, Löschfristen,
Datenschutzerklärung, Laufzeiten, Oberfläche), Befunde in docs/KONVENTIONEN.md.

- [x] rsvp-app (24.10.2026)
- [x] Zeitplan (24.10.2026) - Befunde in KONVENTIONEN.md, „Durchsicht Zeitplan“
- [x] Schichten (24.10.2026) - Befunde in KONVENTIONEN.md, „Durchsicht Schichten“
- [x] Seating (24.10.2026) - ohne eigenen Befund, siehe KONVENTIONEN.md, „Durchsicht Seating“
- [x] Abstimmungstool (24.10.2026) - ein Befund (Zugangscode-Cookie berechenbar), behoben; KONVENTIONEN.md, „Durchsicht Abstimmungstool“

## Haushaltsbuch (2026-11-05)

* `readLimitedBytes` kommt seit v0.12.0 aus `suite-kit/web` (Inventur und Haushaltsbuch umgestellt, 2026-11-11); die
  eigene Bremse für erzwungene Discovery-Abrufe ist in allen zehn Callback-Routen entfallen.
* IBAN/BIC/EPC-QR stehen in rsvp-app (`app/lib/payment.ts`) und im Haushaltsbuch (`app/lib/iban.ts`) – braucht ein drittes
  Tool sie, nach suite-kit.

## v0.15.0 in allen Tools (15.11.2026)

`isSingleEmail` und `visitorOf` aus den Audits von Wichteln (W-08, W-09) und rsvp-app (R-07, R-08) liegen jetzt in
`suite-kit/web`. Wichteln und rsvp-app nutzen sie. Die übrigen Tools haben eigene Kopien von `throttle.ts` und
`normalizeEmail` ohne /64 bzw. mit lockererem Muster - je Tool beim nächsten Update umstellen.

- [x] Wichteln
- [x] rsvp-app
- [x] Abstimmungstool, Seating, Zeitplan, Schichten, Termine, Inventur, Startseite, Haushaltsbuch - über v0.17.0
  erledigt (siehe unten)

## v0.17.0: gemeinsame Regeln in allen Tools (16.11.2026)

`clientIpFrom` und `normalizeEmail` als fertige Funktionen in `suite-kit/web`, dazu `suite-kit/rules` und die Tabelle
„Wiederkehrende Funde“ (docs/KONVENTIONEN.md). Löst den Punkt „v0.15.0 in allen Tools“ oben ab. Je Tool:
`app/lib/throttle.ts` (`clientIp` über `clientIpFrom`), `app/lib/form.ts` (`normalizeEmail` aus suite-kit),
`tests/unit/suite-rules.test.ts` anlegen; vorhandene Adressen mit `<>(),;:` einmal suchen.

- [x] rsvp-app, Abstimmungstool, Zeitplan, Schichten, Wichteln, Termine, Startseite, Inventur (24.11.2026 eingespielt,
  dazu die AStA-Instanzen von Schichten und Wichteln; in keiner Datenbank Adressen mit `<>(),;:`). rsvp-app hat kein
  eigenes `normalizeEmail` (alle Formulare prüfen mit `isSingleEmail`), der Test prüft dort nur `clientIp`. Im
  Abstimmungstool bleibt `clientIp` die volle Adresse, weil `ipRules` zweistufig zählt (je /64 und darunter je
  Adresse, damit ein Hörsaal nicht gemeinsam gesperrt wird); die IP-Regeln laufen dort gegen die Netz-Stufe.
- [x] Seating (16.11., eingespielt 21.11.2026; keine Adressen mit `<>(),;:` in der Datenbank)
- [x] Haushaltsbuch (22.11.2026 mit der Behebung seiner Sicherheitsprüfung eingespielt; keine Adressen mit `<>(),;:`
  in der Datenbank)
- [x] Next.js 16.4.3 → 16.4.6 in allen Tools (24.11.2026, im Haushaltsbuch schon vorher): Advisories u. a.
  GHSA-pc58-hwjq-p385, GHSA-7qx7-33qx-rqx2, GHSA-f3mh-rxg3-f5g2; `next build` brach mit 16.4.3 abwechselnd mit
  „SecurityFatalError“ ab. Offen nach `npm audit --omit=dev`: `effect` (ReDoS, über `@prisma/config`, nur im
  Prisma-CLI beim Bauen) - der angebotene „Fix“ wäre ein Downgrade auf Prisma 6.12.0, deshalb bewusst nicht.

Später, wenn es sich lohnt (beides Muster aus der Tabelle, bisher je Tool gelöst):

- [ ] Mail an eine unbestätigte Adresse als eigene Sorte in `renderMail`, die keinen frei gewählten Text annimmt
- [ ] Rahmen von `auskunft.js` (`run({ collect, report, plan, erase, hints })`) als Modul, mit „unbestätigt“ als
  Pflichtangabe je Treffer

## v0.16.0: Titel in der Antwort von `/api/rsvp-create` (15.11.2026)

rsvp-app übernimmt ein schon vorhandenes Event nur noch nach Bestätigung und zeigt dazu den Titel (Audit Wichteln
W-02). Ohne `title` zeigt es nur den Link.

- [x] Wichteln schickt `title`, rsvp-app zeigt ihn und verlangt die Bestätigung.
- [x] Zeitplan und Schichten: `title` in `created`/`linked`, `linked` nur für eigene Events, nur bestätigte fremde
  Verknüpfungen blockieren (21.11.2026).

