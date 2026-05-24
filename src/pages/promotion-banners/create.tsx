import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Switch, ColorPicker, Divider } from "antd";
import { IPromotionBanner } from "../../interfaces";
import { CloudinaryUpload } from "../../components/CloudinaryUpload";

export const BannerCreate = () => {
    const { formProps, saveButtonProps, onFinish, form } = useForm<IPromotionBanner>();

    const handleOnFinish = (values: any) => {
        onFinish({
            ...values,
            backgroundColor: typeof values.backgroundColor === 'string'
                ? values.backgroundColor
                : values.backgroundColor?.toHexString() || "#FF6200",
            createdAt: Date.now(),
            updatedAt: Date.now(),
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
                    label="Title"
                    name="title"
                    rules={[{ required: true }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Subtitle"
                    name="subtitle"
                    rules={[{ required: true }]}
                >
                    <Input />
                </Form.Item>

                <Divider orientation="left">Banner Image</Divider>

                {/* Cloudinary Upload */}
                <Form.Item label="Upload Banner Image">
                    <CloudinaryUpload
                        onUploadComplete={(url) => {
                            form.setFieldValue("imageUrl", url);
                            form.validateFields(["imageUrl"]);
                        }}
                    />
                </Form.Item>

                {/* Manual URL Input */}
                <Form.Item
                    label="Or Paste Image URL"
                    name="imageUrl"
                    rules={[{ required: true, type: "url", message: "Please enter a valid image URL" }]}
                >
                    <Input placeholder="https://example.com/banner.png" />
                </Form.Item>

                <Form.Item
                    label="Action URL (Deep link)"
                    name="actionUrl"
                    rules={[{ required: true }]}
                >
                    <Input placeholder="e.g. smartshop://product/123" />
                </Form.Item>
                <Form.Item
                    label="Background Color"
                    name="backgroundColor"
                    initialValue="#FF6200"
                >
                    <ColorPicker showText />
                </Form.Item>
                <Form.Item
                    label="Is Active"
                    name="isActive"
                    valuePropName="checked"
                    initialValue={true}
                >
                    <Switch />
                </Form.Item>
            </Form>
        </Create>
    );
};