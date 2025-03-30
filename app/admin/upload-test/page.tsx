"use client";

import { useState } from "react";
import { UploadButton, UploadDropzone } from "@/lib/uploadthing";
import { toast } from "sonner";
import Image from "next/image";

export default function UploadTestPage() {
    const [imageUrl, setImageUrl] = useState<string | undefined>();

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-4">Upload Test Page</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border p-4 rounded">
                    <h2 className="text-xl mb-4">UploadButton Test</h2>
                    <UploadButton
                        endpoint="categoryImage"
                        onClientUploadComplete={(res) => {
                            console.log("Upload completed via button:", res);
                            if (res && res.length > 0) {
                                // Define type for upload response
                                type UploadResponse = {
                                    url?: string;
                                    fileUrl?: string;
                                    ufsUrl?: string;
                                    [key: string]: unknown;
                                };

                                const file = res[0] as unknown as UploadResponse;
                                const url = file.url;
                                console.log("URL from response:", url);
                                setImageUrl(url);
                                toast.success("Image uploaded successfully via button");
                            }
                        }}
                        onUploadError={(error) => {
                            console.error("Upload error via button:", error);
                            toast.error(`Upload error: ${error.message}`);
                        }}
                    />
                </div>

                <div className="border p-4 rounded">
                    <h2 className="text-xl mb-4">UploadDropzone Test</h2>
                    <UploadDropzone
                        endpoint="categoryImage"
                        onClientUploadComplete={(res) => {
                            console.log("Upload completed via dropzone:", res);
                            if (res && res.length > 0) {
                                // Define type for upload response
                                type UploadResponse = {
                                    url?: string;
                                    fileUrl?: string;
                                    ufsUrl?: string;
                                    [key: string]: unknown;
                                };

                                // Use type assertion to avoid TypeScript errors
                                const file = res[0] as unknown as UploadResponse;
                                // Try to access both possible properties
                                const url = file.url || file.ufsUrl;
                                console.log("URL from response:", url);
                                setImageUrl(url);
                                toast.success("Image uploaded successfully via dropzone");
                            }
                        }}
                        onUploadError={(error) => {
                            console.error("Upload error via dropzone:", error);
                            toast.error(`Upload error: ${error.message}`);
                        }}
                    />
                </div>
            </div>

            {imageUrl && (
                <div className="mt-8">
                    <h2 className="text-xl mb-4">Uploaded Image</h2>
                    <div className="relative h-64 w-full max-w-md border rounded overflow-hidden">
                        <Image
                            src={imageUrl}
                            alt="Uploaded image"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <p className="mt-2 text-sm break-all">{imageUrl}</p>
                </div>
            )}
        </div>
    );
} 