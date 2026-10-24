// ui/proof-of-work.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { POW_ENDPOINT, POW_FIELD, solvePowChallenge, type PowChallenge } from '../web/pow.js'
import { hintClass } from './kit.js'

/** Neue Aufgabe so lange vor dem Ablauf holen. */
const REFRESH_BEFORE_MS = 60_000

/**
 * Bot-Schutz für ein öffentliches Formular: irgendwo in das `<form>` setzen, die Server Action prüft das Feld
 * `POW_FIELD` mit `verifyPowSolution` (suite-kit). Holt beim Laden eine Aufgabe, rechnet sie im Hintergrund und legt
 * die Lösung in ein verstecktes Feld - meist fertig, bevor das Formular ausgefüllt ist. Wird früher abgeschickt, hält
 * die Komponente das Absenden an und schickt nach der Lösung selbst ab.
 *
 * Eine Lösung gilt nur einmal: Nach jedem Absenden (auch wenn die Seite danach mit einer Fehlermeldung stehen bleibt)
 * und kurz vor dem Ablauf holt sie eine neue.
 */
export default function ProofOfWork({ endpoint = POW_ENDPOINT }: { endpoint?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const solutionRef = useRef('')
  const loadingRef = useRef(false)
  /** Abgeschickt, bevor die Lösung da war: der Knopf, mit dem es weitergeht. */
  const waitingRef = useRef<{ submitter: HTMLElement | null } | null>(null)
  /** Das nächste Absenden ohne Lösung durchlassen (Aufgabe nicht ladbar) - der Server meldet dann POW_MESSAGE. */
  const passRef = useRef(false)
  const runRef = useRef<AbortController | null>(null)
  const [solution, setSolutionState] = useState('')
  const [waiting, setWaiting] = useState(false)

  // Über den State, nicht direkt am Feld: React setzt bei jedem Rendern den Wert eines versteckten Felds auf die
  // Props zurück. Die Ref braucht der Submit-Handler, der vor dem nächsten Rendern entscheidet.
  const setSolution = (value: string) => {
    solutionRef.current = value
    setSolutionState(value)
    if (inputRef.current) inputRef.current.value = value
  }

  const load = useCallback(async () => {
    runRef.current?.abort()
    const run = new AbortController()
    runRef.current = run
    loadingRef.current = true
    setSolution('')
    let solved: string | null = null
    let challenge: PowChallenge | null = null
    try {
      const response = await fetch(endpoint, { cache: 'no-store', signal: run.signal })
      if (response.ok) {
        challenge = (await response.json()) as PowChallenge
        solved = await solvePowChallenge(challenge, { signal: run.signal })
      }
    } catch {
      // Netzwerkfehler oder abgebrochen
    }
    if (run.signal.aborted) return
    loadingRef.current = false
    if (solved) setSolution(solved)
    if (challenge) {
      const delay = Math.max(challenge.expiresAt - Date.now() - REFRESH_BEFORE_MS, 10_000)
      const timer = setTimeout(() => void load(), delay)
      run.signal.addEventListener('abort', () => clearTimeout(timer))
    }
    // Wurde inzwischen abgeschickt: jetzt nachholen.
    const pending = waitingRef.current
    const form = inputRef.current?.form
    if (pending && form) {
      waitingRef.current = null
      setWaiting(false)
      if (!solved) passRef.current = true
      form.requestSubmit(pending.submitter && form.contains(pending.submitter) ? pending.submitter : null)
    }
  }, [endpoint])

  useEffect(() => {
    void load()
    return () => runRef.current?.abort()
  }, [load])

  useEffect(() => {
    // Auf window in der Capture-Phase, damit das vor React und vor den onSubmit-Handlern des Formulars läuft: Ein
    // hier verhindertes Absenden startet die Server Action nicht.
    function onSubmit(event: SubmitEvent) {
      const form = inputRef.current?.form
      if (!form || event.target !== form) return
      if (solutionRef.current || passRef.current) {
        passRef.current = false
        // React hat die Formulardaten in diesem Moment schon gelesen; danach die verbrauchte Lösung ersetzen.
        setTimeout(() => void load(), 0)
        return
      }
      event.preventDefault()
      event.stopPropagation()
      waitingRef.current = { submitter: event.submitter }
      setWaiting(true)
      // Die letzte Aufgabe ist gescheitert (z.B. kurz offline): beim Absenden einmal neu versuchen.
      if (!loadingRef.current) void load()
    }
    window.addEventListener('submit', onSubmit, true)
    return () => window.removeEventListener('submit', onSubmit, true)
  }, [load])

  return (
    <>
      <input ref={inputRef} type="hidden" name={POW_FIELD} value={solution} readOnly />
      {waiting && <p role="status" className={hintClass}>Einen Moment, Sicherheitsprüfung läuft …</p>}
    </>
  )
}
