import type { Metadata } from "next";
// import { Geist, Geist_Mono, Poppins } from "next/font/google";
import { Poppins } from "next/font/google";
import '@/app/assets/styles/globals.css'
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next"
import { SessionProvider } from "next-auth/react"
import OrganizationJsonLd from '@/components/seo/OrganizationJsonLd'
import WebSiteJsonLd from '@/components/seo/WebSiteJsonLd'
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

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shop-dw.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Shop-DW | Everyday Accessories for Modern Living",
    template: "%s | Shop-DW",
  },
  description: "Everyday accessories for modern living - Shop-DW offers a curated selection of timeless accessories including jewelry, watches, bags, and more.",
  keywords: ['accessories', 'jewelry', 'watches', 'bags', 'fashion', 'timeless accessories', 'everyday accessories', 'modern living'],
  authors: [{ name: 'Shop-DW' }],
  creator: 'Shop-DW',
  publisher: 'Shop-DW',
  openGraph: {
    type: 'website',
    siteName: 'Shop-DW',
    url: BASE_URL,
    title: 'Shop-DW | Everyday Accessories for Modern Living',
    description: 'Everyday accessories for modern living - Shop-DW offers a curated selection of timeless accessories.',
    images: [
      {
        url: `${BASE_URL}/og/natural_stone_1.png`,
        width: 1200,
        height: 630,
        alt: 'Shop-DW - Everyday Accessories for Modern Living',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop-DW | Everyday Accessories for Modern Living',
    description: 'Everyday accessories for modern living - Shop-DW offers a curated selection of timeless accessories.',
    images: [`${BASE_URL}/og/natural_stone_1.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '9e290d143da9739f',
  },
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
        {/* JSON-LD Structured Data */}
        <OrganizationJsonLd
          name="Shop-DW"
          url={BASE_URL}
          logo={`${BASE_URL}/logo.png`} // Update with actual logo URL
          contactPoint={{
            contactType: 'Customer Service',
            email: 'info@shop-dw.com',
          }}
          sameAs={[
            // Add social media profiles if available
            // 'https://www.facebook.com/shopdw',
            // 'https://www.twitter.com/shopdw',
            // 'https://www.instagram.com/shopdw',
          ]}
        />
        <WebSiteJsonLd
          name="Shop-DW"
          url={BASE_URL}
          searchActionUrl={`${BASE_URL}/products?search={search_term_string}`}
        />
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
