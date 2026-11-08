import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/src/components/navigation/footer";
import { Header } from "@/src/components/navigation/header";
import { MobileNav } from "@/src/components/navigation/mobile-nav";
import { site } from "@/src/lib/site";
import "../src/styles/global.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: site.title,
    template: `%s · ${site.title}`,
  },
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Header />
        {children}
        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}
