// ui/print-button.tsx
'use client'

import { buttonClass, type Variant } from './kit.js'

/** Öffnet den Druckdialog des Browsers (Client-Komponente wegen des Event-Handlers). Erscheint selbst nicht im Ausdruck. */
export default function PrintButton({ label = 'Drucken', variant = 'primary' }: { label?: string; variant?: Variant }) {
  return (
    <button type="button" onClick={() => window.print()} className={`print:hidden ${buttonClass(variant)}`}>
      {label}
    </button>
  )
}
