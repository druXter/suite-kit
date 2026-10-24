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

## Eigene Durchsicht je Tool

Die Prüfung vom 24.10. ging von rsvp-app aus; die anderen Tools wurden dabei nur verglichen. Jedes Tool bekommt eine
eigene Durchsicht (Rechte in jeder Server Action und Route, Zugänge ohne Konto, Anbindungen, Push, Löschfristen,
Datenschutzerklärung, Laufzeiten, Oberfläche), Befunde in docs/KONVENTIONEN.md.

- [x] rsvp-app (24.10.2026)
- [x] Zeitplan (24.10.2026) - Befunde in KONVENTIONEN.md, „Durchsicht Zeitplan“
- [x] Schichten (24.10.2026) - Befunde in KONVENTIONEN.md, „Durchsicht Schichten“
- [x] Seating (24.10.2026) - ohne eigenen Befund, siehe KONVENTIONEN.md, „Durchsicht Seating“
- [ ] Abstimmungstool - Stimmabgabe ohne Konto, Live-Runden, Fragebögen, Sitzungen
