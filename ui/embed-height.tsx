// ui/embed-height.tsx
'use client'

import { useEffect } from 'react'
import { EMBED_HEIGHT_MESSAGE, type EmbedHeightMessage } from './embed-message.js'

/**
 * In einbettbare Seiten (Gästeseiten, die `EMBEDDABLE` senden) eingebunden: Läuft die Seite in einem iFrame, meldet
 * sie ihre Höhe bei jeder Änderung per postMessage an die einbettende Seite (Startseite, Campus-App, CMS), damit das
 * iFrame ohne eigene Bildlaufleiste mitwächst. Sonst passiert nichts.
 *
 * Eingebettet setzt sie `data-suite-embedded` am `<html>`: theme.css hebt dann `min-height` am `<body>` auf (die Tools
 * nutzen `min-h-screen`), sonst wäre die Seite nie kleiner als der Rahmen und könnte nicht schrumpfen.
 *
 * Ziel `*`: Die Seite lädt ohnehin nur in Rahmen, die `frame-ancestors` erlaubt, und die Höhe verrät nichts, was die
 * einbettende Seite nicht sieht.
 */
export default function EmbedHeight() {
  useEffect(() => {
    if (window.self === window.top) return
    const root = document.documentElement
    root.dataset.suiteEmbedded = ''
    let last = 0
    let frame = 0
    const report = () => {
      frame = 0
      const height = Math.ceil(document.body.getBoundingClientRect().height)
      if (height < 1 || height === last) return
      last = height
      const message: EmbedHeightMessage = { type: EMBED_HEIGHT_MESSAGE, height }
      window.parent.postMessage(message, '*')
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(report) }
    const observer = new ResizeObserver(schedule)
    observer.observe(document.body)
    schedule()
    return () => {
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
      delete root.dataset.suiteEmbedded
    }
  }, [])

  return null
}
