import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SPHEREx SkyViewer | NASA Space Apps",
  description:
    "Explore how the infrared sky changes over time. Search SPHEREx observations from NASA/IPAC IRSA by sky coordinates and compare images across epochs and wavelengths.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col" style={{ background: "var(--bg-primary)" }}>
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-[var(--border-subtle)] py-6 px-6 text-center">
          <p className="tech-label mb-1">
            SPHEREx SkyViewer — NASA Space Apps Challenge concept
          </p>
          <p className="tech-label">
            Data accessed from{" "}
            <a
              href="https://irsa.ipac.caltech.edu/Missions/spherex.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              NASA/Caltech IPAC IRSA
            </a>{" "}
            · Not an official NASA product
          </p>
        </footer>
      </body>
    </html>
  );
}
