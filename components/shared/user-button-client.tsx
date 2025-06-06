'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserIcon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Session } from "next-auth";

interface UserButtonProps {
    session: Session | null;
    signOutAction: () => Promise<void>;
}

const UserButtonClient = ({ session, signOutAction }: UserButtonProps) => {

    if (!session) return (
        <Button asChild variant='outline'>
            <Link href='/sign-in'>
                <UserIcon size={24} /> Login
            </Link>
        </Button>
    );
    if (!session?.user) return (
        <Button asChild variant='outline'>
            <Link href='/sign-in'>
                <UserIcon size={24} /> Login
            </Link>
        </Button>
    );



    const firstName = session?.user?.name?.charAt(0).toUpperCase() ?? 'U';



    return (
        <div className='flex gap-2 items-center '>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className='flex items-center'>
                        <Button
                            variant='secondary'
                            className='text-black bg-gray-200 relative w-8 h-8 rounded-2xl ml-2 flex items-center justify-center '
                        >
                            {firstName}
                        </Button>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56' align='end' forceMount>
                    <DropdownMenuLabel className='font-normal'>
                        <div className='flex flex-col space-y-1'>
                            <p className='text-sm font-medium leading-none'>
                                {session.user?.name}
                            </p>
                            <p className='text-xs leading-none text-muted-foreground'>
                                {session.user?.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuItem>
                        <Link className="w-full" href="/user/account">
                            My Account
                        </Link>
                    </DropdownMenuItem>
                    {/* <DropdownMenuItem>
                        <Link className='w-full' href='/user/orders'>
                            Order History
                        </Link>
                    </DropdownMenuItem> */}
                    {session?.user?.role === 'ADMIN' && (
                        <DropdownMenuItem>
                            <Link className='w-full' href='/admin/'>
                                Admin Dashboard
                            </Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className='p-0 mb-1'>
                        <Button
                            className='w-full py-4 px-2 h-4 justify-start'
                            variant='ghost'
                            onClick={() => signOutAction()}
                        >
                            Sign Out
                        </Button>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export default UserButtonClient; 