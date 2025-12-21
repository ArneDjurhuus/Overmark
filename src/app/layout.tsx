import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Overmarksgården Intra",
  description: "Sammenværd, Tryghed, Udvikling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
