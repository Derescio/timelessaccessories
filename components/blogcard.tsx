// import Image from "next/image"
// import Link from "next/link"

// interface BlogPostCardProps {
//     slug: string
//     title: string
//     excerpt: string
//     image: string
//     author: string
//     date: string
//     // category: string
// }

// export default function BlogPostCard({ slug, title, excerpt, image, author, date }: BlogPostCardProps) {
//     return (
//         <article className="group">
//             <Link href={`/blog/${slug}`}>
//                 <div className="relative aspect-[4/3] mb-4 overflow-hidden rounded-lg">
//                     <Image
//                         src={image || "/images/RingImage.jpg"}
//                         alt={title}
//                         fill
//                         sizes="(min-width: 1024px) 1024px, 100vw"
//                         className="object-cover transition-transform duration-500 group-hover:scale-105"
//                     />
//                 </div>
//             </Link>
//             <div className="space-y-2">
//                 <div className="flex items-center gap-3 text-sm text-gray-500">
//                     <span>BY {author.toUpperCase()}</span>
//                     <span>•</span>
//                     <time dateTime={date}>{date}</time>
//                 </div>
//                 <Link href={`/blog/${slug}`}>
//                     <h2 className="text-xl font-light group-hover:text-primary transition-colors">{title}</h2>
//                 </Link>
//                 <p className="text-gray-600 line-clamp-2">{excerpt}</p>
//                 <Link href={`/blog/${slug}`} className="inline-block text-sm font-normal hover:text-primary">
//                     CONTINUE READING
//                 </Link>
//             </div>
//         </article>
//     )
// }

