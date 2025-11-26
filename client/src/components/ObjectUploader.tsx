import { useState } from "react";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { successful: Array<{ uploadURL: string }> }) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size
    if (file.size > maxFileSize) {
      alert(`File size must be less than ${maxFileSize / 1024 / 1024}MB`);
      return;
    }

    try {
      setUploading(true);
      
      // Get upload URL from backend
      const { url } = await onGetUploadParameters();
      
      // Upload file to presigned URL
      const response = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      // Call onComplete with upload URL
      onComplete?.({ successful: [{ uploadURL: url.split("?")[0] }] });
      
      // Clear the input
      e.target.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
        id="file-upload"
        data-testid="input-file-upload"
      />
      <label htmlFor="file-upload">
        <Button
          type="button"
          onClick={() => document.getElementById("file-upload")?.click()}
          className={buttonClassName}
          disabled={uploading}
          data-testid="button-upload-image"
        >
          {uploading ? "Uploading..." : children}
        </Button>
      </label>
    </div>
  );
}
