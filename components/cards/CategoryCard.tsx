import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface CategoryCardProps {
    title: string;
    href: string;
    imageUrl: string;
    description?: string;
}

export function CategoryCard({ title, href, imageUrl, description }: CategoryCardProps) {
    return (
        <Link href={href}>
            <Card className="overflow-hidden transition-all hover:shadow-lg">
                <div className="aspect-[4/3] relative">
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />

                </div>
                <CardContent className="p-4">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    {description && (
                        <p className="text-sm text-muted-foreground mt-2">{description}</p>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
} 