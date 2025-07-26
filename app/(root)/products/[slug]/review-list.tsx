'use client'
import { Review } from '@/lib/types/review.types';
import ReviewForm from './review-form';
import Link from 'next/link';
import { useState, useEffect } from 'react'
import { getAllReviews, getVerifiedReviews } from '@/lib/actions/review.actions';
import Rating from '@/components/rating';
import { useSession } from 'next-auth/react';



interface ReviewFromAPI {
    id: string;
    content: string;
    rating: number;
    title: string | null;
    user: { name: string | null };
    createdAt: Date;
    productId: string;
    userId: string;
}


const ReviewList = ({ userId, productId, productSlug }
    : { userId: string, productId: string, productSlug: string }) => {

    const [reviews, setReviews] = useState<Review[]>([]);
    const [hasPurchased, setHasPurchased] = useState<boolean>(false);
    const { data: session } = useSession(); // Get session data for email

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const [reviewsFromApi, hasPurchased] = await Promise.all([
                    getAllReviews({ productId }),
                    getVerifiedReviews({
                        productId,
                        userId: userId,
                        userEmail: session?.user?.email ?? undefined
                    })
                ]);

                const reviews = reviewsFromApi.map((r: ReviewFromAPI): Review => ({
                    id: r.id,
                    title: r.title || 'No Title',
                    description: r.content,
                    productId: r.productId,
                    userId: r.userId,
                    rating: r.rating,
                    createdAt: r.createdAt,
                    user: { name: r.user?.name || 'Anonymous' }
                }));

                setReviews(reviews);
                setHasPurchased(hasPurchased);
            } catch (error) {
                console.error('Error fetching reviews:', error);
                // You might want to set an error state here
            }
        }
        fetchReviews()
    }, [productId, userId, session?.user?.email])
    //Reload the page when a review is submitted
    const reload = async () => {
        try {
            const res = await getAllReviews({ productId });
            //set the reviews to the new reviews
            const reviews = res.map((r: ReviewFromAPI): Review => ({
                id: r.id,
                title: r.title || 'No Title',
                description: r.content,
                productId: r.productId,
                userId: r.userId,
                rating: r.rating,
                createdAt: r.createdAt,
                user: { name: r.user?.name || 'Anonymous' }
            }));
            setReviews(reviews);
        } catch (error) {
            console.error('Error reloading reviews:', error);
        }
    }

    return (
        <div className='space-y-2'>
            <p>Customer Reviews</p>
            {reviews.length === 0 && (
                <div className='text-gray-500'>No Reviews Yet</div>
            )}
            {
                !userId ? (
                    <div>
                        Please <Link href={`/sign-in?callbackUrl=/products/${productSlug}`} className='text-blue-500'>Login</Link> to write a review
                    </div>
                ) : hasPurchased ? (
                    <ReviewForm userId={userId} productId={productId} onReviewSubmitted={reload} />
                ) : (
                    <div className="text-green-600 font-light text-">
                        Only verified purchasers can leave reviews for this product.
                    </div>
                )
            }
            <div className="flex flex-col gap-4">
                {/* Show Reviews here */}
                {reviews.map((review) => (
                    <div
                        key={review.id}
                        className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-5 flex gap-4 items-start border border-zinc-200 dark:border-zinc-800"
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                            {review.user?.name?.[0] ?? '?'}
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">{review.title}</h2>
                                {/* <span className="text-yellow-500 font-medium flex items-center gap-1">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <svg
                                            key={i}
                                            className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400' : 'fill-zinc-300 dark:fill-zinc-700'}`}
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                                        </svg>
                                    ))}
                                </span> */}
                                <Rating value={review.rating} />
                            </div>
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{review.user?.name}</p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">{review.description}</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{review.createdAt.toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ReviewList;