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
            <div className="flex h-screen flex-col">
                <Header />
                <SessionProvider>
                    <main className="flex-1 wrapper">
                        {children}
                    </main>
                </SessionProvider>
                <Footer />
            </div>

        </>
    );
}
