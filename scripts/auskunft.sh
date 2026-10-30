#!/usr/bin/env bash
# scripts/auskunft.sh - Auskunft bzw. Löschung zu einer E-Mail-Adresse in allen Tools der Suite (Art. 15/17 DSGVO,
# Idee Q8, Regeln in docs/KONVENTIONEN.md „Datenschutz“). Ruft in jedem Tool `node auskunft.js` im laufenden Container
# auf; es gibt keinen Endpunkt im Netz dafür.
#
#   scripts/auskunft.sh anna@example.org                   Auskunft: je Tool eine JSON-Datei in ~/auskunft/<datum>-<kürzel>/
#   scripts/auskunft.sh anna@example.org --loeschen        Probe: was würde gelöscht (ändert nichts)
#   scripts/auskunft.sh anna@example.org --loeschen --ja   löscht in allen Tools
#
# Die Dateien enthalten personenbezogene Daten: nur für die Person selbst, nach dem Versand löschen. Tools, die es
# neben suite-kit nicht gibt oder deren Container nicht läuft, werden übersprungen (Meldung). SUITE_DIR ändert den
# Ordner mit den Tools (Standard: neben suite-kit).
set -euo pipefail
umask 077

TOOLS=(rsvp-app abstimmungstool seating zeitplan schichten wichteln termine startseite inventur)
email="${1:-}"
if [[ "$email" != *@* ]]; then
  echo "Aufruf: $0 <adresse> [--loeschen [--ja]]" >&2
  exit 1
fi
shift
base="${SUITE_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
out="$HOME/auskunft/$(date +%F)-$(printf '%s' "${email,,}" | sha256sum | cut -c1-8)"
mkdir -p "$out"

failed=0
for tool in "${TOOLS[@]}"; do
  dir="$base/$tool"
  if [[ ! -f "$dir/auskunft.js" ]]; then
    echo "- $tool: nicht gefunden, übersprungen"
    continue
  fi
  if (cd "$dir" && docker compose exec -T "$tool" node auskunft.js "$email" "$@") > "$out/$tool.json" 2> "$out/$tool.err"; then
    rm -f "$out/$tool.err"
    echo "✓ $tool"
  else
    failed=1
    echo "✗ $tool: fehlgeschlagen - siehe $out/$tool.err"
  fi
done
echo "Ergebnis: $out"
exit $failed
