'use client';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from "sonner"
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod'
import { updateProfile } from '@/lib/actions/user.actions';
import { updateUserSchema } from '@/lib/validators';




const ProfileForm = () => {

    const { data: session, update } = useSession();


    // const { toast } = useToast();
    const form = useForm<z.infer<typeof updateUserSchema>>({
        resolver: zodResolver(updateUserSchema),
        defaultValues: {
            name: session?.user?.name ?? '',
            email: session?.user?.email ?? '',
        },
    });

    async function onSubmit(values: z.infer<typeof updateUserSchema>) {
        const res = await updateProfile(values);

        if (!res.success)
            return toast.error(res.message);
        if (res.success) {
            toast.success(res.message);
            const newSession = {
                ...session,
                user: {
                    ...session?.user,
                    name: values.name,
                },
            };

            await update(newSession);
        }



        toast('User Profile Updated', {
            description: res.message,
        });
    }
    // console.log(session)

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-5">
                <div className='flex flex-col gap-5'>
                    <FormField
                        control={form.control}
                        name='email'
                        render={({ field }) => (
                            <FormItem className='w-full'>
                                <FormControl>
                                    <Input
                                        disabled
                                        placeholder='Email'
                                        {...field}
                                        className='input-field'
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name='name'
                        render={({ field }) => (
                            <FormItem className='w-full'>
                                <FormControl>
                                    <Input
                                        placeholder='Name'
                                        {...field}
                                        className='input-field'
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button
                    type='submit'
                    size='lg'
                    disabled={form.formState.isSubmitting}
                    className='button col-span-2 w-full'
                // onClick={() =>
                //     toast("Event has been created", {
                //         description: "Sunday, December 03, 2023 at 9:00 AM",
                //         action: {
                //             label: "Undo",
                //             onClick: () => console.log("Undo"),
                //         },
                //     })
                // }
                >
                    {form.formState.isSubmitting ? 'Submitting...' : 'Update Profile'}
                </Button>
            </form>
        </Form>
    );
};
export default ProfileForm;