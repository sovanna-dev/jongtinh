import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Switch, ColorPicker, Divider, Image, Space } from "antd";
import { IPromotionBanner } from "../../interfaces";
import { CloudinaryUpload } from "../../components/CloudinaryUpload";

export const BannerEdit = () => {
    const { formProps, saveButtonProps, onFinish, form, query } = useForm<IPromotionBanner>();
    const bannerData = query?.data?.data;

    const handleOnFinish = (values: any) => {
        onFinish({
            ...values,
            backgroundColor: typeof values.backgroundColor === 'string'
                ? values.backgroundColor
                : values.backgroundColor?.toHexString() || values.backgroundColor,
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

                {/* Current Image Preview */}
                {bannerData?.imageUrl && (
                    <Form.Item label="Current Image">
                        <Space direction="vertical">
                            <Image
                                src={bannerData.imageUrl}
                                width={200}
                                fallback="https://via.placeholder.com/200x100?text=No+Image"
                                style={{ borderRadius: 8 }}
                            />
                        </Space>
                    </Form.Item>
                )}

                {/* Cloudinary Upload */}
                <Form.Item label="Upload New Banner Image">
                    <CloudinaryUpload
                        onUploadComplete={(url) => {
                            form.setFieldValue("imageUrl", url);
                            form.validateFields(["imageUrl"]);
                        }}
                    />
                </Form.Item>

                {/* Manual URL Input */}
                <Form.Item
                    label="Or Update Image URL"
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
                    <Input placeholder="smartshop://product/123" />
                </Form.Item>
                <Form.Item
                    label="Background Color"
                    name="backgroundColor"
                >
                    <ColorPicker showText />
                </Form.Item>
                <Form.Item
                    label="Is Active"
                    name="isActive"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>
            </Form>
        </Edit>
    );
};