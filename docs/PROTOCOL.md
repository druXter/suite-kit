# Protokoll und Sicherheitsregeln der Konto-Föderation

Technische Referenz zum Paket `suite-kit` (Übersicht der ganzen Suite: [README](../README.md)).

## Leitidee

* **Jedes Tool hat eigene, lokale Konten** (E-Mail, Passwort, Rolle, Session) und ist
  damit vollständig allein nutzbar. Diese Bibliothek berührt Konten, Passwörter und
  Sessions nicht - das bleibt Sache der jeweiligen App.
* **Optional** lassen sich Tools verbinden: Wer in Tool A ein Konto hat, kann sich
  damit auch in Tool B anmelden. Jedes Tool kann gleichzeitig *Anbieter* (stellt
  Login-Bestätigungen aus) und *Empfänger* (nimmt sie an) sein. Ohne Konfiguration
  ist die Föderation komplett inaktiv, es erscheint nicht einmal ein Login-Button.
* **Kein Secret-Austausch:** Bestätigungen sind mit Ed25519 signiert. Ein Tool kennt
  von den anderen nur die öffentliche Adresse, den öffentlichen Schlüssel holt es sich
  selbst. Ein kompromittiertes Tool kann dadurch keine Logins im Namen eines anderen
  fälschen (anders als bei einem gemeinsamen HMAC-Secret).

Nicht Teil dieses Pakets: die Gäste-Verifizierung per HMAC-Token
(`RSVP_VERIFICATION_SECRET`, siehe README des abstimmungstool). Sie ist ein anderer
Vertrag für einen anderen Zweck und bleibt unverändert.

## Ablauf

```
Browser          Empfänger (vote.example.de)            Anbieter (rsvp.example.de)
   │  "Mit rsvp-app anmelden"                                   │
   │ ──────────────► state erzeugen, als Cookie speichern       │
   │ ◄── Redirect: /api/suite/authorize?app=…&state=… ─────────►│
   │                                       lokal eingeloggt? sonst normaler Login
   │ ◄── Redirect: vote…/api/suite/callback?assertion=…&state=… ─│
   │ ──────────────► Signatur, aud, nonce == Cookie-state prüfen,
   │                 Cookie löschen, eigene Session anlegen
```

Ist man im Anbieter bereits eingeloggt, geht der Rücksprung ohne Rückfrage - für die
Nutzenden fühlt sich das wie Single Sign-On an.

## Login-Bestätigung

Kompaktes JWS `header.payload.signature` (base64url), ausschließlich Ed25519:

* Header: `{"alg":"EdDSA","typ":"suite-login+v1","kid":"<Schlüssel-ID>"}`
* Payload: `iss` (Origin des Anbieters), `aud` (Origin des Empfängers), `sub`
  (Konto-ID beim Anbieter, **nicht** die E-Mail - die kann sich ändern), `email`,
  optional `name`/`role`, `nonce` (= `state`), `iat`, `exp` (Standard 60 s, höchstens 120 s)
* Alles andere als genau dieses `alg`/`typ` wird abgelehnt (keine Algorithmus-Aushandlung).

Die Bestätigung trägt **nur Identität, keine Rechte**. `role` ist die Rolle beim
Anbieter; welche Rechte das Konto beim Empfänger bekommt, entscheidet allein der
Empfänger (siehe `mapAdminRole`).

## Teilnehmenden-Bestätigung (ab v0.2.0)

Für **Teilnehmendenkonten** (Gäste, Abstimmende, ohne jede Verwaltungsrolle - heute nur
`GuestUser` in rsvp-app) gibt es eine eigene Bestätigung, angefordert mit
`/api/suite/authorize?app=…&state=…&kind=participant`:

* Header: `{"alg":"EdDSA","typ":"suite-participant+v1","kid":"…"}` - **eigener `typ`, kein
  Zusatzfeld** in der Login-Bestätigung. Ein Empfänger mit älterer Version würde ein unbekanntes
  Feld ignorieren und die Person als Verwaltungskonto anlegen (bei `autoProvision` sogar als
  Creator); einen unbekannten `typ` lehnt dagegen jede Version ab. Umgekehrt ignoriert ein
  älterer Anbieter `kind` und schickt eine Login-Bestätigung - der Empfänger lehnt sie als
  falschen Typ ab. Beide Richtungen scheitern also sicher.
* Payload: `iss`, `aud`, `sub`, `name`, `nonce`, `iat`, `exp` - **keine E-Mail, keine Rolle**.
* `sub` ist eine **paarweise Kennung**: für jeden Empfänger eine andere, sodass Empfänger
  Personen nicht untereinander verknüpfen können. Wie der Anbieter sie bildet, ist seine Sache
  (rsvp-app: zufällig, gespeichert zusammen mit der Zustimmung).
* Der Anbieter stellt sie nur aus, wenn der Empfänger in `SUITE_PARTICIPANT_APPS` steht (getrennt
  von `SUITE_TRUSTED_APPS`), nur für bestätigte Konten und erst nach einer einmaligen Zustimmung
  der Person pro Empfänger.
* Der Empfänger nimmt sie nur von Anbietern mit `"participants": true` in `SUITE_IDPS` an und
  bildet sie **nie** auf ein Verwaltungskonto ab: eigene Tabelle, eigene Sitzung (kurz, z.B.
  24 Stunden - so kommt ein beim Anbieter gelöschtes Konto bald nicht mehr durch). Wird
  `participants` abgeschaltet, gelten bestehende Teilnehmenden-Sitzungen sofort nicht mehr.

API: `issueParticipantAssertion`, `verifyParticipantAssertion`, `buildAuthorizeRequestUrl(…, { kind: 'participant' })`,
`parseAuthorizeRequest(url, trustedApps, participantApps)` (liefert `request.kind`).

## Discovery

Jeder Anbieter liefert `GET /.well-known/suite-identity`:

```json
{ "version": 1, "issuer": "https://rsvp.example.de", "name": "rsvp-app",
  "authorizeUrl": "https://rsvp.example.de/api/suite/authorize",
  "keys": [{ "kid": "…", "alg": "EdDSA", "publicKey": "<SPKI-DER, base64url>" }] }
```

Mehrere Schlüssel = Rotation: `SUITE_SIGNING_KEY_PREVIOUS` bleibt so lange veröffentlicht,
bis alle ausgestellten Bestätigungen abgelaufen sind (2 Minuten reichen).

## Schlüsselwechsel

**Geplant** (z.B. jährlich oder wenn jemand mit Zugriff auf die `.env` ausscheidet) - ohne dass
eine Anmeldung fehlschlägt, die Empfänger müssen nichts tun:

1. Neuen Schlüssel erzeugen (`node node_modules/suite-kit/bin/suite-keygen.js`).
2. Im **Anbieter**: `SUITE_SIGNING_KEY=<neu>`, `SUITE_SIGNING_KEY_PREVIOUS=<bisher>`, neu starten. Ab
   jetzt wird mit dem neuen Schlüssel signiert, beide stehen im Discovery-Dokument. Ein Empfänger
   mit altem Dokument im Cache sieht eine unbekannte `kid`, lädt einmal neu (Sicherheitsregel 6)
   und kennt dann beide.
3. Nach mindestens **5 Minuten** (Cache der Empfänger; Bestätigungen leben höchstens 2 Minuten)
   `SUITE_SIGNING_KEY_PREVIOUS` entfernen und den Anbieter erneut starten.

**Notfall** (Schlüssel ist bekannt geworden): `SUITE_SIGNING_KEY=<neu>` **ohne**
`SUITE_SIGNING_KEY_PREVIOUS`, Anbieter neu starten - und danach **alle Empfänger neu starten**.
Sonst nehmen sie den alten Schlüssel bis zu 5 Minuten aus ihrem Cache weiter an. Anschließend die
Server-Logs auf Anmeldungen seit dem vermuteten Zeitpunkt prüfen.

Hinweise: Ein Empfänger lädt wegen unbekannter `kid` höchstens einmal pro Minute und Anbieter neu
(Schutz gegen erzwungene Abrufe) - eine Anmeldung in dieser Minute kann einmal fehlschlagen und
klappt beim nächsten Versuch. Den Ablauf prüfen `test/rotation.test.ts` (hier) und der Test
"Schlüsselwechsel beim Anbieter" im Abstimmungstool (`tests/e2e/suite.spec.ts`, über Login und Callback).

## Konfiguration (Env)

| Variable | Rolle | Bedeutung |
| --- | --- | --- |
| `SUITE_SIGNING_KEY` | Anbieter | Privater Ed25519-Schlüssel dieses Tools (`npx suite-keygen`). Ohne: Tool stellt keine Logins aus. |
| `SUITE_SIGNING_KEY_PREVIOUS` | Anbieter | Optional, nur während einer Schlüsselrotation. |
| `SUITE_TRUSTED_APPS` | Anbieter | Kommagetrennte Origins der Tools, die Bestätigungen empfangen dürfen. |
| `SUITE_PARTICIPANT_APPS` | Anbieter | Ab v0.2.0: Origins der Tools, die Teilnehmenden-Bestätigungen bekommen. Leer = keine. |
| `SUITE_IDPS` | Empfänger | Anbieter, deren Logins akzeptiert werden: Origins kommagetrennt oder JSON `[{"issuer","label","autoProvision","mapAdminRole","participants"}]`. |

`autoProvision` (Standard `true`): erster Login legt automatisch ein lokales Konto
ohne Passwort an. `mapAdminRole` (Standard `false`): Admins des Anbieters werden auch
hier Admin, sonst Creator. `participants` (Standard `false`, ab v0.2.0): Teilnehmendenkonten
dieses Anbieters annehmen.

## Sicherheitsregeln, die jede App einhalten muss

1. **Identität = (`iss`, `sub`)**, nie die E-Mail. Kein automatisches Zusammenführen mit
   einem bestehenden lokalen Konto über die E-Mail - Verknüpfung nur bewusst aus einer
   bestehenden Sitzung heraus. Trifft ein neuer föderierter Login auf eine bereits
   vergebene lokale E-Mail, wird er mit Hinweis abgelehnt.
2. **Keine Ketten:** Ein Tool stellt Bestätigungen nur für Konten mit lokalen
   Zugangsdaten aus, nie für Konten, die selbst föderiert sind.
3. **`state`-Cookie** ist einmalig (nach dem Callback löschen), `HttpOnly`, `Secure`,
   `SameSite=Lax`, kurze Lebensdauer (≈ 10 min).
4. **Session-Cookies** mit `__Host-`-Präfix (ohne `Domain`): Die Tools laufen auf
   Subdomains derselben Domain, so kann kein Tool einem anderen ein Cookie unterschieben.
5. Fehlerseiten zeigen dem Nutzer nur "Anmeldung fehlgeschlagen" - der `reason` aus
   `verifyLoginAssertion` gehört ins Server-Log.
6. Bei `unknown-key` das Discovery-Dokument **einmal** mit `force: true` neu laden und
   erneut prüfen (Rotation), nicht in einer Schleife.
7. Der Callback-Endpunkt antwortet mit `Referrer-Policy: no-referrer` und
   `Cache-Control: no-store`.

## Bewusst nicht enthalten

* **Kein gemeinsames Abmelden (Single Logout):** Jedes Tool hat seine eigene Sitzung. Wer sich in
  einem Tool abmeldet, bleibt in den anderen angemeldet - das bräuchte Rückkanäle zwischen allen Tools
  bei kleinem Nutzen. Auf geteilten Geräten in jedem genutzten Tool abmelden.
* **Keine Weitergabe von Löschungen oder Sperren:** Wird ein Konto beim Anbieter gelöscht, bleibt das
  verknüpfte Konto beim Empfänger bestehen, kann sich aber nicht mehr über den Anbieter anmelden. Es
  verfällt dort nach der suite-weiten Löschfrist (2 Jahre ohne Anmeldung). Teilnehmenden-Sitzungen
  sind deshalb kurz (24 Stunden), danach geht die Anmeldung wieder über den Anbieter.

## API-Überblick

```ts
import {
  loadSignersFromEnv, issueLoginAssertion, verifyLoginAssertion,
  buildDiscoveryDocument, fetchDiscovery,
  randomState, buildAuthorizeRequestUrl, parseAuthorizeRequest, buildAuthorizeResponseUrl,
  sanitizeNextPath, parseTrustedApps, parseIdpConfig
} from 'suite-kit'
```

Anbieter: `parseAuthorizeRequest` → (eingeloggt?) → `issueLoginAssertion` →
`buildAuthorizeResponseUrl`. Empfänger: `randomState` → `fetchDiscovery` →
`buildAuthorizeRequestUrl` … `verifyLoginAssertion` (mit `keys` aus der Discovery).

## Entwicklung

```bash
npm install
npm test        # baut mit tsc und führt die Tests aus (node:test, keine Zusatz-Abhängigkeiten)
```

Ohne Laufzeit-Abhängigkeiten, nur `node:crypto`. `dist/` wird nicht eingecheckt,
sondern beim Installieren als Git-Abhängigkeit per `prepare`-Skript gebaut.
