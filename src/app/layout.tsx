import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

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
  title: "DARQ Era",
  description:
    "Signal-driven coverage of Decentralization, AI, Reality, and Quantum Computing.",
  openGraph: {
    title: "DARQ Era",
    description:
      "Signal-driven coverage of Decentralization, AI, Reality, and Quantum Computing.",
    url: "https://darqera.com",
    siteName: "DARQ Era",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-[#131313] text-[#e5e2e1]">
        <Nav />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
