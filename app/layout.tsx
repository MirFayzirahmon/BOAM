import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { RoleProvider } from "@/components/RoleContext";
import { ThemeProvider } from "@/components/ThemeContext";
import { I18nProvider } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AssetTrack — Bank Office Asset Management",
  description: "CBU Coding Hackathon 2026 — Team NEWBIES",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <I18nProvider>
          <ThemeProvider>
            <RoleProvider>
              {children}
              <Toaster position="top-right" richColors />
            </RoleProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
