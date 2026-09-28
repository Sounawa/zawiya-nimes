import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit, Amiri, EB_Garamond, Crimson_Text, Scheherazade_New, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const sans = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const arabic = Amiri({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

/* Polices du kitāb arabe — texte sacré et du'ā' */
const scheherazade = Scheherazade_New({
  variable: "--font-arabic2",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const naskh = Noto_Naskh_Arabic({
  variable: "--font-arabic3",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

/* Polices de lecture du cahier d'invocations */
const garamond = EB_Garamond({
  variable: "--font-livre2",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const crimson = Crimson_Text({
  variable: "--font-livre3",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Zawiya Nimes",
  description:
    "L'application de la zawiya de Nîmes — ijtima', cotisations, ziyara et vie de la communauté.",
  applicationName: "Zawiya Nimes",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/logo.png", apple: "/logo.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Zawiya Nimes",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0e1411",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} ${arabic.variable} ${scheherazade.variable} ${naskh.variable} ${garamond.variable} ${crimson.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
