import { z } from "zod";
import { insertReviewSchema } from "@/lib/validators";


export type Review = z.infer<typeof insertReviewSchema> &{
    id: string;
    createdAt: Date;
    user?:{name: string}
};

//export type ReviewFormValues = Omit<Review, "id" | "createdAt" | "updatedAt">;


