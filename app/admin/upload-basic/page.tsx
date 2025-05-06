"use client";

// Import directly from uploadthing/react
import { UploadButton, UploadDropzone } from "@uploadthing/react";
import { useState } from "react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import Image from "next/image";

export default function UploadBasicPage() {
    const [url, setUrl] = useState("");

    return (
        <div className="p-10">
            <h1 className="text-2xl font-semibold mb-6">Basic Upload Test</h1>

            <div className="space-y-4">
                <UploadButton<OurFileRouter, "categoryImage">
                    endpoint="categoryImage"
                    onClientUploadComplete={(res) => {
                        // console.log("Files: ", res);
                        if (res?.[0]?.url) {
                            setUrl(res[0].url);
                            alert("Upload completed successfully!");
                        }
                    }}
                    onUploadError={(error: Error) => {
                        console.error("Error: ", error);
                        alert(`ERROR! ${error.message}`);
                    }}
                />

                <div className="h-px w-full bg-gray-200 my-4"></div>

                <UploadDropzone<OurFileRouter, "categoryImage">
                    endpoint="categoryImage"
                    onClientUploadComplete={(res) => {
                        // console.log("Files: ", res);
                        if (res?.[0]?.url) {
                            setUrl(res[0].url);
                            alert("Upload completed successfully!");
                        }
                    }}
                    onUploadError={(error: Error) => {
                        console.error("Error: ", error);
                        alert(`ERROR! ${error.message}`);
                    }}
                />
            </div>

            {url && (
                <div className="mt-4 p-4 border rounded-md">
                    <p className="mb-2 font-semibold">Uploaded URL:</p>
                    <p className="text-sm break-all">{url}</p>
                    <div className="mt-2 border h-64 w-64 relative">
                        <Image src={url} alt="Uploaded" className="object-contain w-full h-full" width={256} height={256} />
                    </div>
                </div>
            )}
        </div>
    );
} 