"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

interface FileUploadResponse {
    url: string;
    name: string;
    size: number;
}

interface FileUploadError {
    message: string;
}

export default function UploadTest() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setError("");
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError("Please select a file first");
            return;
        }

        setIsUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const response = await fetch("/api/uploadthing", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const data = (await response.json()) as FileUploadResponse;
            setUploadedFileUrl(data.url);
        } catch (err) {
            const error = err as FileUploadError;
            setError(error.message || "An error occurred during upload");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <Input type="file" onChange={handleFileChange} />
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                {isUploading ? "Uploading..." : "Upload"}
            </Button>
            {error && <p className="text-red-500">{error}</p>}
            {uploadedFileUrl && (
                <div>
                    <p>File uploaded successfully!</p>
                    <Image
                        src={uploadedFileUrl}
                        alt="Uploaded file"
                        className="mt-4 max-w-sm"
                        width={300}
                        height={300}
                    />
                </div>
            )}
        </div>
    );
} 