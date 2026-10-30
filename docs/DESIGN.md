# Design der Suite

Alle Tools der Suite sehen gleich aus und bedienen sich gleich: Wer eins kennt, findet sich in den anderen sofort
zurecht. Dieses Dokument hält die Regeln fest; der Code dazu liegt in `suite-kit/ui` (Bausteine) und
`suite-kit/theme.css` (Grundregeln). **Gestaltung ändert man hier, nicht in den Tools** - siehe
[Änderungen an alle Tools verteilen](#änderungen-an-alle-tools-verteilen).

Regeln jenseits des Aussehens (Betrieb, Sicherheit, Datenschutz, Tests, Doku) stehen in
[KONVENTIONEN.md](KONVENTIONEN.md).

Entstanden aus den Neugestaltungen im Oktober 2026 (rsvp-app, Abstimmungstool, Schichten, Zeitplan, Seating; deren
`docs/KONZEPT-OBERFLAECHE.md` beschreiben, wie das jeweilige Tool die Regeln umsetzt).

## Grundsätze

1. **Ruhig.** Weiß und Grau, Blau (`blue-600`) als einzige Akzentfarbe - für die Hauptaktion einer Seite, den aktiven
   Reiter und Links. Keine Emojis an Knöpfen, keine Verläufe, keine Schatten außer dem dezenten der Karten.
2. **Farbe trägt Bedeutung.** Sonst nichts: grün = gut/bestätigt/veröffentlicht, amber = offen/unbestätigt/Achtung,
   rot = Problem/Absage/live, grau = Entwurf/vorbei/neutral, blau = Information/Warteliste. Je Tool feste Farben für
   Verknüpfungen: **pink = rsvp-app**, **lila = Schichten** bzw. Geheimes/Internes, **türkis = freigegeben**. Farbe nie
   allein: immer mit Text (Badge, Beschriftung).
3. **Handy zuerst.** Gäste und Helfer*innen nutzen fast nur das Telefon, Verwaltung am Tag selbst auch.
4. **Gleicher Aufbau.** Übersicht → Detailseite mit Reitern → Einstellungen in einklappbaren Abschnitten.
5. **Eigenständig.** Das Design kommt aus suite-kit, die Inhalte (Navigation, Menüpunkte, Texte) bestimmt jedes Tool
   selbst. Kein Tool hängt zur Laufzeit von einem anderen ab.

## Aufbau einer Seite

| Teil | Baustein | Regeln |
| --- | --- | --- |
| Kopfzeile | `AppHeader` | Marke (Buchstabe im blauen Quadrat, Name ab `sm`), für angemeldete Konten die Hauptnavigation und rechts das Konto-Menü (Kürzel, Name ab `md`; im Menü E-Mail und Rolle, „Mein Konto“, zuletzt „Abmelden“ unter einer Linie), sonst nur „Anmelden“. Klebt oben, beim Drucken weg. Auf Seiten für Gäste ohne Anmeldung gar keine Kopfzeile (jedes Tool mit eigenem `HeaderGate`). |
| Inhalt | `Main` | `wide` (max-w-5xl) für Listen und Übersichten, `narrow` (max-w-3xl) für Formulare, `full` (max-w-7xl) für Arbeitsflächen (Plan-Editor, Sitzungsleitung). Kopfzeile und Inhalt gleich breit. |
| Seitenkopf | `PageHeader` | Optional „← Zurück“, Titel (`text-2xl font-semibold`), Untertitel mit Datum und Badges, Aktionen rechts (auf dem Handy darunter). |
| Reiter | `Tabs` | Unter dem Seitenkopf einer Detailseite (Event, Abstimmung, Reihe). Seitlich scrollbar, der aktive scrollt ins Bild. Unterseiten eines Reiters haben kein eigenes `<main>` und keinen eigenen Zurück-Link zur Detailseite. |
| Fußzeile | `AppFooter` | Impressum · Datenschutz, auf jeder Seite (Art. 13 DSGVO), eingebettet in neuem Tab. |

**Übersichten** (Events, Abstimmungen, Raumpläne): Karten (`li` mit `rounded-xl border bg-white shadow-sm`) mit
Datumsblock, Titel, Status-Badge, Merkmalen und Kennzahlen; getrennt nach *Aktuell* und eingeklappt *Vergangen*
(`sectionTitleClass`). Leere Listen: `EmptyState` mit einem Satz, was zu tun ist.

**Detailseiten**: oben Kennzahlen (`Stat`, auf dem Handy zweispaltig), dann Karten (`Card`) mit Status und
Aktionen. Statuswechsel als Knöpfe (der naheliegende blau), nicht als Auswahlfeld.

**Einstellungen**: `SettingsSection` je Thema - Titel, rechts ein Kurzstand („aus“, „nur mit Code“, „2 Konten“) und
optional eine Themenmarke in der Bedeutungsfarbe. Zugeklappt bleiben die Felder im DOM und werden mitgeschickt;
`?section=<id>` (bzw. das Pendant des Tools) öffnet einen Abschnitt. Ein großes Formular über mehrere Abschnitte hat
eine Speichern-Leiste, die unten sichtbar bleibt (`sticky bottom-0`). Gefährliches (Löschen) zuletzt in einer eigenen
Karte mit `buttonClass('danger')`.

## Bausteine (`suite-kit/ui`)

| Baustein | Zweck |
| --- | --- |
| `Card`, `EmptyState` | Fläche für einen Inhaltsblock, leere Liste. |
| `Badge` (`Tone`) | Status und Merkmale; Töne gray, green, orange, red, blue, indigo, pink, amber, purple, lime, teal. |
| `buttonClass(variant, size)`, `ButtonLink`, `SubmitButton`, `PrintButton` | Knöpfe: `primary` (eine Hauptaktion pro Bereich), `secondary`, `ghost`, `danger`; `sm` nur für Nebenaktionen in Listen. `SubmitButton` ist volle Breite (Formulare), `inline` daneben. |
| `inputClass`, `fieldClass`, `labelClass`, `hintClass` | Eingabefelder (16 px auf dem Handy, sonst zoomt iOS hinein) in voller Breite bzw. ohne Breite für Felder mit eigener (`${fieldClass} w-24`), Beschriftung, Hinweis darunter. Nie die Klassen von Hand kopieren. |
| `linkClass` | Link im Fließtext: unterstrichen und in beiden Schemata kontrastreich - nie nur `text-blue-600` (im Darkmode zu dunkel, ohne Unterstrich nur an der Farbe erkennbar). |
| `Notice` | Rückmeldung: info, success, warning, error (`role="alert"`). |
| `Stat`, `ProgressBar` | Kennzahl mit Beschriftung, optional Balken (voll = orange). `ProgressBar` braucht `label` (Name für Screenreader). |
| `PageHeader`, `Main`, `Tabs`, `Segmented`, `sectionTitleClass` | Seitenaufbau; `Segmented` schaltet Ansichten einer Seite um (Spuren, Druckart, Filter). |
| `SettingsSection`, `Disclosure` | Einklappbare Abschnitte, die ihren Zustand selbst halten (klappen nach dem Speichern nicht zu). |
| `AppHeader`, `AppFooter`, `NavLink`, `AccountMenu`, `menuItemClass`, `menuSeparatorClass` | Rahmen. |
| `CopyableField`, `ConfirmForm`, `FooterLink` | Link zum Kopieren (mit Knopf), Formular mit Rückfrage, Fußzeilen-Link. |
| `InstallHint`, `PwaRegister` | „Als App installieren“ und Service Worker (`public/sw.js` des Tools). |

**Barrierefreiheit** (geprüft mit axe in den E2E-Tests jedes Tools, Idee Q11): Text mindestens `gray-500` auf Weiß und
`gray-400` auf Dunkel (`gray-400` auf Weiß und `gray-500` auf `gray-800` sind zu blass); Links im Text mit
`linkClass`; ein `aria-label` nur, wenn es den sichtbaren Text enthält - sonst den Namen aus sichtbarem Text plus
`sr-only` bilden; ein `role="img"` enthält keine Links oder Knöpfe (sonst `role="group"`).

Eigene Bausteine eines Tools (z. B. `formatShortDate`, `SlotsBadge`) liegen in dessen `app/ui/kit.tsx`, das die
gemeinsamen re-exportiert. Seiten importieren nur aus `app/ui/kit` - nie Farben oder Knopf-Klassen von Hand
zusammenbauen, wenn es dafür einen Baustein gibt. Was in zwei Tools gebraucht wird, gehört hierher.

Besonders oft übersehen (Prüfung vom 2026-10-24):

* **Eingabefelder, Auswahllisten und Textfelder immer mit `inputClass`**, auch in Gästeformularen und in
  Unterkomponenten (Begleitungen, Menüwahl). Eigene Klassen ohne `text-base` unter `sm` lassen iOS beim Antippen
  hineinzoomen.
* **Knopfbeschriftungen ohne Emoji**, auch bei Nebenaktionen („Erneut senden“, nicht „✉️ erneut senden“). In
  Überschriften, Hinweisen und Mails sind Emojis erlaubt, sparsam.

## Handy

* Eingabefelder `text-base` (16 px) unter `sm`, Knöpfe vor Ort mindestens 40-44 px hoch.
* Aktionen unter dem Inhalt statt daneben; Tabellen werden zu Zeilen bzw. Karten (kein seitliches Scrollen der Seite).
* Telefonnummern und E-Mail-Adressen antippbar (`tel:`, `mailto:`).
* Was nach einer Auswahl folgt (Formular, Ziel wählen), hängt unten am Bildschirm oder scrollt ins Bild, wenn es sonst
  außer Sicht wäre.
* Lange Wörter brechen um (`theme.css`), die Seite scrollt nie seitlich.

## Darkmode und Druck

* Darkmode folgt der Systemeinstellung, **nur am Bildschirm** (`@custom-variant dark` in `theme.css`); Ausdrucke bleiben
  hell. Zu jeder hellen Farbklasse gehört ihr `dark:`-Gegenstück nach festem Schema: `bg-white` → `dark:bg-gray-800`,
  `bg-gray-50` → `dark:bg-gray-900`, `text-gray-900` → `dark:text-gray-100`, `text-gray-600` → `dark:text-gray-400`,
  `border-gray-300` → `dark:border-gray-600`, helle Farbflächen `bg-X-50` → `dark:bg-X-950/50`, Farbtext `text-X-700` →
  `dark:text-X-300`; kräftige Knopffarben bleiben. Ausnahmen (z. B. Anzeigetafeln, Raumpläne) begründet das Tool.
* Kopfzeile, Reiter, Fußzeile und Knöpfe erscheinen nicht im Ausdruck (`print:hidden`); `Main` druckt randlos.

## Mails

Alle Mails aller Tools kommen aus einer Vorlage: `renderMail` aus `suite-kit/web` (Code: `web/mail.ts`). Ein Tool
beschreibt nur den Inhalt als Bausteine, nie eigenes HTML - so sehen die Mails überall gleich aus, und jeder Text ist
escapet (Namen, Titel und Angaben können kein HTML einschleusen). HTML- und Klartext-Teil entstehen aus demselben
Inhalt.

* **Aufbau:** Marke wie in der Kopfzeile (Buchstabe im blauen Quadrat und Name) über einer weißen Karte auf hellgrauem
  Grund; in der Karte die Überschrift, dann die Bausteine; darunter klein, warum man die Mail bekommt (`footer`).
  Immer hell, höchstens 600 px breit, auf dem Handy volle Breite.
* **Bausteine:** `p` (Absatz, mit `{ strong }`, `{ mono }` für Codes/IBAN und `{ link, href }`), `small` (Hinweis),
  `rows` (Tabelle Bezeichnung → Wert, z.B. Wann/Wo), `list`, `button`, `box` (Kasten in einer Bedeutungsfarbe mit
  eigenen Bausteinen), `image` (Bild aus dem Anhang per `cid:`, z.B. QR-Code).
* **Knöpfe:** genau eine Hauptaktion (blau), darunter automatisch der Link zum Kopieren; weitere Wege als
  `secondary` (weiß mit Rand). Beschriftung ohne Emoji, wie in der Oberfläche.
* **Farben** nur mit Bedeutung (Kästen): `pink` Zahlung/rsvp-app, `amber` Änderung/Achtung, `blue` Nachricht der
  Veranstaltung, `gray` neutral (z.B. Menü).
* **Text:** Anrede „Hallo <Name>,“ als erster Absatz, Gruß als letzter. Überschrift ohne Emoji. Termine immer als
  `rows` mit „Wann“ und „Wo“.
* **Links** nur mit `https:`/`http:`, `mailto:`, `tel:` und `cid:` - alles andere wird als Text ausgegeben.
* Jedes Tool hat eine Vorschau mit Beispieldaten (rsvp-app: `npx tsx scripts/mail-preview.ts`, schreibt alle Mails
  als HTML nach `.e2e/mail-preview/`).

## Sprache

Deutsch, Anrede „du“, gendergerecht mit Sternchen (Teilnehmer\*innen). Begriffe wie im README von suite-kit
(Verwaltungskonto, Teilnehmendenkonto, „Konto mit Admin-Rolle“). Knöpfe sagen, was passiert („Event löschen“,
„Einstellungen speichern“), Hinweise sagen, was als Nächstes zu tun ist.

## Ein neues Tool

1. `suite-kit` als Git-Abhängigkeit (siehe README), dazu Tailwind 4, Next.js und React.
2. `app/globals.css`:
   ```css
   @import "tailwindcss";
   @import "suite-kit/theme.css";
   ```
   `theme.css` meldet Tailwind die Bausteine in `node_modules/suite-kit/dist/ui` an - ohne diese Zeile fehlen ihre Klassen.
3. `app/ui/kit.tsx`: `export * from 'suite-kit/ui'` und ggf. eigene Bausteine.
4. `app/layout.tsx`: Kopfzeile mit `AppHeader` (Inhalte des Tools), `AppFooter`, `PwaRegister`; `<body className="antialiased min-h-screen flex flex-col">` (Hintergrund und Schrift kommen aus `theme.css`).
5. `docs/KONZEPT-OBERFLAECHE.md` im Tool: welche Seiten es gibt und wie sie die Regeln hier umsetzen.

## Änderungen an alle Tools verteilen

1. Baustein oder Regel hier ändern (`ui/*.tsx`, `ui/theme.css`, dieses Dokument), `npm test`.
2. Version erhöhen (`package.json`, Tag `vX.Y.Z`), pushen - Tools pinnen eine Version, nichts ändert sich ungefragt.
3. Alle Tools nachziehen: `node scripts/update-apps.mjs vX.Y.Z` (installiert die Version in jedem Tool neben diesem
   Repository, baut, prüft Typen und Lint). Danach je Tool die Tests laufen lassen, committen und ausrollen.

Ein Tool kann so lange auf einer älteren Version bleiben; zusammen passen die Tools aber erst wieder, wenn alle
nachgezogen haben.
