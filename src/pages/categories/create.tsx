import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Divider, Space, Button, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import { ICategory } from "../../interfaces";
import { CloudinaryUpload } from "../../components/CloudinaryUpload";
import { useLanguage } from "../../contexts/LanguageContext";

export const CategoryCreate = () => {
    const { t } = useLanguage();
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
                <Form.Item label={t.admin.category.name} name="name" rules={[{ required: true, message: t.admin.category.validation.nameRequired }]}>
                    <Input placeholder="e.g. Electronics" />
                </Form.Item>

                <Divider orientation="left">{t.admin.category.icon}</Divider>

                <Form.Item label={t.admin.category.uploadIcon}>
                    <CloudinaryUpload
                        onUploadComplete={(url) => {
                            form.setFieldValue("icon", url);
                            form.validateFields(["icon"]);
                        }}
                    />
                </Form.Item>

                <Form.Item
                    label={t.admin.category.pasteUrl}
                    name="icon"
                    rules={[{ required: true, type: "url", message: t.admin.category.validation.urlInvalid }]}
                >
                    <Input placeholder="https://example.com/icon.png" />
                </Form.Item>

                <Divider orientation="left">{t.admin.category.subcategories}</Divider>

                <Space style={{ marginBottom: 12 }}>
                    <Input
                        placeholder={t.admin.category.newSubName}
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        onPressEnter={addSubCategory}
                        style={{ width: 250 }}
                    />
                    <Button icon={<PlusOutlined />} onClick={addSubCategory}>
                        {t.admin.category.add}
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

                <Form.Item label={t.admin.category.productCount} name="productCount" initialValue={0}>
                    <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
            </Form>
        </Create>
    );
};
