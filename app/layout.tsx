import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#060b14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "AquaMaster - Akıllı Sıvı & Gübre Dozaj Kontrol Sistemi",
  description: "IoT tabanlı otomatik pompa kalibrasyon, zamanlayıcı ve dozajlama kontrol sistemi.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AquaMaster",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased selection:bg-cyan-500 selection:text-white`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden touch-manipulation">{children}</body>
    </html>
  );
}
