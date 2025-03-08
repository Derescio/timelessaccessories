import { auth, signIn, signOut } from "@/auth";

export default async function AuthTestPage() {
    const session = await auth();

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>

            <div className="space-y-4">
                <div className="p-4 bg-gray-100 rounded">
                    <h2 className="font-semibold mb-2">Session Status:</h2>
                    <pre className="bg-white p-2 rounded">
                        {JSON.stringify(session, null, 2)}
                    </pre>
                </div>

                <div className="flex gap-4">
                    {!session ? (
                        <form
                            action={async () => {
                                "use server";
                                await signIn();
                            }}
                        >
                            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                                Sign In
                            </button>
                        </form>
                    ) : (
                        <form
                            action={async () => {
                                "use server";
                                await signOut();
                            }}
                        >
                            <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                                Sign Out
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
} 