'use client'


import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { reviewFormDefaultValues } from '@/lib/constants';
import { insertReviewSchema } from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { StarIcon } from 'lucide-react';
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form';
import { toast } from "sonner";
import { z } from 'zod';
import { createUpdateReview, getAllReviewsForUser } from '@/lib/actions/review.actions';

const ReviewForm = ({ userId, productId, onReviewSubmitted }: {
    userId: string,
    productId: string,
    onReviewSubmitted: () => void
}) => {
    const [open, setOpen] = useState(false)
    const form = useForm<z.infer<typeof insertReviewSchema>>({
        resolver: zodResolver(insertReviewSchema),
        defaultValues: reviewFormDefaultValues
    })

    const handleOpenForm = async () => {
        form.setValue('productId', productId)
        form.setValue('userId', userId)
        const review = await getAllReviewsForUser({ productId })
        console.log(review)
        if (review) {
            form.setValue('title', review.title ?? '');
            form.setValue('description', review.content);
            form.setValue('rating', review.rating);
        }
        setOpen(true)
    }
    const onSubmit: SubmitHandler<z.infer<typeof insertReviewSchema>> = async (data) => {
        const res = await createUpdateReview({ ...data, productId })

        if (!res.success) {
            toast.error(res.message)
            setOpen(false)
            onReviewSubmitted?.()
        }
        if (res.success) {
            setOpen(false)
            onReviewSubmitted?.()
            toast.success(res.message)

        }
    }
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button onClick={handleOpenForm} variant='default'>
                Write a review
            </Button>
            <DialogContent className='sm:max-w-[425px]'>

                <Form  {...form}>
                    <form method="POST" onSubmit={form.handleSubmit(onSubmit)}>
                        <DialogHeader>
                            <DialogTitle>Product Review</DialogTitle>
                            <DialogDescription>
                                Please write a review for the product
                            </DialogDescription>
                        </DialogHeader>
                        <div className='grid gap-4 py-4'>
                            <FormField control={form.control} name='title' render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder='Enter Title' {...field} />
                                    </FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name='description' render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder='Enter Description' {...field} />
                                    </FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name='rating' render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rating</FormLabel>
                                    <Select
                                        onValueChange={val => field.onChange(Number(val))}
                                        value={field.value ? field.value.toString() : ''}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder='Select Rating' />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Array.from({ length: 5 }, (_, i) => (
                                                <SelectItem key={i} value={`${i + 1}`}>
                                                    {i + 1} <StarIcon className='inline w-4 h-4' />
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <DialogFooter>
                            <Button type='submit' size='sm' disabled={form.formState.isSubmitting} className='w-full'>
                                {form.formState.isSubmitting ? 'Submitting...' : 'Submit'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default ReviewForm
