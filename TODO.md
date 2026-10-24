# Offene Punkte

Stand: 24.10.2026. Wartungs- und Betriebsaufgaben, die mehrere Tools der Suite betreffen. Feature-Ideen stehen in
[docs/IDEEN.md](docs/IDEEN.md), Punkte eines einzelnen Tools in dessen eigenem Repo.
Jeder Punkt mit Begründung, warum er noch offen ist.

## Wartung

- [ ] **Alle Tools von `node:20-alpine` auf `node:22-alpine` umstellen.**
  Node 20 ist seit April 2026 End-of-Life und bekommt keine Security-Updates mehr. Node 22 wird bis April 2027
  unterstützt (Node 24 ginge bis April 2028). Aufgefallen am 21.10.2026 bei der Prüfung auf die PHP2Shell-Lücken
  (Suite nicht betroffen, kein PHP im Einsatz).
  Betroffen (jeweils `Dockerfile`):
  - [ ] rsvp-app
  - [ ] abstimmungstool
  - [ ] seating
  - [ ] zeitplan
  - [ ] schichten
  - [ ] suite-kit selbst: `engines.node` in `package.json` von `>=20` auf `>=22` anheben

  Pro Tool testen: Image baut, `prisma generate` und Migrationen laufen (Prisma-Engine für musl/OpenSSL im
  Alpine-Image), Unit-Tests grün, Login über die Konto-Föderation und die signierten Anbindungen zwischen den Tools
  funktionieren. In der rsvp-app zusätzlich Web-Push (`web-push`) prüfen. Vor jedem Deploy wie üblich ein
  Datenbank-Snapshot.
  Offen, weil jedes Tool neu gebaut und getestet werden muss. Nicht direkt vor einem anstehenden Event umstellen,
  das das Tool nutzt.

  Die Campus-App gehört nicht zur Suite. Ihr Backend läuft noch auf `node:18`, der Punkt steht in deren `TODO.md`.

## Sicherheit und Konsistenz (Prüfung vom 24.10.2026)

Befunde und Begründungen in [docs/KONVENTIONEN.md](docs/KONVENTIONEN.md#prüfung-vom-2026-10-24). rsvp-app ist
erledigt, die übrigen Tools ziehen nach.

- [ ] **Next.js auf 16.4.3 (oder neuer) in allen Tools** - kritische Lücke (RCE über die Bild-Optimierung bzw.
  `next/og`, DoS über Server Actions) in allen Versionen bis 16.4.0. Dazu `nodemailer` ≥ 10.2.1, `sharp` ≥ 0.35.5,
  `zod` ≥ 4.6.6. Ziel: `npm audit --omit=dev` ohne Befund.
  - [x] rsvp-app
  - [ ] abstimmungstool
  - [ ] seating (pinnt `next` exakt auf 16.3.5)
  - [ ] zeitplan (pinnt `next` exakt auf 16.3.5)
  - [ ] schichten (pinnt `next` exakt auf 16.3.5)
  Offen, weil jedes Tool einzeln gebaut, getestet und ausgerollt werden muss. Hohe Priorität.
- [ ] **Uptime Kuma ergänzen:** Schichten `cleanup` (24 h), `reminders` (1 h), Backup und Erreichbarkeit; Zeitplan
  `alerts` (15 min) und Erreichbarkeit. Offen, weil die Monitore in der Oberfläche von Uptime Kuma angelegt werden.
- [ ] **Ports nur an `127.0.0.1` binden** (rsvp-app, seating, zeitplan, schichten). Vorher in Cloudflare prüfen, dass
  der Tunnel `localhost:<port>` nutzt, und den Monitor „RSVP“ auf `https://rsvp.ramonroeser.de` umstellen.
- [ ] **Abstimmungstool im Container als `node`** statt root, `npm ci`, `--skip-generate` (Muster in
  KONVENTIONEN.md, „Betrieb“); dabei `data/` an UID 1000 übergeben.
- [ ] **Bodies begrenzt einlesen** (`readLimitedText`): Abstimmungstool (`rsvp-assembly`, `assembly/decisions`,
  `rsvp-webhook`), Seating und Zeitplan (`rsvp-webhook`), Zeitplan (`schichten/forecast`).
- [ ] **Kopplung rsvp-app ↔ Abstimmungstool** auf das Nachrichtenformat mit `typ`, `aud` und begrenztem `exp` bringen
  (beide Seiten in einem Zug, feste Prüfnachrichten in beiden Unit-Tests).
- [ ] **Gemeinsame Helfer nach suite-kit** (`csv`, `escapeHtml`, `readLimitedText`, `safeEqual`, Header-Bausteine
  für `next.config.ts`) - heute in jedem Tool eine eigene, fast gleiche Kopie. Mit der nächsten suite-kit-Version.
