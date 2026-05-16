import { useState } from "react";
import { Upload, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";

const { Dragger } = Upload;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;

interface CloudinaryUploadProps {
    onUploadComplete: (url: string) => void;
}

export const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({ onUploadComplete }) => {
    const [uploading, setUploading] = useState(false);

    const uploadProps: UploadProps = {
        name: "file",
        multiple: false,
        showUploadList: false,
        beforeUpload: (file) => {
            if (!ALLOWED_TYPES.includes(file.type)) {
                message.error("Only JPG, PNG, WEBP, and GIF images are allowed.");
                return Upload.LIST_IGNORE;
            }
            if (file.size / 1024 / 1024 > MAX_SIZE_MB) {
                message.error(`Image must be smaller than ${MAX_SIZE_MB}MB.`);
                return Upload.LIST_IGNORE;
            }
            return true;
        },
        customRequest: async ({ file, onSuccess, onError }: any) => {
            setUploading(true);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
            formData.append("folder", "products");

            try {
                const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
                const response = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                    { method: "POST", body: formData }
                );

                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.secure_url) {
                    onUploadComplete(data.secure_url);
                    onSuccess(data, file);
                    message.success("Image uploaded successfully!");
                } else {
                    throw new Error("No secure_url in Cloudinary response");
                }
            } catch (error: any) {
                onError(error);
                message.error("Upload failed. Please try again.");
            } finally {
                setUploading(false);
            }
        },
        accept: "image/*",
    };

    return (
        <Dragger {...uploadProps} disabled={uploading} style={{ padding: "8px" }}>
            <p className="ant-upload-drag-icon">
                <InboxOutlined />
            </p>
            <p className="ant-upload-text">
                {uploading ? "Uploading..." : "Click or drag image to upload"}
            </p>
            <p className="ant-upload-hint">JPG, PNG, WEBP, GIF · Max {MAX_SIZE_MB}MB</p>
        </Dragger>
    );
};