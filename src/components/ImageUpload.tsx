import React from "react";
import { Upload, message } from "antd";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons";
import { useFirebaseUpload } from "../hooks/useFirebaseUpload";

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  path: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, path }) => {
  const { uploadFile, isLoading } = useFirebaseUpload();

  const handleChange = async (info: any) => {
    if (info.file.status === "uploading") {
      return;
    }
    if (info.file.originFileObj) {
      try {
        const url = await uploadFile(info.file.originFileObj, path);
        onChange?.(url);
        message.success("Image uploaded successfully");
      } catch (error) {
        message.error("Image upload failed");
      }
    }
  };

  const uploadButton = (
    <div>
      {isLoading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <Upload
      name="avatar"
      listType="picture-card"
      className="avatar-uploader"
      showUploadList={false}
      beforeUpload={() => true}
      customRequest={({ onSuccess }) => {
          if (onSuccess) onSuccess("ok");
      }}
      onChange={handleChange}
    >
      {value ? (
        <img src={value} alt="avatar" style={{ width: "100%" }} />
      ) : (
        uploadButton
      )}
    </Upload>
  );
};
