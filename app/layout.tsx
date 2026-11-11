import type { Metadata } from "next";
import "@fontsource/hind-guntur/latin-400.css";
import "@fontsource/hind-guntur/latin-600.css";
import "@fontsource/hind-guntur/latin-700.css";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "@fontsource/poppins/latin-900.css";
import { Footer } from "@/src/components/navigation/footer";
import { Header } from "@/src/components/navigation/header";
import { MobileNav } from "@/src/components/navigation/mobile-nav";
import { site } from "@/src/lib/site";
import "../src/styles/global.css";

export const metadata: Metadata = {
  title: {
    default: site.title,
    template: `%s · ${site.title}`,
  },
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}
