// Development layout with warning banner
export default function DevLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            <div className="bg-yellow-100 border-b border-yellow-200 p-2 text-center text-sm">
                ⚠️ Development & Testing Environment
            </div>
            {children}
        </div>
    );
} 