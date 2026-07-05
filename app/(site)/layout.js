import { Sarabun } from "next/font/google";
import "./globals.css";
import { generateMetadata as genMetadata } from "@/lib/seo";
import { ThemeProvider } from "@/components/ThemeProvider";

const sarabun = Sarabun({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
});

export const metadata = genMetadata({});

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${sarabun.variable} antialiased font-sans`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

