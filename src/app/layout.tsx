import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppLayout } from "@/components/app-layout";
import { FirebaseClientProvider } from "@/firebase";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "FormForge",
  description: "A powerful drag-and-drop form builder.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <FirebaseClientProvider>
          <Providers>
            <SidebarProvider>
              <AppLayout>
                {children}
              </AppLayout>
            </SidebarProvider>
          </Providers>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
