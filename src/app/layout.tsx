import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/theme-provider";
import { ModeToggle } from "@/components/toggler";
import { dark, neobrutalism } from '@clerk/ui/themes'
import Link from "next/link";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dayflow -HRMS System",
  description: "Dayflow is Human Resource Management System for your company",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const today = new Date();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <TooltipProvider>

        
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
           
        
          <header className="flex justify-end items-center p-4 gap-4 h-16">
           
                <span className="mx-2 text-white " >{today.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</span>
             <ModeToggle />
              
      </header>
          {children}
      
        </ThemeProvider>
        
         </TooltipProvider>
      </body>
    </html>
  );
}
