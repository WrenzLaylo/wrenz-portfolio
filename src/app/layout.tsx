import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wrenz-portfolio.vercel.app"),
  title: "Wrenz Laylo | Full-Stack Developer & Automation Engineer",
  description: "Portfolio of Wrenz Laylo, a full-stack developer building business systems, production automation, WordPress solutions, and applied AI workflows.",
  keywords: ["Wrenz Laylo", "Full-Stack Developer", "Automation Engineer", "WordPress Developer", "AI Engineer", "React", "Next.js", "Python", "Django"],
  authors: [{ name: "Wrenz Ivan Laylo" }],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Wrenz Laylo | Developer & Automation Engineer",
    description: "Business systems, production automation, WordPress engineering, and applied AI.",
    url: "/",
    type: "website",
    locale: "en_PH",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}><body>{children}</body></html>;
}
