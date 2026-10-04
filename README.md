# App-Suite

Mehrere kleine, **eigenständige** Web-Tools, die sich **optional** miteinander verzahnen lassen. Jedes Tool läuft
allein - mit eigener Datenbank, eigenen Konten, eigenem Deployment. Sind mehrere Tools eingerichtet, greifen sie
ineinander: gemeinsame Anmeldung, verlinkte Inhalte, Rückmeldungen zwischen den Tools.

Dieses Repository (`suite-kit`) ist die gemeinsame Bibliothek dahinter und zugleich die Übersicht über die Suite.

## Die Tools

| Tool | Zweck | Repository |
| --- | --- | --- |
| **rsvp-app** | Zu-/Absagen zu Veranstaltungen, Gästelisten, Wartelisten, Einlass | [druXter/rsvp-app](https://github.com/druXter/rsvp-app) |
| **abstimmungstool** | Gruppenabstimmungen mit beliebig vielen Optionen | [druXter/abstimmungstool](https://github.com/druXter/abstimmungstool) |
| **seating** | Raumpläne, Tischbuchung, Platzwahl, Sitzordnung; an rsvp-app anbindbar | [druXter/seating](https://github.com/druXter/seating) |
| **zeitplan** | Ablauf großer Events mit Live-Prognose: Gästeansicht, Anzeigetafel, Live-Steuerung fürs Handy; an rsvp-app anbindbar | [druXter/zeitplan](https://github.com/druXter/zeitplan) |
| **suite-kit** | Gemeinsame Konto-Föderation (dieses Repo) | [druXter/suite-kit](https://github.com/druXter/suite-kit) |

Jedes Tool hat sein eigenes README mit Funktionen, Einrichtung und Betrieb. Hier steht, was für **alle** gilt.

Ideen für Erweiterungen und neue Tools (noch nicht bewertet, mit Status pro Idee) sammelt
[docs/IDEEN.md](docs/IDEEN.md), darunter das Suite-Paket für ein gemeinsames Deployment.

## Leitprinzipien

1. **Eigenständig zuerst.** Ohne Konfiguration der Suite verhält sich jedes Tool wie ein einzelnes Programm - es gibt
   nicht einmal einen Login-Button für andere Tools. Die Verzahnung ist immer ein Zusatz, nie eine Voraussetzung.
2. **Konten gehören dem Tool.** Jedes Tool legt und verwaltet seine Konten selbst (E-Mail, Passwort, Rolle). Es gibt
   keinen zentralen Identitätsanbieter, der ausfallen oder kompromittiert werden könnte.
3. **Vertrauen ist ausdrücklich und einseitig konfiguriert.** Ein Tool nimmt Anmeldungen nur von Tools an, die der
   Betreiber in `SUITE_IDPS` eingetragen hat, und stellt Anmeldungen nur für Tools aus, die in `SUITE_TRUSTED_APPS`
   stehen.
4. **Identität, keine Rechte.** Eine Anmeldung aus einem anderen Tool beweist nur, *wer* jemand ist. Welche Rechte das
   Konto im Empfänger-Tool hat, entscheidet allein der Empfänger.
5. **Kein gemeinsames Geheimnis.** Anmeldungen sind mit Ed25519 signiert; jedes Tool hat sein eigenes Schlüsselpaar und
   veröffentlicht nur den öffentlichen Teil. Ein kompromittiertes Tool kann keine Anmeldungen im Namen eines anderen
   fälschen.

## Begriffe

Gleich in allen Tools, READMEs und Datenschutzerklärungen (Code-Bezeichner und Pfade bleiben, wie sie sind):

* **Verwaltungskonto:** Konto mit der Rolle Admin, Creator oder Moderator (Code: `User`). Damit legt man Inhalte an
  und verwaltet sie. In der Oberfläche heißt die Kontenliste „Konten“, der Bereich „Verwaltung“.
* **Teilnehmendenkonto:** freiwilliges Konto für Gäste und Abstimmende, ohne jede Verwaltungsrolle. Heute nur in
  rsvp-app (`GuestUser`, unter „Mein Konto“; früher „Nutzer-Konto“).
* **Admin** ist nur der Name einer Rolle, nie eine Kontoart: „Konto mit Admin-Rolle“, nicht „Admin-Konto“.

Dieselbe Person kann ein Verwaltungs- und ein Teilnehmendenkonto haben; die beiden bleiben bewusst getrennt.

## Konten-Verbund im Überblick

Ein Konto aus Tool A kann in Tool B genutzt werden. Beide bleiben vollständig getrennt (eigene Sitzungen, eigene
Datenbank); dazwischen wandert nur eine kurz gültige, signierte Bestätigung.

```
Browser              Tool B (Empfänger)                       Tool A (Anbieter)
   │ "Mit A anmelden"      │                                        │
   │ ─────────────────────►│ state erzeugen, als Cookie speichern   │
   │ ◄─── Redirect ─────────────────────────────────────────────────►│  lokal eingeloggt? sonst normaler Login
   │ ◄─── Redirect zurück mit signierter Bestätigung ────────────────│
   │ ─────────────────────►│ Signatur, Audience, state prüfen,      │
   │                       │ eigene Sitzung anlegen                 │
```

Wichtige Regeln (Details und Begründungen: [docs/PROTOCOL.md](docs/PROTOCOL.md)):

* **Identität = (Anbieter, Konto-ID)**, nie die E-Mail. Es gibt **kein automatisches Zusammenführen** über die E-Mail: Hat
  der Empfänger schon ein lokales Konto mit derselben Adresse, wird der Verbund-Login abgelehnt. Man verknüpft bewusst aus
  einer bestehenden Sitzung heraus (Konto-Einstellungen).
* **Keine Ketten:** Ein Tool bestätigt nur Konten mit lokalem Passwort, nie rein föderierte.
* **Rollen:** `autoProvision` (erster Login legt automatisch ein Konto an) und `mapAdminRole` (Admin bleibt Admin) sind
  **pro Anbieter** einstellbar. Sinnvolle Voreinstellung: ein Tool, dessen Konten nur Admins anlegen dürfen, setzt
  `autoProvision: false`; `mapAdminRole` bleibt aus, Admin-Rechte vergibt man lokal. Ebenso tragen Tools, deren Konten
  nur Veranstalter\*innen brauchen (Seating, genauso rsvp-app), die anderen Tools in `SUITE_IDPS` mit
  `autoProvision: false` ein - anmelden kann sich dann nur, wer vor Ort schon ein Konto hat und es bewusst verknüpft.

### Zusammenspiel der Tools

Die Anmeldung ist **unabhängig** von der fachlichen Kopplung: rsvp-app und das Abstimmungstool tauschen daneben weiterhin
signierte Tokens für "Abstimmen nur mit bestätigter Zusage" und die Ergebnis-Meldung aus (`RSVP_VERIFICATION_SECRET`,
siehe README des Abstimmungstools). Das ist ein eigener Vertrag für einen anderen Zweck - Gäste ohne Konto sind davon
nicht betroffen. Am Konto-Verbund nehmen heute nur Verwaltungskonten teil; Teilnehmendenkonten sind geplant (TODO im
Abstimmungstool, Abschnitt D1).

Ebenso haben **rsvp-app und Seating** einen eigenen fachlichen Vertrag: Platzwahl über eine Zusage, Abruf der Gästeliste,
Rückmeldung der Plätze an rsvp-app und ein Webhook bei jeder Änderung einer Zusage. Die Nachrichten sind HMAC-signiert
mit einem **eigenen** Secret (Seating `RSVP_SEATING_SECRET` = rsvp-app `SEATING_SECRET`) - unabhängig von der
Konto-Föderation und nie identisch mit `RSVP_VERIFICATION_SECRET`, sonst gälte eine Nachricht der einen Kopplung auch
in der anderen. Details: README von Seating, Abschnitt "Anbindung an rsvp-app".

Ebenso haben **rsvp-app und Zeitplan** einen eigenen Vertrag: rsvp-app erzeugt bei jedem Klick auf „Zeitplan“ einen kurz
gültigen, signierten Link (`timeline-link`), Zeitplan legt daraus eine Gast-Sitzung an; eine Absage (Webhook
`rsvp-change`) beendet sie. Übertragen werden nur Kennungen, keine Namen oder Adressen. Eigenes Secret: Zeitplan
`RSVP_TIMELINE_SECRET` = rsvp-app `TIMELINE_SECRET`, nie identisch mit dem Secret einer anderen Anbindung. Details:
README von Zeitplan, Abschnitt „Anbindung an rsvp-app“.

## Konfiguration (Env)

Identisch in jedem Tool der Suite:

| Variable | Rolle | Bedeutung |
| --- | --- | --- |
| `BASE_URL` | beide | Öffentliche Adresse des Tools ohne Slash. **Zugleich seine Kennung** (`iss`/`aud`) gegenüber den anderen Tools. |
| `SUITE_APP_NAME` | Anbieter | Anzeigename auf den Login-Buttons anderer Tools. |
| `SUITE_SIGNING_KEY` | Anbieter | Privater Ed25519-Schlüssel dieses Tools (`node node_modules/suite-kit/bin/suite-keygen.js`). Leer = stellt keine Anmeldungen aus. |
| `SUITE_SIGNING_KEY_PREVIOUS` | Anbieter | Nur während eines Schlüsselwechsels (Ablauf: [docs/PROTOCOL.md](docs/PROTOCOL.md#schlüsselwechsel)). |
| `SUITE_TRUSTED_APPS` | Anbieter | Kommagetrennte Origins der Tools, die Anmeldungen von hier empfangen dürfen. |
| `SUITE_IDPS` | Empfänger | Tools, deren Konten hier zugelassen sind: Origins kommagetrennt oder JSON `[{"issuer","label","autoProvision","mapAdminRole"}]`. |
| `TRUST_PROXY_HOPS` | beide | Wie viele Reverse Proxys vor dem Tool stehen (für die IP der Anmelde-Drosselung). **Messen, nicht raten** - siehe unten. |

**Beispiel für zwei Tools** (`A` = `https://a.example.de`, `B` = `https://b.example.de`, beide sollen sich gegenseitig
vertrauen): In A `SUITE_SIGNING_KEY=<Schlüssel A>`, `SUITE_TRUSTED_APPS=https://b.example.de`,
`SUITE_IDPS=https://b.example.de`; in B entsprechend umgekehrt mit einem **eigenen** Schlüssel. Schlüssel werden nie
zwischen Tools kopiert.

## Betrieb

* **Schlüssel** pro Tool einzeln erzeugen und nur in dessen `.env` ablegen. **Schlüsselwechsel** (geplant oder im
  Notfall): Ablauf in [docs/PROTOCOL.md](docs/PROTOCOL.md#schlüsselwechsel) - im Notfall auch alle Empfänger neu starten.
* **Kein gemeinsames Abmelden:** Abmelden wirkt nur im jeweiligen Tool (bewusst, siehe docs/PROTOCOL.md).
* **Zwei Werte müssen zur Umgebung passen:** `BASE_URL` (exakt die Adresse, unter der die anderen Tools das Tool erreichen)
  und `TRUST_PROXY_HOPS`. Letzteres hängt von der Proxy-Kette ab; hinter Cloudflare + Nginx Proxy Manager (mit dessen
  Real-IP-Erkennung) war die echte IP der *letzte* `X-Forwarded-For`-Eintrag, also `1`. Prüfen: einen Fehlversuch beim Login
  machen und in der Tabelle `LoginThrottle` schauen, ob der Schlüssel `SHA-256("login:ip" + 0x00 + <eigene IP>)` existiert.
* **Cron-Endpunkte** (Uptime Kuma o. Ä.): Jedes Tool mit automatischer Löschung stellt `/api/cron/cleanup?secret=…` bereit
  (täglich). Ein leeres oder fehlendes `CRON_SECRET` lässt niemanden durch.
* **Datenbank sichern** vor jedem Update (SQLite-Datei kopieren, Container dafür kurz stoppen oder sichern, wenn wenig los ist).
* **Löschfristen** sind suite-weit gleich: Inhalte 18 Monate nach Ende, Konten nach 2 Jahren ohne Anmeldung (Konten mit
  Admin-Rolle ausgenommen, in rsvp-app alle Verwaltungskonten).
* Wird `suite-kit` als Git-Abhängigkeit eingebunden (`"suite-kit": "github:druXter/suite-kit#v0.1.0"`), braucht der
  Docker-Build `git` im Image (`apk add --no-cache git`); `dist/` wird beim Installieren per `prepare`-Skript gebaut.

## Ein weiteres Tool anbinden

Referenzimplementierungen: das **Abstimmungstool** und **Seating**, beide mit denselben Dateien (`app/api/suite/*`,
`app/.well-known/suite-identity`, `app/lib/{suite,suite-flow,auth,throttle,password}.ts`). Die Zwischenseite (Schritt 3)
heißt bei Seating `/login/continue`.

1. **Abhängigkeit** `suite-kit` eintragen, `git` im Dockerfile ergänzen.
2. **Schema:** `User` (mit nullbarem `passwordHash`), `Session` (Token nur als Hash), `ExternalIdentity(issuer, subject)`,
   `LoginThrottle`. Einmal-Tokens (Reset, Einladung) ebenfalls nur als Hash speichern.
3. **Endpunkte** übernehmen: `/.well-known/suite-identity`, `/api/suite/authorize`, `/api/suite/login`, `/api/suite/callback`
   sowie die Zwischenseite, die nach einem Login im Anbieter-Ablauf einen **echten** Seitenwechsel auslöst (siehe Stolpersteine).
4. **Login-Seite:** Buttons aus `SUITE_IDPS`; Konto-Seite: Verknüpfungen anzeigen/entfernen.
5. **Sicherheitsregeln einhalten** (siehe [docs/PROTOCOL.md](docs/PROTOCOL.md) und die Liste unten).
6. **Konfigurieren:** eigenes Schlüsselpaar, das neue Tool in `SUITE_TRUSTED_APPS`/`SUITE_IDPS` der anderen eintragen (und
   umgekehrt), Neustart der betroffenen Tools.
7. **Testen:** mindestens die Fälle aus dem Abschnitt "Was getestet wird" - als Vorlage für automatisierte Tests eignen
   sich die Test-Doppel von Seating (`tests/e2e/suite-server.ts`, siehe dort).

### Sicherheitsregeln für jedes Tool

* Passwörter mit starkem Hash, serverseitige Passwort-Regel (nicht nur `minLength` im HTML), Hashes bei Bedarf automatisch erneuern.
* Sitzungen und Einmal-Links nur als SHA-256-Hash speichern; Cookie mit `__Host-`-Präfix (kein Cookie-Tossing zwischen Subdomains).
* Anmelde-Drosselung pro IP **und** pro Ziel-E-Mail, den Versuch **vor** der Prüfung atomar reservieren (sonst umgehen viele
  gleichzeitige Anfragen das Limit). Keine dauerhafte Kontosperre. Mail auslösende Formulare (Reset, Registrierung) ebenso drosseln.
* Unbekannte Adresse: gleiche Antwort *und* gleiche Rechenzeit (Wegwerf-Hash); Reset antwortet immer neutral.
* Berechtigungen serverseitig in **jeder** Server Action prüfen - eine Seitenprüfung schützt nicht vor direkt abgeschickten Formularen.
* Föderations-Antworten mit `Cache-Control: no-store` und `Referrer-Policy: no-referrer`; Clickjacking-Schutz für Login, Konto, Verwaltung.
* Cron-Secrets: leeren Wert ablehnen, mit konstantem Zeitvergleich prüfen.

### Stolpersteine (alle beim Aufbau tatsächlich aufgetreten)

* **Login-Fortsetzung in den Anbieter-Ablauf:** Leitet eine Next.js-Server-Action nach dem Login auf einen Route Handler weiter,
  der selbst zu einer anderen Domain umleitet, bleibt der Browser hängen (Client-Router-Übergang). Lösung: Zwischenseite mit
  `window.location.replace(...)`, Ziel auf `/api/suite/authorize?` beschränkt.
* **Header-Reihenfolge:** Bei mehreren passenden `headers()`-Regeln in `next.config.ts` gewinnt für denselben Header die
  *spätere*. Ausnahmen (z. B. `Referrer-Policy: no-referrer` für `/api/suite/*`, `frame-ancestors 'none'` für `/admin`) müssen
  hinter den allgemeinen Regeln stehen - und `/admin` passt auch auf `/:slug`.
* **Einbettbare Seiten:** rsvp-app bettet Event-Seiten bewusst als iFrame ein (`frame-ancestors *`). Ein globales
  `frame-ancestors 'none'` würde das brechen - Schutz daher nur für sensible Bereiche.
* **Fehler beim Verknüpfen nicht auf die Login-Seite leiten:** Im Modus `link` (z. B. `linked-other`, `sso`) ist die Person
  bereits eingeloggt - die Login-Seite leitet sie sofort weiter, und die Fehlermeldung erscheint nie. Im Modus `link`
  daher auf die Konto-Seite leiten, aber **nur mit bestehender Sitzung**: Ohne Sitzung (abgelaufen, in einem anderen
  Browser beendet) leitet die Konto-Seite selbst zum Login weiter und verliert dabei den Fehlercode - dann gleich auf
  die Login-Seite. Referenz: `fail()` in `app/api/suite/callback/route.ts` von rsvp-app.
* **`'use server'`-Dateien** dürfen nur asynchrone Funktionen exportieren (keine Konstanten wie Cookie-Namen).
* **Cookies sind nicht an Ports gebunden:** Zwei Tools auf `localhost:3001`/`localhost:3002` teilen sich Cookies gleichen Namens.
  Für lokale Tests unterschiedliche Hostnamen nehmen (`localhost` und `127.0.0.1`).
* **`TRUST_PROXY_HOPS`** nicht schätzen: Mit dem falschen Wert landen alle Besucher in einem gemeinsamen Zähler.
* Formulardaten für gefälschte POSTs im Test **nach einem frischen Seitenaufruf** lesen - nach einer Client-Navigation fehlt
  die serverseitig gerenderte `$ACTION_ID` im DOM, und der Test prüft dann nichts.

## Was getestet wird

rsvp-app und das Abstimmungstool wurden im Browser (Playwright/Chromium) gegen laufende Instanzen geprüft, einschließlich
echtem HTTPS über Cloudflare und Reverse Proxy:

* Anmeldung: Fehlermeldung und Antwortzeit für bekannte/unbekannte Adressen, Sperre pro E-Mail (11. Versuch) und pro IP
  (21. Versuch), erfundene `X-Forwarded-For`-Werte, 30 **gleichzeitige** Versuche (höchstens 10 erreichen die Prüfung).
* Sitzungen: Cookie-Attribute, nur Hash in der Datenbank, Beendigung anderer Sitzungen bei Passwortwechsel, Open Redirect.
* Einmal-Links: nur einmal nutzbar, nur als Hash gespeichert, Passwort-Regel, Mail-Flut begrenzt.
* Berechtigungen: gefälschte Formular-Posts (mit **Positivkontrolle**, dass derselbe Post als Berechtigter wirkt), CSRF mit fremdem Origin.
* Föderation in beide Richtungen: Ablauf, Wiedergabe der Bestätigung im selben und in einem fremden Browser, manipulierte
  Nutzlast/Signatur/Audience, nicht freigegebene App, unbekannter Anbieter, `email-taken`, bewusstes Verknüpfen.
* Docker-Build, Datenmigration gegen eine Kopie der Produktivdaten, Mailversand.

**Seating** hat als erstes Tool **automatisierte Playwright-Tests der Föderation** (`npm run test:e2e`): Test-Doppel zweier
anderer Tools (`tests/e2e/suite-server.ts` - beide als Anbieter, eines mit und eines ohne `autoProvision`, eines zugleich
als Empfänger von Seating-Anmeldungen) mit festen Ed25519-Test-Schlüsseln aus einem Seed, sodass Server und Testprozess
dieselben Schlüssel kennen, ohne sie auszutauschen. Das ist die empfohlene Vorlage für die Tests eines neuen Tools.

**Zeitplan** hat die automatisierten Föderationstests von Seating übernommen (Test-Doppel auf den Ports 2530/2531, damit
beide Testläufe gleichzeitig laufen können).

## Entwicklung des Pakets

```bash
npm install
npm test        # baut mit tsc und führt die Tests aus (node:test, keine Zusatz-Abhängigkeiten)
```

Ohne Laufzeit-Abhängigkeiten, nur `node:crypto`. `dist/` wird nicht eingecheckt. Änderungen am Protokoll oder am Token-Format
erhöhen die Version (Tag `vX.Y.Z`); die Tools pinnen ihre Version bewusst und aktualisieren sie einzeln.
