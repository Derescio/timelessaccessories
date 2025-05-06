"use client";

import { useState } from "react";
import { generateUploadButton } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import Image from "next/image";

const UploadButton = generateUploadButton<OurFileRouter>();

export default function SimpleUploadPage() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    return (
        <div className="p-10">
            <h1 className="text-2xl font-bold mb-5">Simplified Upload Test</h1>

            <div className="border p-5 rounded-md mb-5">
                <h2 className="text-lg font-semibold mb-3">Direct UploadButton Test</h2>
                <UploadButton
                    endpoint="categoryImage"
                    onBeforeUploadBegin={(files) => {
                        // console.log("Before upload:", files);
                        setIsUploading(true);
                        return files;
                    }}
                    onClientUploadComplete={(res) => {
                        //   console.log("Upload complete response:", res);
                        setIsUploading(false);

                        if (res && res.length > 0) {
                            // Define a type for the response
                            type UploadResponse = {
                                url?: string;
                                fileUrl?: string;
                                ufsUrl?: string;
                                [key: string]: unknown;
                            };

                            // Try all possible response formats
                            const file = res[0] as unknown as UploadResponse;
                            // console.log("Raw file object:", file);

                            // Try to extract URL
                            if (file.url) {
                                //  console.log("Found URL:", file.url);
                                setImageUrl(file.url);
                            } else if (file.fileUrl) {
                                //   console.log("Found fileUrl:", file.fileUrl);
                                setImageUrl(file.fileUrl);
                            } else if (file.ufsUrl) {
                                //  console.log("Found ufsUrl:", file.ufsUrl);
                                setImageUrl(file.ufsUrl);
                            } else {
                                console.error("No URL in response");
                                setUploadError("Failed to get image URL from response");
                            }
                        }
                    }}
                    onUploadError={(error) => {
                        console.error("Upload error:", error);
                        setIsUploading(false);
                        setUploadError(error.message);
                    }}
                />
            </div>

            <div className="mt-5">
                {isUploading && (
                    <div className="text-blue-500 font-semibold">Uploading...</div>
                )}

                {uploadError && (
                    <div className="text-red-500 p-3 border border-red-300 rounded-md mb-5">
                        Error: {uploadError}
                    </div>
                )}

                {imageUrl && (
                    <div className="mt-5 space-y-3">
                        <h2 className="text-lg font-semibold">Uploaded Image:</h2>
                        <div className="border rounded-md overflow-hidden w-64 h-64 relative">
                            <Image src={imageUrl} alt="Uploaded" className="object-cover w-full h-full" width={256} height={256} />
                        </div>
                        <div className="break-all text-sm">
                            <span className="font-semibold">URL:</span> {imageUrl}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 