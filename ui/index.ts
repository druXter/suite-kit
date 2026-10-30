// ui/index.ts - `import { … } from 'suite-kit/ui'`
//
// Gemeinsame Oberfläche aller Tools der Suite (docs/DESIGN.md). Dazu gehört das Stylesheet `suite-kit/theme.css`,
// das jedes Tool nach Tailwind importiert (Darkmode, Grundregeln und die Klassen dieser Bausteine).
export * from './kit.js'
export * from './chrome.js'
export { default as AccountMenu } from './account-menu.js'
export { default as ConfirmForm } from './confirm-form.js'
export { default as CopyableField } from './copyable-field.js'
export { default as Disclosure } from './disclosure.js'
export { default as EmbedHeight } from './embed-height.js'
export * from './embed-message.js'
export { default as FooterLink } from './footer-link.js'
export { default as InstallHint } from './install-hint.js'
export { default as NavLink } from './nav-link.js'
export { default as PrintButton } from './print-button.js'
export { default as ProofOfWork } from './proof-of-work.js'
export { default as PwaRegister } from './pwa-register.js'
