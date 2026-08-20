import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/theme-provider";
import { ModeToggle } from "@/components/toggler";
import { dark, neobrutalism } from '@clerk/ui/themes'
import Link from "next/link";
import { QueryProvider } from "@/providers/query-provider";


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
          <QueryProvider>

        
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ClerkProvider
            appearance={{
             
              signIn: { theme: neobrutalism },
    options: {
  
      socialButtonsPlacement: 'bottom',
      socialButtonsVariant: 'iconButton',
      termsPageUrl: 'https://clerk.com/terms',
    },
  }}
            >
          <header className="flex justify-end items-center p-4 gap-4 h-16">
            <Show when="signed-out">
              <SignInButton />
              <SignUpButton>
               
                <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                 <Link href="/sign-up">Sign Up</Link>pa
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">

                <span className="mx-2 text-white " >{today.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</span>
             <ModeToggle />
              <UserButton />
            </Show>
          </header>
          {children}
        </ClerkProvider>
        </ThemeProvider>
          </QueryProvider>
         </TooltipProvider>
      </body>
    </html>
  );
}
