import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, InputNumber, Switch, Select, Space, Button, Divider } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useMemo } from "react";
import { IProduct, ICategory } from "../../interfaces";
import { ProductImageList } from "../../components/ProductImageList";

export const ProductEdit = () => {
    const { formProps, saveButtonProps, onFinish, query } = useForm<IProduct>();

    const { selectProps: categorySelectProps } = useSelect<ICategory>({
        resource: "categories",
        optionLabel: "name",
    });

    // Convert specifications from Firestore object { key: value } to
    // Form.List array [{ key, value }] — only recomputed when data changes
    const initialValues = useMemo(() => {
        const data = query?.data?.data;
        if (!data) return formProps.initialValues;

        const specifications = data.specifications
            ? Object.entries(data.specifications).map(([key, value]) => ({ key, value }))
            : [];

        const attributes = data.attributes
            ? Object.entries(data.attributes).map(([key, value]) => ({ key, value }))
            : [];

        return {
            ...formProps.initialValues,
            specifications,
            attributes,
        };
    }, [query?.data?.data]);

    const handleOnFinish = (values: any) => {
        onFinish({
            ...values,
            nameLowercase: values.name.toLowerCase(),
            updatedAt: Date.now(),
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
            attributes: values.attributes
                ? values.attributes.reduce((acc: any, item: any) => {
                      if (item.key && item.value) {
                          acc[item.key] = item.value;
                      }
                      return acc;
                  }, {})
                : {},
        });
    };

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form
                {...formProps}
                initialValues={initialValues}
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
                        rules={[{
                            validator(_, value) {
                                if (value == null || value === "") return Promise.resolve();
                                const price = formProps?.form?.getFieldValue("price");
                                if (price != null && value >= price) {
                                    return Promise.reject(new Error("Discount price must be less than the original price"));
                                }
                                return Promise.resolve();
                            },
                        }]}
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

                <Form.Item label="Product Images">
                    <ProductImageList />
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

                <Divider orientation="left">Attributes (Size, Fit, Material...)</Divider>

                <Form.Item label="Attributes">
                    <Form.List name="attributes">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                                        <Form.Item
                                            {...restField}
                                            name={[name, "key"]}
                                            rules={[{ required: true, message: "Attribute name required" }]}
                                        >
                                            <Input placeholder="Size" style={{ width: 180 }} />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, "value"]}
                                            rules={[{ required: true, message: "Value required" }]}
                                        >
                                            <Input placeholder="S, M, L, XL" style={{ width: 220 }} />
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Add Attribute
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