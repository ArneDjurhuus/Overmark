import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Overmarksgården Intra",
  description: "Overmarksgården Intra – et digitalt hjem for beboere og personale.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
