import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Switch, ColorPicker, Row, Col, Card } from "antd";
import { IStyle } from "../../interfaces";
import { CloudinaryUpload } from "../../components/CloudinaryUpload";

export const StyleEdit = () => {
    const { formProps, saveButtonProps, form } = useForm<IStyle>();

    const imageUrl = Form.useWatch("image", form);

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} form={form} layout="vertical">
                <Row gutter={24}>
                    <Col span={16}>
                        <Form.Item
                            label="Style Name"
                            name="name"
                            rules={[{ required: true }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="Label"
                            name="label"
                            rules={[{ required: true }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="Image URL"
                            name="image"
                            rules={[{ required: true }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item label="Update Style Image">
                            <CloudinaryUpload
                                onUploadComplete={(url) => {
                                    form.setFieldsValue({ image: url });
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        {imageUrl && (
                            <Card
                                title="Image Preview"
                                cover={
                                    <img
                                        alt="Style Preview"
                                        src={imageUrl}
                                        style={{ height: 300, objectFit: "cover" }}
                                    />
                                }
                                style={{ marginBottom: 24 }}
                            />
                        )}
                        <Form.Item
                            label="Theme Color"
                            name="color"
                            getValueFromEvent={(color) => {
                                return typeof color === 'string' ? color : color.toHexString();
                            }}
                        >
                            <ColorPicker showText />
                        </Form.Item>
                        <Form.Item
                            label="Display Order"
                            name="order"
                        >
                            <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item
                            label="Is Active"
                            name="isActive"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Edit>
    );
};
