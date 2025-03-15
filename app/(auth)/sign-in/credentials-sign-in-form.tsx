'use client'

import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInDefaultValues } from "@/lib/constants";
import Link from "next/link";
import { signInWithCredentials } from "@/lib/actions/user.actions";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { OAuthButtons } from "@/components/auth/oauth-buttons";


export const metadata: Metadata = {
    title: 'Sign In',
    description: 'Sign in to your account',
};


const signInAction = async (state: { success: boolean; message: string; }, formData: FormData) => {
    return await signInWithCredentials(state, formData);
};


const CredentialsSignInForm = () => {
    const [data, action] = useActionState(signInAction, {
        success: false,
        message: ''
    });

    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    const SignInButton = () => {
        const { pending } = useFormStatus();

        return (
            <Button className='w-full' variant='default' disabled={pending}>
                {pending ? 'Signing in...' : 'Sign In with credentials'}
            </Button>
        )
    }


    return (
        <>
            <form action={action} >
                <input type='hidden' name='callbackUrl' value={callbackUrl} />
                <div className='space-y-6'>
                    <div>
                        <Label htmlFor='email'>Email</Label>
                        <Input
                            id='email'
                            name='email'
                            required
                            type='email'
                            defaultValue={signInDefaultValues.email}
                            autoComplete='email'
                        />
                    </div>
                    <div>
                        <Label htmlFor='password'>Password</Label>
                        <Input
                            id='password'
                            name='password'
                            required
                            type='password'
                            defaultValue={signInDefaultValues.password}
                            autoComplete='current-password'
                        />
                    </div>
                    <div>
                        <SignInButton />
                    </div>
                    {data && !data.success && (
                        <div className='text-sm text-center text-red-600'>
                            {data.message}
                        </div>
                    )}
                    <div className='text-sm text-center text-muted-foreground'>
                        Don`t have an account?{' '}
                        <Link target='_self' className='link' href='/sign-up'>
                            Sign Up
                        </Link>
                    </div>
                </div>
            </form>

            <OAuthButtons />

            <div className='text-sm text-center text-muted-foreground'>
                Don`t have an account?{' '}
                <Link target='_self' className='link' href='/sign-up'>
                    Sign Up
                </Link>
            </div>
        </>
    );
}
export default CredentialsSignInForm;