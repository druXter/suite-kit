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
ist umgesetzt und ausgerollt bis auf den gemeinsamen Mail-Baustein.

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
- [ ] **Gemeinsamer Mail-Baustein in suite-kit:** rsvp-app baut seine 14+ HTML-Mails einzeln (mit `escapeHtml` an jeder
  Stelle), die anderen Tools haben je eine fast gleiche `layout()`-Funktion, Seating zusätzlich Bausteine
  (`mail-blocks.ts`). Ein Baustein in `suite-kit/web` (Überschrift, Absätze, Tabelle, Knopf, Hinweis; escapet selbst)
  würde Aussehen und Schutz vereinheitlichen. Offen, weil sich dabei das Aussehen der Gäste-Mails von rsvp-app ändert.
