import { Create, useForm, useSelect } from "@refinedev/antd";
import { useUpdate, useOne } from "@refinedev/core";
import { Form, Input, InputNumber, Switch, Select, Space, Button, Divider, Modal, message } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { IProduct, ICategory } from "../../interfaces";
import { ProductImageList } from "../../components/ProductImageList";

export const ProductCreate = () => {
    const { formProps, saveButtonProps, onFinish } = useForm<IProduct>();
    const { mutate: updateCategory } = useUpdate();

    const [isSubCategoryModalVisible, setIsSubCategoryModalVisible] = useState(false);
    const [newSubCategoryName, setNewSubCategoryName] = useState("");
    const [isSubmittingSubCategory, setIsSubmittingSubCategory] = useState(false);

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

        // Check if subcategory already exists
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
                // Automatically select the new subcategory
                formProps.form?.setFieldValue("subCategory", subCategoryId);
            },
            onError: () => {
                setIsSubmittingSubCategory(false);
                message.error("Failed to create subcategory");
            }
        });
    };

    const handleOnFinish = (values: any) => {
        const name = values.name || "";
        const brand = values.brand || "JongTinh";

        // Generate filter tags from attributes
        const filterTags: string[] = [];
        const attributes = (values.attributes || []).map((attr: any) => {
            if (attr.key && attr.value) {
                const vals = attr.value.split(",").map((v: string) => v.trim().toLowerCase()).filter((v: string) => v.length > 0);
                vals.forEach((v: string) => {
                    filterTags.push(`${attr.key.toLowerCase()}_${v}`);
                });
                return {
                    key: attr.key.toLowerCase(),
                    label: attr.key,
                    value: attr.value,
                    displayType: attr.displayType || "TEXT"
                };
            }
            return null;
        }).filter(Boolean);

        onFinish({
            ...values,
            nameLowercase: name.toLowerCase(),
            brandLowercase: brand.toLowerCase(),
            brand: brand,
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
            attributes: attributes,
            filterTags: filterTags,
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
                                    label="Brand"
                                    name="brand"
                                    initialValue="JongTinh"
                                >
                                    <Input placeholder="e.g. JongTinh, Nike, Adidas" />
                                </Form.Item>
                <Form.Item
                    label="Category"
                    name="category"
                    rules={[{ required: true }]}
                >
                    <Select {...categorySelectProps} />
                </Form.Item>

                <Form.Item
                    label="Subcategory"
                    name="subCategory"
                >
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

                <Form.Item label="Colors">
                    <Form.List name="colors">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                                        <Form.Item
                                            {...restField}
                                            name={[name, "name"]}
                                            rules={[{ required: true, message: "Missing color name" }]}
                                        >
                                            <Input placeholder="Color Name (e.g. Matte Red)" style={{ width: 180 }} />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, "hex"]}
                                            rules={[{ required: true, message: "Missing hex code" }]}
                                        >
                                            <Input placeholder="Hex Code (e.g. #C62828)" style={{ width: 150 }} />
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
                                            <Input placeholder="Size" style={{ width: 140 }} />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, "value"]}
                                            rules={[{ required: true, message: "Value required" }]}
                                        >
                                            <Input placeholder="S, M, L, XL" style={{ width: 180 }} />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, "displayType"]}
                                            initialValue="TEXT"
                                        >
                                            <Select style={{ width: 120 }}>
                                                <Select.Option value="TEXT">Text</Select.Option>
                                                <Select.Option value="CHIP">Chip</Select.Option>
                                                <Select.Option value="COLOR">Color</Select.Option>
                                                <Select.Option value="DROPDOWN">Dropdown</Select.Option>
                                            </Select>
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

                <Form.Item
                    label="Is Featured"
                    name="isFeatured"
                    valuePropName="checked"
                >
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
                    placeholder="Enter subcategory name (e.g. T-Shirts)"
                    value={newSubCategoryName}
                    onChange={(e) => setNewSubCategoryName(e.target.value)}
                    onPressEnter={handleAddSubCategory}
                    autoFocus
                />
            </Modal>
        </Create>
    );
};
