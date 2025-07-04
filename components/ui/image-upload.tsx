import { useState } from "react";
import { UploadButton } from "@/lib/uploadthing";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

// Define interface for upload response file
interface UploadResponseFile {
    ufsUrl?: string;
    url?: string;
    fileUrl?: string;
    [key: string]: unknown;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);

    return (
        <div className="space-y-4">
            {value && value !== "/images/placeholder.svg" && (
                <div className="relative aspect-square rounded-md overflow-hidden border">
                    <Image
                        src={value}
                        alt="Uploaded image"
                        className="w-full h-full object-cover"
                        width={256}
                        height={256}
                    />
                </div>
            )}
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-4">
                <UploadButton
                    endpoint="categoryImage"
                    onBeforeUploadBegin={(files) => {
                        setIsUploading(true);
                        return files;
                    }}
                    onClientUploadComplete={(res) => {
                        if (res && res.length > 0) {
                            const file = res[0] as unknown as UploadResponseFile;
                            const url = file.ufsUrl || file.url || file.fileUrl;

                            if (url) {
                                onChange(url);
                                toast.success("Image uploaded successfully");
                            } else {
                                toast.error("Failed to get image URL from upload");
                            }
                        } else {
                            toast.error("Upload failed: Empty response");
                        }
                        setIsUploading(false);
                    }}
                    onUploadError={(error) => {
                        setIsUploading(false);
                        toast.error(`Upload failed: ${error.message}`);
                    }}
                    content={{
                        button({ isUploading }) {
                            return (
                                <div className="ut-button:bg-primary ut-button:text-white ut-button:hover:bg-primary/90">
                                    {isUploading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Uploading...
                                        </div>
                                    ) : (
                                        "Upload Image"
                                    )}
                                </div>
                            );
                        }
                    }}
                    disabled={disabled || isUploading}
                />
            </div>
        </div>
    );
} 