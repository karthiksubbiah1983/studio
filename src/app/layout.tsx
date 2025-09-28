
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { BuilderProvider } from "@/hooks/use-builder";
import { AppHeader } from "@/components/app-header";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

config.autoAddCss = false;

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "CoPilot",
  description: "Build beautiful forms with a drag and drop interface.",
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
        <BuilderProvider>
          <SidebarProvider>
            <div className="flex flex-col h-screen">
              <AppHeader />
              <div className="flex flex-1 overflow-hidden">
                <Sidebar>
                  <AppSidebar />
                </Sidebar>
                <SidebarInset>
                  <main className="flex-1 overflow-auto">{children}</main>
                </SidebarInset>
              </div>
            </div>
          </SidebarProvider>
        </BuilderProvider>
        <Toaster />
      </body>
    </html>
  );
}
