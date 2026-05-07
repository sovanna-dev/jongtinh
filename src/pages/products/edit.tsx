import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, InputNumber, Switch, Select, Space, Button, Divider } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { IProduct, ICategory } from "../../interfaces";

export const ProductEdit = () => {
    const { formProps, saveButtonProps, onFinish } = useForm<IProduct>();

    const { selectProps: categorySelectProps } = useSelect<ICategory>({
        resource: "categories",
        optionLabel: "name",
    });

    const handleOnFinish = (values: any) => {
        onFinish({
            ...values,
            nameLowercase: values.name.toLowerCase(),
            updatedAt: Date.now(),
            images: values.images || [],
            colors: values.colors || [],
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
                    label="Product Name"
                    name="name"
                    rules={[{ required: true }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Description"
                    name="description"
                    rules={[{ required: true }]}
                >
                    <Input.TextArea rows={4} />
                </Form.Item>

                <Space size="large">
                    <Form.Item
                        label="Price ($)"
                        name="price"
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} step={0.01} precision={2} />
                    </Form.Item>

                    <Form.Item
                        label="Discount Price ($)"
                        name="discountPrice"
                    >
                        <InputNumber min={0} step={0.01} precision={2} />
                    </Form.Item>

                    <Form.Item
                        label="Stock Quantity"
                        name="stockQuantity"
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} />
                    </Form.Item>
                </Space>

                <Form.Item
                    label="Category"
                    name="category"
                    rules={[{ required: true }]}
                >
                    <Select {...categorySelectProps} />
                </Form.Item>

                <Form.Item
                    label="Barcode"
                    name="barcode"
                >
                    <Input />
                </Form.Item>

                <Divider orientation="left">Media</Divider>
                <Form.Item label="Image URLs">
                    <Form.List name="images">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                                        <Form.Item
                                            {...restField}
                                            name={[name]}
                                            rules={[{ required: true, type: "url", message: "Please enter a valid image URL" }]}
                                        >
                                            <Input placeholder="https://example.com/image.png" style={{ width: 400 }} />
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Add Image URL
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Form.Item>

                <Divider orientation="left">Attributes</Divider>
                <Form.Item label="Colors (Hex Codes)">
                    <Form.List name="colors">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                                        <Form.Item
                                            {...restField}
                                            name={[name]}
                                            rules={[{ required: true, message: "Missing hex code" }]}
                                        >
                                            <Input placeholder="#FFFFFF" />
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Add Color
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Form.Item>

                <Form.Item
                    label="Is Available"
                    name="isAvailable"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>
            </Form>
        </Edit>
    );
};
