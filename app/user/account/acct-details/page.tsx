import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/auth';
import ProfileForm from './profile-form';

export const metadata: Metadata = {
    title: 'Customer Profile',
    description: 'Customer profile page',
};

const ProfilePage = async () => {
    const session = await auth();

    if (!session) {
        redirect('/sign-in');
    }


    return (<>
        {session && <SessionProvider session={session}>
            <div className='max-w-md  mx-auto space-y-4'>
                <h2 className='h2-bold'>Profile</h2>
                <ProfileForm />

            </div>
        </SessionProvider>}

    </>);
}

export default ProfilePage;