// import { UploadButton as UTUploadButton } from "@uploadthing/react";
// import { OurFileRouter } from "@/app/api/uploadthing/core";

// interface UploadButtonProps {
//     endpoint: keyof OurFileRouter;
//     onUploadComplete?: (urls: string[]) => void;
//     onUploadError?: (error: Error) => void;
// }

// export function UploadButton({
//     endpoint,
//     onUploadComplete,
//     onUploadError,
// }: UploadButtonProps) {
//     return (
//         <UTUploadButton<OurFileRouter>
//             endpoint={endpoint}
//             onClientUploadComplete={(res) => {
//                 if (res && onUploadComplete) {
//                     const urls = res.map((file) => file.url);
//                     onUploadComplete(urls);
//                 }
//             }}
//             onUploadError={(error: Error) => {
//                 console.error("Upload error:", error);
//                 onUploadError?.(error);
//             }}
//         />
//     );
// } 