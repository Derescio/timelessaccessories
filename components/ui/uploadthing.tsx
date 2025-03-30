"use client";

import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { getFileUrl } from "@/lib/uploadthing";

// Export components generated for your UploadThing file routes
export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

// Custom styled UploadButton with better UI
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UploadCloud } from "lucide-react";
import Image from "next/image";

// Define a type that's more specific than 'any' but flexible enough to handle the response
type UploadResult = unknown[];

interface FileUploaderProps {
    endpoint: keyof OurFileRouter;
    onClientUploadComplete?: (res: UploadResult) => void;
    onUploadError?: (error: Error) => void;
    onChange?: (url?: string) => void;
    value?: string;
    onError?: (error: Error) => void;
    className?: string;
    buttonText?: string;
    onUploadBegin?: () => void;
}

export function FileUploader({
    endpoint,
    onClientUploadComplete,
    onUploadError,
    onChange,
    value,
    onError,
    className,
    buttonText = "Upload Image",
    onUploadBegin
}: FileUploaderProps) {
    return (
        <div className={cn("flex flex-col items-center gap-2", className)}>
            <UploadButton
                endpoint={endpoint}
                onUploadBegin={() => {
                    console.log("Upload starting...");
                    onUploadBegin?.();
                }}
                onClientUploadComplete={(res) => {
                    onChange?.(getFileUrl(res));
                    onClientUploadComplete?.(res);
                }}
                onUploadError={(error: Error) => {
                    onError?.(error);
                    onUploadError?.(error);
                }}
                content={{
                    button({ isUploading }) {
                        return (
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isUploading}
                                className="flex items-center gap-2"
                            >
                                <UploadCloud className="h-4 w-4" />
                                {isUploading ? "Uploading..." : buttonText}
                            </Button>
                        );
                    },
                }}
            />
            {value && (
                <div className="mt-2 rounded-md overflow-hidden border">
                    <Image
                        src={value}
                        alt="Uploaded image"
                        className="h-40 w-full object-cover"
                        width={256}
                        height={256}
                    />
                </div>
            )}
        </div>
    );
}

// Image uploader with Dropzone
interface ImageUploaderProps {
    endpoint: keyof OurFileRouter;
    onClientUploadComplete?: (res: UploadResult) => void;
    onUploadError?: (error: Error) => void;
    onChange?: (url?: string) => void;
    value?: string;
    onError?: (error: Error) => void;
    className?: string;
    dropzoneText?: string;
}

export function ImageUploader({
    endpoint,
    onClientUploadComplete,
    onUploadError,
    onChange,
    value,
    onError,
    className,
    dropzoneText = "Click or drag image to upload"
}: ImageUploaderProps) {
    return (
        <div className={cn("space-y-4 w-full", className)}>
            {value ? (
                <div className="relative w-full h-52 rounded-md overflow-hidden border">
                    <Image
                        src={value}
                        alt="Uploaded image"
                        className="h-full w-full object-cover"
                        width={256}
                        height={256}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                        <Button
                            variant="secondary"
                            onClick={() => onChange?.(undefined)}
                            size="sm"
                        >
                            Replace
                        </Button>
                    </div>
                </div>
            ) : (
                <UploadDropzone
                    endpoint={endpoint}
                    onClientUploadComplete={(res) => {
                        onChange?.(getFileUrl(res));
                        onClientUploadComplete?.(res);
                    }}
                    onUploadError={(error: Error) => {
                        onError?.(error);
                        onUploadError?.(error);
                    }}
                    content={{
                        label: dropzoneText,
                    }}
                    className="ut-label:text-sm ut-allowed-content:text-xs border-dashed border-2 ut-uploading:border-blue-500 ut-button:hidden"
                />
            )}
        </div>
    );
} 