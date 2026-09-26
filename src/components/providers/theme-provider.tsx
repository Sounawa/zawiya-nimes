'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

/** Fournisseur de thème — clair par défaut, « nuit » au choix.
 *  Le mode nuit est rangé sous la classe .dark (variables CSS dédiées). */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
