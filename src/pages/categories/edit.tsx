import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Divider, Image, Space } from "antd";
import { ICategory } from "../../interfaces";
import { CloudinaryUpload } from "../../components/CloudinaryUpload";

export const CategoryEdit = () => {
    const { formProps, saveButtonProps, onFinish, form, query } = useForm<ICategory>();
    const categoryData = query?.data?.data;

    const handleOnFinish = (values: any) => {
        onFinish({
            ...values,
            nameLowercase: values.name.toLowerCase(),
            updatedAt: Date.now(),
        });
    };

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form
                {...formProps}
                layout="vertical"
                onFinish={handleOnFinish}
            >
                <Form.Item
                    label="Category Name"
                    name="name"
                    rules={[{ required: true }]}
                >
                    <Input />
                </Form.Item>

                <Divider orientation="left">Category Icon</Divider>

                {/* Current Icon Preview */}
                {categoryData?.icon && (
                    <Form.Item label="Current Icon">
                        <Space direction="vertical">
                            <Image
                                src={categoryData.icon}
                                width={100}
                                fallback="https://via.placeholder.com/100?text=No+Icon"
                                style={{ borderRadius: 8 }}
                            />
                        </Space>
                    </Form.Item>
                )}

                {/* Cloudinary Upload */}
                <Form.Item label="Upload New Icon Image">
                    <CloudinaryUpload
                        onUploadComplete={(url) => {
                            form.setFieldValue("icon", url);
                            form.validateFields(["icon"]);
                        }}
                    />
                </Form.Item>

                {/* Manual URL Input */}
                <Form.Item
                    label="Or Update Icon URL"
                    name="icon"
                    rules={[{ required: true, type: "url", message: "Please enter a valid image URL" }]}
                >
                    <Input placeholder="https://example.com/icon.png" />
                </Form.Item>

                <Form.Item
                    label="Product Count"
                    name="productCount"
                >
                    <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
            </Form>
        </Edit>
    );
};