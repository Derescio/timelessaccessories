"use client";

import { useState } from "react";
import { UploadButton } from "@uploadthing/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import Image from "next/image";

// Define a custom type that matches what we expect from the server
type UploadResponse = {
    fileUrl?: string;
    url?: string;
    [key: string]: unknown;
};

export default function UploadThingTest() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="container mx-auto py-10">
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Simple UploadThing Test</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <UploadButton<OurFileRouter, "categoryImage">
                            endpoint="categoryImage"
                            onClientUploadComplete={(res) => {
                                setError(null);
                                console.log("Upload completed:", res);

                                // Debug output
                                if (res && res.length > 0) {
                                    // Use type assertion for the response
                                    const file = res[0] as unknown as UploadResponse;
                                    console.log("Response data:", file);

                                    // Extract URL from response using our custom type
                                    const url = file.fileUrl || file.url;

                                    if (url) {
                                        console.log("Image URL:", url);
                                        setImageUrl(url);
                                    } else {
                                        console.error("No URL found in response");
                                        setError("Upload succeeded but no URL was returned");
                                    }
                                } else {
                                    console.error("No files in response");
                                    setError("No files were returned from the upload");
                                }
                            }}
                            onUploadError={(error) => {
                                console.error("Upload error:", error);
                                setError(error.message);
                            }}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                            Error: {error}
                        </div>
                    )}

                    {imageUrl && (
                        <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Uploaded Image:</p>
                            <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-md border">
                                <Image
                                    src={imageUrl}
                                    alt="Uploaded image"
                                    className="object-cover h-full w-full"
                                    width={200}
                                    height={200}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 break-all">{imageUrl}</p>
                        </div>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setImageUrl(null);
                            setError(null);
                        }}
                    >
                        Reset
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
} 