import { Edit, useForm, useSelect } from "@refinedev/antd";
import { useUpdate, useOne } from "@refinedev/core";
import { Form, Input, InputNumber, Switch, Select, Space, Button, Divider, Modal, message } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { IProduct, ICategory } from "../../interfaces";
import { ProductImageList } from "../../components/ProductImageList";

export const ProductEdit = () => {
    const { formProps, saveButtonProps, query: queryResult, onFinish } = useForm<IProduct>();
    const { mutate: updateCategory } = useUpdate();

    const [isSubCategoryModalVisible, setIsSubCategoryModalVisible] = useState(false);
    const [newSubCategoryName, setNewSubCategoryName] = useState("");
    const [isSubmittingSubCategory, setIsSubmittingSubCategory] = useState(false);

    const productData = queryResult?.data?.data;

    const { selectProps: categorySelectProps } = useSelect<ICategory>({
        resource: "categories",
        optionLabel: "name",
    });

    const selectedCategoryId = Form.useWatch("category", formProps.form);

    const { query: categoryQuery } = useOne<ICategory>({
        resource: "categories",
        id: selectedCategoryId,
        queryOptions: {
            enabled: !!selectedCategoryId,
        },
    });

    const currentCategory = categoryQuery.data?.data;

    const subCategoryOptions = useMemo(() => {
        return currentCategory?.subCategories?.map((sub: any) => ({
            label: sub.name,
            value: sub.id,
        })) || [];
    }, [currentCategory]);

    const handleAddSubCategory = async () => {
        if (!newSubCategoryName.trim() || !selectedCategoryId || !currentCategory) return;

        setIsSubmittingSubCategory(true);
        const subCategoryId = newSubCategoryName.toLowerCase().trim().replace(/\s+/g, "_");

        if (currentCategory.subCategories?.some((sub: any) => sub.id === subCategoryId)) {
            message.error("Subcategory already exists");
            setIsSubmittingSubCategory(false);
            return;
        }

        const updatedSubCategories = [
            ...(currentCategory.subCategories || []),
            { id: subCategoryId, name: newSubCategoryName.trim() }
        ];

        updateCategory({
            resource: "categories",
            id: selectedCategoryId,
            values: {
                subCategories: updatedSubCategories
            },
            successNotification: {
                message: "Subcategory created successfully",
                type: "success"
            }
        }, {
            onSuccess: () => {
                setIsSubmittingSubCategory(false);
                setIsSubCategoryModalVisible(false);
                setNewSubCategoryName("");
                formProps.form?.setFieldValue("subCategory", subCategoryId);
            },
            onError: () => {
                setIsSubmittingSubCategory(false);
                message.error("Failed to create subcategory");
            }
        });
    };

    // Transform maps to arrays for Form.List
    useEffect(() => {
        if (productData) {
            const specifications = productData.specifications
                ? Object.entries(productData.specifications).map(([key, value]) => ({ key, value }))
                : [];

            const attributes = productData.attributes
                ? Object.entries(productData.attributes).map(([key, value]) => ({ key, value }))
                : [];

            formProps.form?.setFieldsValue({
                specifications,
                attributes,
            });
        }
    }, [productData, formProps.form]);

    const handleOnFinish = (values: any) => {
        onFinish({
            ...values,
            nameLowercase: values.name.toLowerCase(),
            updatedAt: Date.now(),
            specifications: values.specifications
                ? values.specifications.reduce((acc: any, item: any) => {
                      if (item.key && item.value) acc[item.key] = item.value;
                      return acc;
                  }, {})
                : {},
            attributes: values.attributes
                ? values.attributes.reduce((acc: any, item: any) => {
                      if (item.key && item.value) acc[item.key] = item.value;
                      return acc;
                  }, {})
                : {},
        });
    };

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form
                {...formProps}
                layout="vertical"
                onFinish={handleOnFinish}
            >
                <Form.Item label="Product Name" name="name" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>

                <Form.Item label="Description" name="description" rules={[{ required: true }]}>
                    <Input.TextArea rows={4} />
                </Form.Item>

                <Space size="large" wrap>
                    <Form.Item label="Price ($)" name="price" rules={[{ required: true }]}>
                        <InputNumber min={0} step={0.01} precision={2} style={{ width: 150 }} />
                    </Form.Item>

                    <Form.Item label="Discount Price ($)" name="discountPrice">
                        <InputNumber min={0} step={0.01} precision={2} style={{ width: 150 }} />
                    </Form.Item>

                    <Form.Item label="Stock Quantity" name="stockQuantity" rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: 120 }} />
                    </Form.Item>
                </Space>

                <Form.Item label="Category" name="category" rules={[{ required: true }]}>
                    <Select {...categorySelectProps} />
                </Form.Item>

                <Form.Item label="Subcategory" name="subCategory">
                    <Select
                        placeholder="Select Subcategory"
                        options={subCategoryOptions}
                        disabled={!selectedCategoryId}
                        allowClear
                        popupRender={(menu) => (
                            <>
                                {menu}
                                <Divider style={{ margin: "8px 0" }} />
                                <Space style={{ padding: "0 8px 4px" }}>
                                    <Button
                                        type="text"
                                        icon={<PlusOutlined />}
                                        onClick={() => {
                                            if (selectedCategoryId && currentCategory) {
                                                setIsSubCategoryModalVisible(true);
                                            } else {
                                                message.warning("Please select a valid category first");
                                            }
                                        }}
                                        disabled={!selectedCategoryId}
                                    >
                                        Add new subcategory
                                    </Button>
                                </Space>
                            </>
                        )}
                    />
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
                                        <Form.Item {...restField} name={[name]} rules={[{ required: true }]}>
                                            <Input placeholder="#C62828" style={{ width: 200 }} />
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Color</Button>
                            </>
                        )}
                    </Form.List>
                </Form.Item>

                <Divider orientation="left">Specifications</Divider>
                <Form.List name="specifications">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                                    <Form.Item {...restField} name={[name, "key"]} rules={[{ required: true }]}>
                                        <Input placeholder="Key" />
                                    </Form.Item>
                                    <Form.Item {...restField} name={[name, "value"]} rules={[{ required: true }]}>
                                        <Input placeholder="Value" />
                                    </Form.Item>
                                    <MinusCircleOutlined onClick={() => remove(name)} />
                                </Space>
                            ))}
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Specification</Button>
                        </>
                    )}
                </Form.List>

                <Divider orientation="left">Attributes (Size, etc.)</Divider>
                <Form.List name="attributes">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                                    <Form.Item {...restField} name={[name, "key"]} rules={[{ required: true }]}>
                                        <Input placeholder="Key" />
                                    </Form.Item>
                                    <Form.Item {...restField} name={[name, "value"]} rules={[{ required: true }]}>
                                        <Input placeholder="Value" />
                                    </Form.Item>
                                    <MinusCircleOutlined onClick={() => remove(name)} />
                                </Space>
                            ))}
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Attribute</Button>
                        </>
                    )}
                </Form.List>

                <Form.Item label="Is Available" name="isAvailable" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Form>

            <Modal
                title="Add New Subcategory"
                open={isSubCategoryModalVisible}
                onOk={handleAddSubCategory}
                onCancel={() => setIsSubCategoryModalVisible(false)}
                confirmLoading={isSubmittingSubCategory}
                okText="Create"
                destroyOnHidden
            >
                <div style={{ marginBottom: 16 }}>
                    <p>Adding subcategory to: <b>{currentCategory?.name}</b></p>
                </div>
                <Input
                    placeholder="Enter subcategory name"
                    value={newSubCategoryName}
                    onChange={(e) => setNewSubCategoryName(e.target.value)}
                    onPressEnter={handleAddSubCategory}
                    autoFocus
                />
            </Modal>
        </Edit>
    );
};
