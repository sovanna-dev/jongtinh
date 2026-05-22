import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Switch, ColorPicker, Row, Col, Card } from "antd";
import { IStyle } from "../../interfaces";
import { CloudinaryUpload } from "../../components/CloudinaryUpload";

export const StyleCreate = () => {
    const { formProps, saveButtonProps, form } = useForm<IStyle>();

    const imageUrl = Form.useWatch("image", form);

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} form={form} layout="vertical">
                <Row gutter={24}>
                    <Col span={16}>
                        <Form.Item
                            label="Style Name (e.g., Acubi)"
                            name="name"
                            rules={[{ required: true }]}
                        >
                            <Input placeholder="Enter style name..." />
                        </Form.Item>
                        <Form.Item
                            label="Label (e.g., Cyber Aesthetic)"
                            name="label"
                            rules={[{ required: true }]}
                        >
                            <Input placeholder="Enter descriptive label..." />
                        </Form.Item>
                        <Form.Item
                            label="Image URL"
                            name="image"
                            rules={[{ required: true }]}
                        >
                            <Input placeholder="https://..." />
                        </Form.Item>
                        <Form.Item label="Upload Style Image">
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
                            initialValue="#FF006E"
                            getValueFromEvent={(color) => {
                                return typeof color === 'string' ? color : color.toHexString();
                            }}
                        >
                            <ColorPicker showText />
                        </Form.Item>
                        <Form.Item
                            label="Display Order"
                            name="order"
                            initialValue={0}
                        >
                            <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item
                            label="Is Active"
                            name="isActive"
                            valuePropName="checked"
                            initialValue={true}
                        >
                            <Switch />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Create>
    );
};
