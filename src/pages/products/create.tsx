import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, InputNumber, Switch, Select, Space, Button, Divider } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { IProduct, ICategory } from "../../interfaces";

export const ProductCreate = () => {
    const { formProps, saveButtonProps, onFinish } = useForm<IProduct>();

    const { selectProps: categorySelectProps } = useSelect<ICategory>({
        resource: "categories",
        optionLabel: "name",
    });

    const handleOnFinish = (values: any) => {
        onFinish({
            ...values,
            nameLowercase: values.name.toLowerCase(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            rating: values.rating || 0,
            reviewCount: values.reviewCount || 0,
            images: values.images || [],
            colors: values.colors || [],
            specifications: values.specifications
                ? values.specifications.reduce((acc: any, item: any) => {
                      if (item.key && item.value) {
                          acc[item.key] = item.value;
                      }
                      return acc;
                  }, {})
                : {},
        });
    };

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form
                {...formProps}
                layout="vertical"
                onFinish={handleOnFinish}
                initialValues={{
                    isAvailable: true,
                    rating: 0,
                    reviewCount: 0,
                    stockQuantity: 0,
                }}
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

                <Space size="large" wrap>
                    <Form.Item
                        label="Price ($)"
                        name="price"
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} step={0.01} precision={2} style={{ width: 150 }} />
                    </Form.Item>

                    <Form.Item
                        label="Discount Price ($)"
                        name="discountPrice"
                    >
                        <InputNumber min={0} step={0.01} precision={2} style={{ width: 150 }} />
                    </Form.Item>

                    <Form.Item
                        label="Stock Quantity"
                        name="stockQuantity"
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} style={{ width: 120 }} />
                    </Form.Item>
                </Space>

                <Form.Item
                    label="Category"
                    name="category"
                    rules={[{ required: true }]}
                >
                    <Select {...categorySelectProps} />
                </Form.Item>

                <Form.Item label="Barcode" name="barcode">
                    <Input />
                </Form.Item>

                <Space size="large" wrap>
                    <Form.Item label="Rating" name="rating">
                        <InputNumber min={0} max={5} step={0.1} style={{ width: 100 }} />
                    </Form.Item>

                    <Form.Item label="Review Count" name="reviewCount">
                        <InputNumber min={0} style={{ width: 100 }} />
                    </Form.Item>
                </Space>

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
                                            <Input placeholder="#C62828" style={{ width: 200 }} />
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Add Color (Hex)
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Form.Item>

                <Divider orientation="left">Specifications</Divider>

                <Form.Item label="Specifications">
                    <Form.List name="specifications">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                                        <Form.Item
                                            {...restField}
                                            name={[name, "key"]}
                                            rules={[{ required: true, message: "Spec name required" }]}
                                        >
                                            <Input placeholder="Material" style={{ width: 180 }} />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, "value"]}
                                            rules={[{ required: true, message: "Spec value required" }]}
                                        >
                                            <Input placeholder="100% Silk" style={{ width: 220 }} />
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Add Specification
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
        </Create>
    );
};