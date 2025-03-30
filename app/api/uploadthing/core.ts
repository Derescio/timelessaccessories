import { createUploadthing, type FileRouter } from "uploadthing/next";

// Create a new instance of UploadThing
const f = createUploadthing();

// Simple file router for testing purposes
export const ourFileRouter = {
  // For uploading images
  categoryImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(() => {
      console.log("UploadThing middleware running");
      // Return an object that will be passed to onUploadComplete
      return { userId: "test-user" };
    })
    .onUploadComplete(({ metadata, file }) => {
      console.log("Upload completed for userId:", metadata.userId);
      console.log("File details:", file);
      
      // Use ufsUrl as recommended by UploadThing for v9 compatibility
      return { 
        url: file.ufsUrl,  // Keep for backward compatibility
        fileUrl: file.ufsUrl // Consistent with our other components
      };
    })
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
