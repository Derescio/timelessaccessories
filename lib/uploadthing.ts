import {
    generateUploadButton,
    generateUploadDropzone,
} from "@uploadthing/react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

// Define a specific upload response type
interface UploadResponse {
    ufsUrl?: string;
    url?: string;
    fileUrl?: string;
    [key: string]: unknown;
}

// Helper function to get the URL from the response - handles both old and new API
export const getFileUrl = (res: unknown[]) => {
    if (!res || !res.length) {
        console.log("Empty upload response received");
        return undefined;
    }
    
    // Use type assertion to avoid TypeScript errors and access any property
    const file = res[0] as unknown as UploadResponse;
    console.log("Upload result object:", file);
    
    // Try all possible URL properties from different UploadThing versions (v7+, v8+, v9+)
    // Version 9+ uses ufsUrl
    if (file.ufsUrl) {
        console.log("Using ufsUrl from response");
        return file.ufsUrl;
    }
    
    // Earlier versions used url
    if (file.url) {
        console.log("Using url from response");
        return file.url;
    }
    
    // Some versions use fileUrl
    if (file.fileUrl) {
        console.log("Using fileUrl from response");
        return file.fileUrl;
    }
    
    // Log if no URL was found
    console.error("No URL found in upload response:", file);
    return undefined;
}; 