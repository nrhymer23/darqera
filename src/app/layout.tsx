import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import ThemeProvider from "@/components/ThemeProvider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "DARQ Era — Signal-Driven Tech Intelligence",
    template: "%s | DARQ Era",
  },
  description:
    "Signal-driven coverage of Decentralization, AI, Reality, and Quantum Computing — written from a builder's perspective.",
  metadataBase: new URL("https://darqera.com"),
  openGraph: {
    title: "DARQ Era — Signal-Driven Tech Intelligence",
    description:
      "Signal-driven coverage of Decentralization, AI, Reality, and Quantum Computing.",
    url: "https://darqera.com",
    siteName: "DARQ Era",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DARQ Era",
    description:
      "Signal-driven coverage of Decentralization, AI, Reality, and Quantum Computing.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/* Inline script to prevent flash of wrong theme */
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('darqera-theme') || 'dark';
    var d = t === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t;
    if (d === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full dark`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <footer
            className="py-8 text-center text-xs tracking-wide"
            style={{
              color: "var(--text-muted)",
              borderTop: "1px solid var(--border-ghost)",
            }}
          >
            © {new Date().getFullYear()} DARQ Era. Signal-driven intelligence.
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
