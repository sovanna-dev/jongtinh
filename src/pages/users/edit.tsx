import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Switch, Avatar, Typography, Tag, Select } from "antd";
import { IUser } from "../../interfaces";
import { UserOutlined } from "@ant-design/icons";
import { auth } from "../../firebase";
import { useLanguage } from "../../contexts/LanguageContext";

const { Title, Text } = Typography;

export const UserEdit = () => {
    const { t } = useLanguage();
    const { formProps, saveButtonProps, query: queryResult } = useForm<IUser>();

    const userData = queryResult?.data?.data;
    const isEditingSelf = userData?.id === auth.currentUser?.uid;

    return (
        <Edit saveButtonProps={saveButtonProps} title={t.admin.users.editTitle}>
            <Form {...formProps} layout="vertical">
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Avatar
                        size={120}
                        src={userData?.photoUrl || userData?.profileImage}
                        icon={<UserOutlined />}
                        style={{ marginBottom: 16, border: '4px solid #f0f0f0' }}
                    />
                    <Title level={4} style={{ marginBottom: 4 }}>{userData?.displayName}</Title>
                    <div style={{ marginBottom: 16 }}>
                        <Tag color={userData?.isAdmin ? "red" : "blue"}>
                            {userData?.isAdmin ? t.admin.users.administrator : t.admin.users.standardUser}
                        </Tag>
                    </div>
                    <Text type="secondary">{userData?.email}</Text>
                    {isEditingSelf && (
                        <div style={{ marginTop: 8 }}>
                            <Text type="warning" italic>{t.admin.users.editingSelf}</Text>
                        </div>
                    )}
                </div>

                <Form.Item label={t.admin.users.fullName} name="displayName">
                    <Input disabled />
                </Form.Item>

                <Form.Item label={t.admin.users.email} name="email">
                    <Input disabled />
                </Form.Item>

                <Form.Item
                    label={t.admin.users.adminAccess}
                    name="isAdmin"
                    valuePropName="checked"
                    extra={isEditingSelf
                        ? t.admin.users.revokeWarning
                        : t.admin.users.grantHelp}
                >
                    <Switch
                        checkedChildren={t.admin.users.admin}
                        unCheckedChildren={t.admin.users.user}
                        disabled={isEditingSelf}
                    />
                </Form.Item>

                {/* NEW: Role Selection */}
                <Form.Item
                    label={t.admin.users.adminRole}
                    name="role"
                    rules={[{ required: true }]}
                    extra={t.admin.users.roleHelp}
                >
                    <Select>
                        <Select.Option value="super_admin">{t.admin.users.roles.super_admin}</Select.Option>
                        <Select.Option value="product_manager">{t.admin.users.roles.product_manager}</Select.Option>
                        <Select.Option value="order_manager">{t.admin.users.roles.order_manager}</Select.Option>
                        <Select.Option value="support_agent">{t.admin.users.roles.support_agent}</Select.Option>
                        <Select.Option value="viewer">{t.admin.users.roles.viewer}</Select.Option>
                        <Select.Option value="customer">Customer</Select.Option>
                    </Select>
                </Form.Item>
            </Form>
        </Edit>
    );
};