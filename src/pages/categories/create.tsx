import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Divider, Image, Space } from "antd";
import { ICategory } from "../../interfaces";
import { CloudinaryUpload } from "../../components/CloudinaryUpload";

export const CategoryCreate = () => {
    const { formProps, saveButtonProps, onFinish, form } = useForm<ICategory>();

    const handleOnFinish = (values: any) => {
        onFinish({
            ...values,
            nameLowercase: values.name.toLowerCase(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            productCount: values.productCount || 0,
        });
    };

    return (
        <Create saveButtonProps={saveButtonProps}>
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
                    <Input placeholder="e.g. Electronics" />
                </Form.Item>

                <Divider orientation="left">Category Icon</Divider>

                {/* Cloudinary Upload */}
                <Form.Item label="Upload Icon Image">
                    <CloudinaryUpload
                        onUploadComplete={(url) => {
                            form.setFieldValue("icon", url);
                            form.validateFields(["icon"]);
                        }}
                    />
                </Form.Item>

                {/* Manual URL Input */}
                <Form.Item
                    label="Or Paste Icon URL"
                    name="icon"
                    rules={[{ required: true, type: "url", message: "Please enter a valid image URL" }]}
                >
                    <Input placeholder="https://example.com/icon.png" />
                </Form.Item>

                <Form.Item
                    label="Product Count"
                    name="productCount"
                    initialValue={0}
                >
                    <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
            </Form>
        </Create>
    );
};