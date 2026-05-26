import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import Sidebar from "@/components/sidebar";
import DashboardHeader from "@/components/dashboard-header";

export const metadata: Metadata = {
  title: "Allo Healthcare | Inventory Reservation Platform",
  description: "High-concurrency healthcare logistics checkout reservation holding platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased selection:bg-blue-500/10">
        <QueryProvider>
          <ToastProvider>
            <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
              
              <Sidebar />
              
              
              <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                
                <DashboardHeader />
                
                
                <main className="flex-1 overflow-y-auto p-8">
                  {children}
                </main>
              </div>
            </div>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
