// "use client";

// import { Star } from "lucide-react";
// import { ClientProduct } from "@/lib/types/product.types";

// interface ProductReviewsProps {
//     // reviews: ClientProduct["reviews"];
//     rating?: number | null;
//     numReviews?: number;
// }

// export function ProductReviews({ reviews, averageRating: providedAverage, reviewCount }: ProductReviewsProps) {
//     if (reviews.length === 0) {
//         return (
//             <div className="text-center py-12">
//                 <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
//                 <p className="text-muted-foreground">No reviews yet.</p>
//             </div>
//         );
//     }

//     const calculatedAverage = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
//     const displayedAverage = providedAverage ?? calculatedAverage;
//     const displayedCount = reviewCount ?? reviews.length;

//     return (
//         <div>
//             <div className="flex items-center justify-between mb-8">
//                 <h2 className="text-2xl font-semibold">Reviews</h2>
//                 <div className="flex items-center gap-2">
//                     <div className="flex items-center">
//                         {[1, 2, 3, 4, 5].map((star) => (
//                             <Star
//                                 key={star}
//                                 className={`h-5 w-5 ${star <= displayedAverage
//                                     ? "fill-primary text-primary"
//                                     : "fill-muted text-muted-foreground"
//                                     }`}
//                             />
//                         ))}
//                     </div>
//                     <span className="text-lg font-medium">
//                         {typeof displayedAverage === 'number'
//                             ? displayedAverage.toFixed(1)
//                             : '0.0'} ({displayedCount} reviews)
//                     </span>
//                 </div>
//             </div>

//             <div className="space-y-8">
//                 {reviews.map((review, index) => (
//                     <div key={index} className="border-b pb-8">
//                         <div className="flex items-center justify-between mb-4">
//                             <div>
//                                 <h3 className="font-semibold">Review {index + 1}</h3>
//                             </div>
//                             <div className="flex items-center">
//                                 {[1, 2, 3, 4, 5].map((star) => (
//                                     <Star
//                                         key={star}
//                                         className={`h-4 w-4 ${star <= review.rating
//                                             ? "fill-primary text-primary"
//                                             : "fill-muted text-muted-foreground"
//                                             }`}
//                                     />
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// } 