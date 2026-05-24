import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Switch, ColorPicker, Row, Col, Card, Divider, Space, Button, Image } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { IStyle } from "../../interfaces";
import { CloudinaryUpload } from "../../components/CloudinaryUpload";

export const StyleCreate = () => {
    const { formProps, saveButtonProps, form, onFinish } = useForm<IStyle>();

    const imageUrl = Form.useWatch("image", form);
    const bannerUrl = Form.useWatch("bannerImage", form);

    const handleOnFinish = (values: any) => {
        const name = values.name || "";
        onFinish({
            ...values,
            slug: name.toLowerCase().replace(/\s+/g, "_"),
            color: typeof values.color === "string" ? values.color : values.color?.toHexString() || "#FF006E",
            gallery: values.gallery || [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    };

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} form={form} layout="vertical" onFinish={handleOnFinish}>
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
                            label="Display Title (e.g., Acubi Style)"
                            name="title"
                            rules={[{ required: true }]}
                        >
                            <Input placeholder="Enter display title..." />
                        </Form.Item>
                        <Form.Item
                            label="Label (e.g., Cyber Aesthetic)"
                            name="label"
                            rules={[{ required: true }]}
                        >
                            <Input placeholder="Enter descriptive label..." />
                        </Form.Item>
                        <Form.Item label="Description" name="description" rules={[{ required: true }]}>
                            <Input.TextArea rows={3} placeholder="Describe this style collection..." />
                        </Form.Item>

                        <Divider orientation="left">Media</Divider>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Home Tag Image URL"
                                    name="image"
                                    rules={[{ required: true }]}
                                >
                                    <Input placeholder="https://..." />
                                </Form.Item>
                                <Form.Item label="Upload Home Tag Image">
                                    <CloudinaryUpload
                                        onUploadComplete={(url) => {
                                            form.setFieldsValue({ image: url });
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Banner Image URL"
                                    name="bannerImage"
                                    rules={[{ required: true }]}
                                >
                                    <Input placeholder="https://..." />
                                </Form.Item>
                                <Form.Item label="Upload Banner Image">
                                    <CloudinaryUpload
                                        onUploadComplete={(url) => {
                                            form.setFieldsValue({ bannerImage: url });
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider orientation="left">Lifestyle Gallery (6 images)</Divider>

                        <Form.Item label="Gallery Images">
                            <Form.List name="gallery">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="center">
                                                <Form.Item {...restField} name={[name]} rules={[{ required: true, type: "url" }]}>
                                                    <Input placeholder="https://example.com/gallery1.jpg" style={{ width: 400 }} />
                                                </Form.Item>
                                                {form.getFieldValue(["gallery", name]) && (
                                                    <Image src={form.getFieldValue(["gallery", name])} width={40} height={40} style={{ objectFit: "cover", borderRadius: 6 }} />
                                                )}
                                                <MinusCircleOutlined onClick={() => remove(name)} />
                                            </Space>
                                        ))}
                                        {fields.length < 6 && (
                                            <Form.Item>
                                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                    Add Gallery Image ({fields.length}/6)
                                                </Button>
                                            </Form.Item>
                                        )}
                                    </>
                                )}
                            </Form.List>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        {bannerUrl && (
                            <Card
                                title="Hero Banner Preview"
                                cover={
                                    <img
                                        alt="Banner Preview"
                                        src={bannerUrl}
                                        style={{ height: 180, objectFit: "cover" }}
                                    />
                                }
                                style={{ marginBottom: 24 }}
                            >
                                <Card.Meta description="This banner appears at the top of the collection page." />
                            </Card>
                        )}
                        {imageUrl && (
                            <Card
                                title="Home Tag Preview"
                                cover={
                                    <img
                                        alt="Style Preview"
                                        src={imageUrl}
                                        style={{ height: 150, objectFit: "cover" }}
                                    />
                                }
                                style={{ marginBottom: 24 }}
                            >
                                <Card.Meta description="Small square tag shown on the homepage grid." />
                            </Card>
                        )}
                        <Form.Item
                            label="Theme Color"
                            name="color"
                            initialValue="#FF006E"
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
