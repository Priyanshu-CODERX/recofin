import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { GlobalErrorProvider } from "@/components/global-error-provider";
import AssistantWidget from "@/components/assistant/assistant-widget";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Recofin - Autonomous Finance Controller",
  description: "Models investigate. Rules authorize. Evidence proves.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-background min-h-screen`}>
        <GlobalErrorProvider>{children}</GlobalErrorProvider>
        <AssistantWidget />
      </body>
    </html>
  );
}
