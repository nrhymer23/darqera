import type { Metadata } from "next";
import { Space_Grotesk, Newsreader, Geist, Geist_Mono, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Nav from "@/components/Nav";
import ThemeProvider from "@/components/ThemeProvider";
import SiteFooter from "@/components/SiteFooter";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

/* Fraunces italic: Noel's signature only (bylines, footer). */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

export const metadata: Metadata = {
  title: {
    default: "DARQ Era — Tech News & Analysis",
    template: "%s | DARQ Era",
  },
  description:
    "Real-time coverage of Decentralization, AI, Reality, and Quantum Computing — written from a builder's perspective.",
  metadataBase: new URL("https://darqera.com"),
  openGraph: {
    title: "DARQ Era — Tech News & Analysis",
    description:
      "Real-time coverage of Decentralization, AI, Reality, and Quantum Computing.",
    url: "https://darqera.com",
    siteName: "DARQ Era",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DARQ Era",
    description:
      "Real-time coverage of Decentralization, AI, Reality, and Quantum Computing.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

/* Inline script to prevent flash of wrong theme */
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('darqera-theme') || 'system';
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
      className={`${spaceGrotesk.variable} ${newsreader.variable} ${geist.variable} ${geistMono.variable} ${fraunces.variable} h-full dark`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
