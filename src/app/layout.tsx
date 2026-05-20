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
  title: "Gnu.Done | 次世代の自律型KPIマネジメントSaaS",
  description: "管理は終わった。AIが会社の理念を理解し、現場の実務を全自動で完遂する次世代エージェント・プラットフォーム。",
  openGraph: {
    title: "Gnu.Done | 次世代の自律型KPIマネジメントSaaS",
    description: "管理は終わった。AIが会社の理念を理解し、現場の実務を全自動で完遂する次世代エージェント・プラットフォーム。",
    url: "https://www.gnudone.com",
    siteName: "Gnu.Done",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gnu.Done - The End of Management",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gnu.Done | 次世代の自律型KPIマネジメント",
    description: "AIが現場の実務を全自動で完遂する次世代エージェント・プラットフォーム。",
    images: ["/og-image.png"],
  },
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
