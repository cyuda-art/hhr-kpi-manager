import type { Metadata } from "next";
import { Noto_Sans_JP, Poppins, Lato } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AppProvider } from "@/components/providers/AppProvider";
import { CookieBanner } from "@/components/ui/CookieBanner";

const notoSansJP = Noto_Sans_JP({ 
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LogicTree Pro | 複合施設KPI管理",
  description: "複合施設向けKPI/KGI管理ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} ${poppins.variable} ${lato.variable} font-sans bg-clean-canvas text-logic-slate`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppProvider>
            {children}
            <CookieBanner />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
