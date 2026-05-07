import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Switch, ColorPicker } from "antd";
import { IPromotionBanner } from "../../interfaces";

export const BannerEdit = () => {
    const { formProps, saveButtonProps, onFinish } = useForm<IPromotionBanner>();

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
                <Form.Item
                    label="Image URL"
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
