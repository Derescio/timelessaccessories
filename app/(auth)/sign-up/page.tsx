import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
//import { APP_NAME } from '@/lib/constatnts';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SignUpForm from './credentials-signup-form';

export const metadata: Metadata = {
    title: 'Sign Up',
};

const SignUpPage = async (props: {
    searchParams: Promise<{
        callbackUrl: string;
    }>;
}) => {
    const searchParams = await props.searchParams;

    const { callbackUrl } = searchParams;

    const session = await auth();

    if (session) {
        return redirect(callbackUrl || '/');
    }

    return (
        <div className='w-full max-w-md mx-auto'>
            <Card>
                <CardHeader className='space-y-4'>
                    <Link href="/" className="flex-center">
                        <Image src="/images/logo/SHOPDDWLogo.png" alt="SHOPDDW" width={100} height={100} priority={true} className="rounded-full" />
                    </Link>
                    <CardTitle className='text-center'>Create Account</CardTitle>
                    <CardDescription className='text-center'>
                        Enter your information below to create your account
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <SignUpForm />
                </CardContent>
            </Card>
        </div>
    );
};

export default SignUpPage;