import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
  return <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}><body>{children}</body></html>;
}
