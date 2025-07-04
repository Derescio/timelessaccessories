import type { Metadata } from "next";
// import { Geist, Geist_Mono, Poppins } from "next/font/google";
import { Poppins } from "next/font/google";
import '@/app/assets/styles/globals.css'
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next"
import { SessionProvider } from "next-auth/react"
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shop-DW",
  description: "Everyday accessories for modern living",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${poppins.variable} antialiased`}
      >
        <SessionProvider>
          {/* <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          > */}

          {children}
          <Toaster richColors position="top-center" />
          <Analytics />
        </SessionProvider>
      </body>
    </html>
  );
}
