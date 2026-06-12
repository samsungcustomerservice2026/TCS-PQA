import { Geist, Geist_Mono } from "next/font/google";
import { SCORA_MAIN_ORIGIN } from "../constants/scoraDomains";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TCS — Technical Capability System | Samsung Engineers",
  description: "Track, rank, and reward Samsung field engineers with the Technical Capability System (TCS). Transparent scoring based on KPIs, DRNPS, and exam performance.",
  keywords: ["TCS", "Technical Capability System", "Samsung", "engineer ranking", "KPI", "DRNPS", "field engineer"],
  authors: [{ name: "Samsung Service Operations" }],
  robots: "index, follow",
  openGraph: {
    title: "TCS — Technical Capability System",
    description: "Earn Your Tier • Own Your Title. Samsung's transparent engineering performance framework.",
    url: SCORA_MAIN_ORIGIN,
    siteName: "TCS For Engineers",
    images: [
      {
        url: `${SCORA_MAIN_ORIGIN}/sam_logo.png`,
        width: 800,
        height: 400,
        alt: "TCS For Engineers",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TCS — Technical Capability System",
    description: "Earn Your Tier • Own Your Title. Samsung's engineering performance framework.",
    images: [`${SCORA_MAIN_ORIGIN}/sam_logo.png`],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
