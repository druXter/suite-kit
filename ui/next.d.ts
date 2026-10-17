// ui/next.d.ts - nur für den Build von suite-kit: Next.js ist eine Peer-Abhängigkeit der Tools und hier nicht
// installiert. Beschrieben ist nur, was die Bausteine nutzen; in den Tools gelten die echten Typen von Next.js.
declare module 'next/link' {
  import type { AnchorHTMLAttributes, ReactNode, Ref } from 'react'
  const Link: (props: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; ref?: Ref<HTMLAnchorElement>; prefetch?: boolean | null; children?: ReactNode }) => ReactNode
  export default Link
}

declare module 'next/navigation' {
  export function usePathname(): string
}
