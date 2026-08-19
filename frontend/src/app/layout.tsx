import type { Metadata } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const displaySans = Bricolage_Grotesque({
  variable: "--font-display-sans",
  subsets: ["latin"],
});

const displaySerif = Instrument_Serif({
  variable: "--font-display-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RecallAI",
  description: "Self-hosted RAG document Q&A, backed by a custom C++ vector engine.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${displaySans.variable} ${displaySerif.variable} h-full antialiased`}
    >
      <body className="flex h-full flex-col bg-neutral-950 text-neutral-100">
        {children}
      </body>
    </html>
  );
}
