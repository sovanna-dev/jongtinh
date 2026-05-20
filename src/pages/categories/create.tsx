import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Divider, Space, Button, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import { ICategory } from "../../interfaces";
import { CloudinaryUpload } from "../../components/CloudinaryUpload";

export const CategoryCreate = () => {
    const { formProps, saveButtonProps, onFinish, form } = useForm<ICategory>();
    const [newSubName, setNewSubName] = useState("");
    const [tempSubs, setTempSubs] = useState<{ id: string; name: string }[]>([]);

    const addSubCategory = () => {
        const name = newSubName.trim();
        if (!name) return;
        const id = name.toLowerCase().replace(/\s+/g, "_");
        if (tempSubs.some(s => s.id === id)) return;
        setTempSubs([...tempSubs, { id, name }]);
        setNewSubName("");
    };

    const removeSubCategory = (id: string) => {
        setTempSubs(tempSubs.filter(s => s.id !== id));
    };

    const handleOnFinish = (values: any) => {
        onFinish({
            ...values,
            nameLowercase: values.name.toLowerCase(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            productCount: values.productCount || 0,
            subCategories: tempSubs,
        });
    };

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical" onFinish={handleOnFinish}>
                <Form.Item label="Category Name" name="name" rules={[{ required: true }]}>
                    <Input placeholder="e.g. Electronics" />
                </Form.Item>

                <Divider orientation="left">Category Icon</Divider>

                <Form.Item label="Upload Icon Image">
                    <CloudinaryUpload
                        onUploadComplete={(url) => {
                            form.setFieldValue("icon", url);
                            form.validateFields(["icon"]);
                        }}
                    />
                </Form.Item>

                <Form.Item
                    label="Or Paste Icon URL"
                    name="icon"
                    rules={[{ required: true, type: "url", message: "Please enter a valid image URL" }]}
                >
                    <Input placeholder="https://example.com/icon.png" />
                </Form.Item>

                <Divider orientation="left">Subcategories</Divider>

                <Space style={{ marginBottom: 12 }}>
                    <Input
                        placeholder="New subcategory name"
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        onPressEnter={addSubCategory}
                        style={{ width: 250 }}
                    />
                    <Button icon={<PlusOutlined />} onClick={addSubCategory}>
                        Add
                    </Button>
                </Space>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                    {tempSubs.map((sub) => (
                        <Tag
                            key={sub.id}
                            closable
                            onClose={() => removeSubCategory(sub.id)}
                            color="#FF006E"
                            style={{ padding: "4px 12px", borderRadius: 20 }}
                        >
                            {sub.name}
                        </Tag>
                    ))}
                </div>

                <Form.Item label="Product Count" name="productCount" initialValue={0}>
                    <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
            </Form>
        </Create>
    );
};
