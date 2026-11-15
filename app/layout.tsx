import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "BancActiu Nexus - BancActiu 2.0",
  description: "BancActiu 2.0 - Plataforma Unificada de Governança i Serveis Sociosanitaris (Zero-Trust & ENS Nivell Alt)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ca" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100" suppressHydrationWarning>
        <Script id="bancactiu-init" strategy="beforeInteractive">
          {`
            window.__BANCACTIU_APP__ = "bancactiu-nexus";
            window.__BANCACTIU_ENV__ = "production";
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
