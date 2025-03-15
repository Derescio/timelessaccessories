import '@/app/assets/styles/globals.css'
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <div className="min-h-screen bg-white">
                <SessionProvider>
                    <Header />

                    <main>
                        {children}
                    </main>
                </SessionProvider>
                <Footer />
            </div>

        </>
    );
}
