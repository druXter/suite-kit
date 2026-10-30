// ui/chrome.tsx
//
// Rahmen aller Seiten (docs/DESIGN.md): Kopfzeile mit Marke, Navigation und Konto-Menü, Reiter einer Detailseite,
// Fußzeile mit Impressum und Datenschutz. Die Inhalte (welche Navigation, welche Menüpunkte) bestimmt jedes Tool selbst,
// das Aussehen kommt nur von hier.
import Link from 'next/link'
import type { ReactNode } from 'react'
import AccountMenu from './account-menu.js'
import FooterLink from './footer-link.js'
import NavLink from './nav-link.js'
import { WIDTH_CLASS, type Width } from './kit.js'

export type NavItem = { href: string; label: ReactNode; match?: string[]; exact?: boolean; exactOr?: string }

/** Klassen für Einträge im Konto-Menü (Links und Knöpfe, z. B. „Abmelden“ in einem <form>). */
export const menuItemClass = 'block w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'

/** Trennlinie über dem letzten Block im Konto-Menü (typisch: das Formular mit „Abmelden“). */
export const menuSeparatorClass = 'border-t border-gray-100 pt-1 dark:border-gray-700'

/**
 * Kopfzeile: Marke (Buchstabe im blauen Quadrat, Name ab sm), für angemeldete Konten die Navigation und das
 * Konto-Menü (Kürzel, Name ab md; im Menü `detail` - z. B. E-Mail und Rolle - und die Einträge aus `account.menu`),
 * sonst der Anmelde-Link. Klebt oben, beim Drucken ausgeblendet; `data-chrome` erlaubt Tools, sie per CSS
 * auszublenden (eingebettete Ansichten). Nur Anzeige - Zugriffe prüfen die Seiten und Server Actions selbst.
 */
export function AppHeader({ brand, nav = [], account, login, width = 'wide', className = '' }: {
  brand: { letter: string; name: string; href: string }
  nav?: NavItem[]
  account?: { name: string; detail?: ReactNode; menu: ReactNode } | null
  login?: { href: string; label?: string } | null
  width?: Width
  className?: string
}) {
  return (
    <header data-chrome className={`sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95 print:hidden ${className}`}>
      <div className={`mx-auto flex h-14 ${WIDTH_CLASS[width]} items-center gap-2 px-4`}>
        {/* Name für Screenreader aus dem sichtbaren Text plus „– Start“, kein aria-label: Der sichtbare Name muss Teil
            des zugänglichen Namens sein (WCAG 2.5.3, Idee Q11). Auf dem Handy nur das Symbol, der Name bleibt vorgelesen. */}
        <Link href={brand.href} className="mr-1 flex shrink-0 items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
          <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-sm text-white">{brand.letter}</span>
          <span className="sr-only sm:not-sr-only">{brand.name}</span>
          <span className="sr-only"> – Start</span>
        </Link>
        {account ? (
          <>
            {nav.length > 0 && (
              <nav className="flex min-w-0 items-center gap-1 overflow-x-auto" aria-label="Hauptnavigation">
                {nav.map(item => <NavLink key={item.href} href={item.href} match={item.match} exact={item.exact} exactOr={item.exactOr}>{item.label}</NavLink>)}
              </nav>
            )}
            <AccountMenu
              summary={<>
                <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-200">{account.name.slice(0, 1)}</span>
                <span className="sr-only md:not-sr-only md:max-w-48 md:truncate">{account.name}</span>
                <span aria-hidden className="text-gray-400">▾</span>
              </>}
            >
              {account.detail && <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 break-all">{account.detail}</p>}
              {account.menu}
            </AccountMenu>
          </>
        ) : login ? (
          <Link href={login.href} className="ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100">{login.label ?? 'Anmelden'}</Link>
        ) : null}
      </div>
    </header>
  )
}

/**
 * Reiter einer Detailseite (Event, Abstimmung, Reihe …) unter dem Seitenkopf. Auf dem Handy seitlich scrollbar, der
 * aktive Reiter scrollt ins Bild. Beim Drucken ausgeblendet.
 */
export function Tabs({ items, label, className = '' }: { items: NavItem[]; label: string; className?: string }) {
  return (
    <nav className={`-mx-4 mb-6 flex overflow-x-auto border-b border-gray-200 px-4 dark:border-gray-700 print:hidden ${className}`} aria-label={label}>
      {items.map(item => <NavLink key={item.href} href={item.href} exact={item.exact} match={item.match} exactOr={item.exactOr} variant="tab">{item.label}</NavLink>)}
    </nav>
  )
}

/** Fußzeile mit Impressum und Datenschutz (eingebettet öffnen beide in einem neuen Tab). */
export function AppFooter({ className = '', imprintHref = '/impressum', privacyHref = '/datenschutz' }: { className?: string; imprintHref?: string; privacyHref?: string }) {
  return (
    <footer data-chrome className={`py-4 text-center text-xs text-gray-500 dark:text-gray-400 print:hidden ${className}`}>
      <FooterLink href={imprintHref}>Impressum</FooterLink>
      {' · '}
      <FooterLink href={privacyHref}>Datenschutz</FooterLink>
    </footer>
  )
}
