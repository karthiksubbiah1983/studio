
'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { BuilderProvider } from "@/hooks/use-builder";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppLayout } from "@/components/app-layout";
import { AuthProvider } from "@/hooks/use-auth";
import { FirebaseClientProvider } from "@/firebase";

config.autoAddCss = false;

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
          <AuthProvider>
            <BuilderProvider>
              <SidebarProvider>
                <AppLayout>
                  {children}
                </AppLayout>
              </SidebarProvider>
            </BuilderProvider>
          </AuthProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
