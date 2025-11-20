import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "PressWatch",
  description:
    "企業のプレスリリースを監視し、AI要約と用語解説を提供する PressWatch",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <Header />
            <main className="flex-1 px-4 py-6 max-w-5xl mx-auto w-full">
              {children}
            </main>
            <footer className="border-t border-gray-200 text-xs text-gray-500 px-4 py-3 dark:border-gray-800">
              <div className="max-w-5xl mx-auto">
                PressWatch – Monitor &amp; summarize press releases.
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
