# Offene Punkte

Stand: 21.10.2026. Wartungs- und Betriebsaufgaben, die mehrere Tools der Suite betreffen. Feature-Ideen stehen in
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
